"""Estimates a meal's nutrition from a free-text description with a language model.

Two providers, picked with AI_PROVIDER in .env:
- "ollama":    a free open model running locally with Ollama (default, no API key)
- "anthropic": Claude through the Anthropic API (needs ANTHROPIC_API_KEY)

Both answer in the same fixed JSON schema (structured outputs), parsed into the
FoodEstimate Pydantic model. The estimate only pre-fills the meal form; the user
reviews it before saving.
"""

import time
from functools import lru_cache

import anthropic
import httpx
from pydantic import ValidationError

from app.core.config import settings
from app.schemas.food import FoodEstimate

SYSTEM_PROMPT = """You estimate the nutrition of meals for a calorie tracking app.
The user describes what they ate, often in Hungarian.

- Estimate the whole portion they describe. If no amount is given, assume one typical adult portion.
- Base the numbers on standard food composition data for typical recipes.
- Keep calories consistent with the macros (4 kcal per gram of protein and carbohydrate, 9 per gram of fat).
- Write the name and the note in the same language as the user's description.
- Answer only with the JSON object."""

# Claude models that accept the server-side refusal fallback ("default" routing)
_FALLBACK_MODELS = {"claude-opus-5-5", "claude-opus-5", "claude-fable-5-1", "claude-sonnet-5-5"}


class AiNotConfiguredError(Exception):
    """The selected provider isn't set up (no API key, or Ollama/the model is missing)."""


class AiEstimateError(Exception):
    """The model declined or returned something unusable."""


def ai_enabled() -> bool:
    if settings.ai_provider == "anthropic":
        return bool(settings.anthropic_api_key)
    return _ollama_ready()


def estimate_food(description: str) -> FoodEstimate:
    if settings.ai_provider == "anthropic":
        estimate = _estimate_with_claude(description)
    else:
        estimate = _estimate_with_ollama(description)

    numbers = (estimate.portion_grams, estimate.calories, estimate.protein, estimate.carbs, estimate.fat)
    if any(n < 0 for n in numbers) or estimate.calories > 10_000:
        raise AiEstimateError("The AI returned values outside the allowed range")
    return estimate


# --- Ollama (local) -------------------------------------------------------------

_ollama_status: tuple[float, bool] = (0.0, False)


def _ollama_ready() -> bool:
    """True if Ollama is running and the model is downloaded. Cached for 30 s."""
    global _ollama_status
    checked_at, ready = _ollama_status
    if time.monotonic() - checked_at < 30:
        return ready
    try:
        response = httpx.get(f"{settings.ollama_url}/api/tags", timeout=1.5)
        response.raise_for_status()
        names = {m["name"] for m in response.json().get("models", [])}
        ready = settings.ollama_model in names or f"{settings.ollama_model}:latest" in names
    except httpx.HTTPError:
        ready = False
    _ollama_status = (time.monotonic(), ready)
    return ready


def _estimate_with_ollama(description: str) -> FoodEstimate:
    try:
        response = httpx.post(
            f"{settings.ollama_url}/api/chat",
            json={
                "model": settings.ollama_model,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": description},
                ],
                # Ollama constrains the output to this JSON schema
                "format": FoodEstimate.model_json_schema(),
                "stream": False,
                "options": {"temperature": 0},
            },
            # The first request also loads the model into memory, which takes a while
            timeout=httpx.Timeout(120.0, connect=3.0),
        )
    except httpx.ConnectError:
        raise AiNotConfiguredError("Ollama is not running") from None
    except httpx.TimeoutException:
        raise AiEstimateError("The local AI model took too long to answer") from None

    if response.status_code == 404:
        raise AiNotConfiguredError(f"The model {settings.ollama_model} is not downloaded")
    response.raise_for_status()

    try:
        return FoodEstimate.model_validate_json(response.json()["message"]["content"])
    except (KeyError, ValidationError):
        raise AiEstimateError("The local AI model returned an answer the app couldn't read") from None


# --- Claude (Anthropic API) ---------------------------------------------------------


@lru_cache
def _claude_client() -> anthropic.Anthropic:
    return anthropic.Anthropic(api_key=settings.anthropic_api_key, timeout=60.0, max_retries=2)


def _estimate_with_claude(description: str) -> FoodEstimate:
    if not settings.anthropic_api_key:
        raise AiNotConfiguredError("No Anthropic API key is set")

    extra: dict = {}
    if settings.anthropic_model in _FALLBACK_MODELS:
        extra = {"betas": ["server-side-fallback-2026-07-01"], "fallbacks": "default"}

    response = _claude_client().beta.messages.parse(
        model=settings.anthropic_model,
        max_tokens=16000,
        # A quick estimate doesn't need deep reasoning
        output_config={"effort": "low"},
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": description}],
        output_format=FoodEstimate,
        **extra,
    )
    if response.stop_reason == "refusal" or response.parsed_output is None:
        raise AiEstimateError("The AI could not estimate this meal")
    return response.parsed_output
