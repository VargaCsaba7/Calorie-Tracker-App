import datetime as dt

from pydantic import BaseModel, ConfigDict, Field


class MealBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=100, examples=["Chicken & rice"])
    date: dt.date
    calories: int = Field(ge=0, le=10_000)
    protein: float = Field(default=0, ge=0, le=1000, description="grams")
    carbs: float = Field(default=0, ge=0, le=1000, description="grams")
    fat: float = Field(default=0, ge=0, le=1000, description="grams")


class MealCreate(MealBase):
    pass


class MealUpdate(BaseModel):
    """Partial update: only the provided fields are changed."""

    model_config = ConfigDict(str_strip_whitespace=True)

    name: str | None = Field(default=None, min_length=1, max_length=100)
    date: dt.date | None = None
    calories: int | None = Field(default=None, ge=0, le=10_000)
    protein: float | None = Field(default=None, ge=0, le=1000)
    carbs: float | None = Field(default=None, ge=0, le=1000)
    fat: float | None = Field(default=None, ge=0, le=1000)


class MealRead(MealBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
