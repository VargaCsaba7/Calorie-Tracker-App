import datetime as dt

from pydantic import BaseModel, ConfigDict, Field, model_validator


class MealBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=100, examples=["Chicken & rice"])
    date: dt.date
    calories: int = Field(ge=0, le=10_000)
    protein: float = Field(default=0, ge=0, le=1000, description="grams")
    carbs: float = Field(default=0, ge=0, le=1000, description="grams")
    fat: float = Field(default=0, ge=0, le=1000, description="grams")


class MealCreate(BaseModel):
    """Either pick a food and an amount (food_id + grams), or enter the numbers by hand."""

    model_config = ConfigDict(str_strip_whitespace=True)

    date: dt.date
    food_id: int | None = None
    grams: float | None = Field(default=None, gt=0, le=5000)

    name: str | None = Field(default=None, min_length=1, max_length=100)
    calories: int | None = Field(default=None, ge=0, le=10_000)
    protein: float = Field(default=0, ge=0, le=1000)
    carbs: float = Field(default=0, ge=0, le=1000)
    fat: float = Field(default=0, ge=0, le=1000)

    @model_validator(mode="after")
    def _food_or_manual(self) -> "MealCreate":
        if self.food_id is not None:
            if self.grams is None:
                raise ValueError("grams is required when food_id is given")
        elif self.name is None or self.calories is None:
            raise ValueError("name and calories are required without a food_id")
        return self


class MealUpdate(BaseModel):
    """Partial update: only the provided fields are changed.

    For a meal picked from the food database, changing grams recalculates the numbers.
    """

    model_config = ConfigDict(str_strip_whitespace=True)

    name: str | None = Field(default=None, min_length=1, max_length=100)
    date: dt.date | None = None
    grams: float | None = Field(default=None, gt=0, le=5000)
    calories: int | None = Field(default=None, ge=0, le=10_000)
    protein: float | None = Field(default=None, ge=0, le=1000)
    carbs: float | None = Field(default=None, ge=0, le=1000)
    fat: float | None = Field(default=None, ge=0, le=1000)


class MealFood(BaseModel):
    """The bits of the linked food the meal list shows."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    image_url: str | None
    emoji: str | None
    brand: str | None


class MealRead(MealBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    grams: float | None
    food: MealFood | None


class DailyNutritionSummary(BaseModel):
    """Totals for one day, compared against the user's calorie goal."""

    date: dt.date
    calories: int
    protein: float
    carbs: float
    fat: float
    meal_count: int
    calorie_goal: int
    calories_remaining: int
