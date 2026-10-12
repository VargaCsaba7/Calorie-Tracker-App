"""Estimates a meal's nutrition from a free-text description with a language model.

Two providers, picked with AI_PROVIDER in .env:
- "ollama":    a free open model running locally with Ollama (default, no API key)
- "anthropic": Claude through the Anthropic API (needs ANTHROPIC_API_KEY)

The model's main job is reading the description: it splits the meal into foods with
amounts, in a fixed JSON schema (structured outputs). Foods that match one of the app's
built-in foods get their numbers from the database, which is more reliable than a small
model's memory; only unknown foods use the model's per-100 g values. The backend adds
up the totals, and the result only pre-fills the meal form for the user to review.
"""

import time
from functools import lru_cache

import anthropic
import httpx
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.schemas.food import EstimateItem, FoodEstimate, ModelEstimate, ModelItem
from app.services.food_match import match_builtin_food

SYSTEM_PROMPT = """Split the meal the user describes (usually Hungarian) into separate foods.

- Return every food once, as its own item with its total weight in grams. Never skip foods:
  side dishes, bread, drinks, toppings and fats all count.
- Words like tányér, szelet, pohár, bögre, darab, adag, doboz are amounts, not foods.
- Use the user's amounts; otherwise typical adult portions. Convert counts to grams
  (1 egg = 55 g, 1 slice of bread = 40 g, 1 banana = 120 g, 1 glass of milk = 250 g,
  1 can of cola = 330 g, 1 slice of pizza = 120 g, a plate of soup = 400 g,
  a portion of chips = 150 g, butter for frying = 10 g).
- Name each food in its simple Hungarian dictionary form.
- Also give each food's typical nutrition per 100 g.

Examples:
"csirkemell rizzsel" -> csirkemell 150 g, rizs 150 g
"2 tojás, egy szelet kenyér és egy kávé tejjel" -> tojás 110 g, kenyér 40 g, kávé 200 g, tej 50 g"""

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


def estimate_food(db: Session, description: str) -> FoodEstimate:
    if settings.ai_provider == "anthropic":
        raw = _estimate_with_claude(description)
    else:
        raw = _estimate_with_ollama(description)

    items = [_resolve_item(db, item) for item in raw.items if item.grams > 0 and item.food.strip()]
    if not items:
        raise AiEstimateError("The AI couldn't recognize any food in the description")

    estimate = FoodEstimate.from_items(description[:100], items)
    if estimate.calories > 10_000:
        raise AiEstimateError("The AI returned values outside the allowed range")
    return estimate


def _resolve_item(db: Session, item: ModelItem) -> EstimateItem:
    """Numbers from the food database when the food is known, otherwise from the model."""
    food = match_builtin_food(db, item.food)
    if food is not None:
        per_100g = (food.kcal_100g, food.protein_100g, food.carbs_100g, food.fat_100g)
    else:
        per_100g = (item.kcal_per_100g, item.protein_per_100g, item.carbs_per_100g, item.fat_per_100g)
    if min(per_100g) < 0 or per_100g[0] > 1000:
        raise AiEstimateError("The AI returned values outside the allowed range")

    factor = item.grams / 100
    kcal, protein, carbs, fat = per_100g
    return EstimateItem(
        name=item.food.strip(),
        grams=round(item.grams),
        calories=round(kcal * factor),
        protein=round(protein * factor, 1),
        carbs=round(carbs * factor, 1),
        fat=round(fat * factor, 1),
        database_food=food.name if food else None,
    )


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


def _estimate_with_ollama(description: str) -> ModelEstimate:
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
                "format": ModelEstimate.model_json_schema(),
                "stream": False,
                # Cap the length: with a JSON format, small models sometimes keep emitting
                # whitespace after the object until they hit the limit.
                "options": {"temperature": 0, "num_predict": 768},
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
        return ModelEstimate.model_validate_json(response.json()["message"]["content"])
    except (KeyError, ValidationError):
        raise AiEstimateError("The local AI model returned an answer the app couldn't read") from None


# --- Claude (Anthropic API) ---------------------------------------------------------


@lru_cache
def _claude_client() -> anthropic.Anthropic:
    return anthropic.Anthropic(api_key=settings.anthropic_api_key, timeout=60.0, max_retries=2)


def _estimate_with_claude(description: str) -> ModelEstimate:
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
        output_format=ModelEstimate,
        **extra,
    )
    if response.stop_reason == "refusal" or response.parsed_output is None:
        raise AiEstimateError("The AI could not estimate this meal")
    return response.parsed_output
