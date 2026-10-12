import datetime as dt
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, DbSession
from app.models import Food, Meal, User
from app.schemas import DailyNutritionSummary, MealCreate, MealRead, MealUpdate

router = APIRouter(prefix="/meals", tags=["meals"])


def _get_owned_meal(db: Session, meal_id: int, user: User) -> Meal:
    meal = db.scalar(select(Meal).where(Meal.id == meal_id, Meal.user_id == user.id))
    if meal is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meal not found")
    return meal


@router.get("", response_model=list[MealRead])
def list_meals(
    db: DbSession,
    user: CurrentUser,
    date_from: dt.date | None = None,
    date_to: dt.date | None = None,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=200)] = 100,
) -> list[Meal]:
    stmt = (
        select(Meal)
        .where(Meal.user_id == user.id)
        .order_by(Meal.date.desc(), Meal.id.desc())
    )
    if date_from:
        stmt = stmt.where(Meal.date >= date_from)
    if date_to:
        stmt = stmt.where(Meal.date <= date_to)
    return list(db.scalars(stmt.offset(skip).limit(limit)))


# Declared before /{meal_id} so "summary" isn't matched as an id.
@router.get("/summary", response_model=DailyNutritionSummary)
def daily_summary(
    db: DbSession,
    user: CurrentUser,
    day: Annotated[dt.date | None, Query(alias="date")] = None,
) -> DailyNutritionSummary:
    """Total calories and macros for a day (defaults to today)."""
    day = day or dt.date.today()
    # The aggregation runs in the database instead of loading every meal row.
    calories, protein, carbs, fat, meal_count = db.execute(
        select(
            func.coalesce(func.sum(Meal.calories), 0),
            func.coalesce(func.sum(Meal.protein), 0),
            func.coalesce(func.sum(Meal.carbs), 0),
            func.coalesce(func.sum(Meal.fat), 0),
            func.count(Meal.id),
        ).where(Meal.user_id == user.id, Meal.date == day)
    ).one()
    return DailyNutritionSummary(
        date=day,
        calories=int(calories),
        protein=round(float(protein), 1),
        carbs=round(float(carbs), 1),
        fat=round(float(fat), 1),
        meal_count=meal_count,
        calorie_goal=user.daily_calorie_goal,
        calories_remaining=user.daily_calorie_goal - int(calories),
    )


def _apply_food(meal: Meal, food: Food, grams: float) -> None:
    """Copies the food's per-100 g values, scaled to the eaten amount, onto the meal."""
    factor = grams / 100
    meal.grams = grams
    meal.calories = round(food.kcal_100g * factor)
    meal.protein = round(food.protein_100g * factor, 1)
    meal.carbs = round(food.carbs_100g * factor, 1)
    meal.fat = round(food.fat_100g * factor, 1)


@router.post("", response_model=MealRead, status_code=status.HTTP_201_CREATED)
def create_meal(payload: MealCreate, db: DbSession, user: CurrentUser) -> Meal:
    if payload.food_id is not None:
        food = db.get(Food, payload.food_id)
        if food is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Food not found")
        meal = Meal(user_id=user.id, date=payload.date, food=food, name=(payload.name or food.name)[:100])
        _apply_food(meal, food, payload.grams or 100)
    else:
        meal = Meal(
            user_id=user.id,
            **payload.model_dump(include={"date", "name", "calories", "protein", "carbs", "fat"}),
        )
    db.add(meal)
    db.commit()
    return meal


@router.get("/{meal_id}", response_model=MealRead)
def get_meal(meal_id: int, db: DbSession, user: CurrentUser) -> Meal:
    return _get_owned_meal(db, meal_id, user)


@router.patch("/{meal_id}", response_model=MealRead)
def update_meal(meal_id: int, payload: MealUpdate, db: DbSession, user: CurrentUser) -> Meal:
    meal = _get_owned_meal(db, meal_id, user)
    changes = payload.model_dump(exclude_unset=True, exclude_none=True)
    grams = changes.pop("grams", None)
    for field, value in changes.items():
        setattr(meal, field, value)
    if grams is not None:
        if meal.food is not None:
            _apply_food(meal, meal.food, grams)
        else:
            meal.grams = grams
    db.commit()
    return meal


@router.delete("/{meal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meal(meal_id: int, db: DbSession, user: CurrentUser) -> Response:
    meal = _get_owned_meal(db, meal_id, user)
    db.delete(meal)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
