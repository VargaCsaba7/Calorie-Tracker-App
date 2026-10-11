"""Estimates a meal's nutrition from a free-text description with Claude.

The model answers in a fixed JSON schema (structured outputs), which the SDK parses
straight into the FoodEstimate Pydantic model. The estimate only pre-fills the meal
form; the user reviews it before saving.
"""

from functools import lru_cache

import anthropic

from app.core.config import settings
from app.schemas.food import FoodEstimate

SYSTEM_PROMPT = """You estimate the nutrition of meals for a calorie tracking app.
The user describes what they ate, often in Hungarian.

- Estimate the whole portion they describe. If no amount is given, assume one typical adult portion.
- Base the numbers on standard food composition data for typical recipes.
- Keep calories consistent with the macros (4 kcal per gram of protein and carbohydrate, 9 per gram of fat).
- Write the name and the note in the same language as the user's description."""

# Models that accept the server-side refusal fallback ("default" routing)
_FALLBACK_MODELS = {"claude-opus-5-5", "claude-opus-5", "claude-fable-5-1", "claude-sonnet-5-5"}


class AiNotConfiguredError(Exception):
    """No API key is set, so the AI estimate is turned off."""


class AiEstimateError(Exception):
    """The model declined or returned something unusable."""


def ai_enabled() -> bool:
    return bool(settings.anthropic_api_key)


@lru_cache
def _client() -> anthropic.Anthropic:
    return anthropic.Anthropic(api_key=settings.anthropic_api_key, timeout=60.0, max_retries=2)


def estimate_food(description: str) -> FoodEstimate:
    if not ai_enabled():
        raise AiNotConfiguredError

    extra: dict = {}
    if settings.ai_model in _FALLBACK_MODELS:
        extra = {"betas": ["server-side-fallback-2026-07-01"], "fallbacks": "default"}

    response = _client().beta.messages.parse(
        model=settings.ai_model,
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

    estimate = response.parsed_output
    numbers = (estimate.portion_grams, estimate.calories, estimate.protein, estimate.carbs, estimate.fat)
    if any(n < 0 for n in numbers) or estimate.calories > 10_000:
        raise AiEstimateError("The AI returned values outside the allowed range")
    return estimate
