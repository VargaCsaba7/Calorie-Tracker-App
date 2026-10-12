from typing import Annotated

import anthropic
from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps import CurrentUser, DbSession
from app.models import Food
from app.schemas import AiStatus, FoodEstimate, FoodEstimateRequest, FoodRead, FoodSearchResult
from app.services.ai_estimate import AiEstimateError, AiNotConfiguredError, ai_enabled, estimate_food
from app.services.food_search import ensure_image, search_foods

router = APIRouter(prefix="/foods", tags=["foods"])


@router.get("/search", response_model=FoodSearchResult)
def search(
    db: DbSession,
    _user: CurrentUser,
    q: Annotated[str, Query(min_length=2, max_length=100)],
) -> FoodSearchResult:
    """Built-in foods first, then packaged products from Open Food Facts."""
    foods, online_ok = search_foods(db, q.strip())
    return FoodSearchResult(
        foods=[FoodRead.model_validate(f) for f in foods],
        online_search_ok=online_ok,
    )


@router.get("/ai-status", response_model=AiStatus)
def ai_status(_user: CurrentUser) -> AiStatus:
    """Lets the frontend hide the AI option when no API key is configured."""
    return AiStatus(enabled=ai_enabled())


@router.post("/estimate", response_model=FoodEstimate)
def estimate(payload: FoodEstimateRequest, _user: CurrentUser) -> FoodEstimate:
    """Estimates calories and macros for a described meal. Nothing is saved."""
    try:
        return estimate_food(payload.description)
    except AiNotConfiguredError as exc:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, f"AI estimates are not available: {exc}") from None
    except AiEstimateError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(exc)) from None
    except anthropic.AuthenticationError:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "The AI API key is invalid") from None
    except anthropic.RateLimitError:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Too many AI requests, try again in a minute") from None
    except (anthropic.APIConnectionError, anthropic.APIStatusError):
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "The AI service is not available right now") from None


@router.get("/{food_id}", response_model=FoodRead)
def get_food(food_id: int, db: DbSession, _user: CurrentUser) -> Food:
    food = db.get(Food, food_id)
    if food is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Food not found")
    ensure_image(db, food)
    return food
