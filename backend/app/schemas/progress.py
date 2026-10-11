import datetime as dt

from pydantic import BaseModel, ConfigDict, Field


class RestDayRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    date: dt.date


class WeightEntryWrite(BaseModel):
    weight_kg: float = Field(ge=30, le=300)


class WeightEntryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    date: dt.date
    weight_kg: float


class WeeklyStats(BaseModel):
    """Totals and averages for one Monday-Sunday week."""

    week_start: dt.date
    workouts: int
    volume_kg: float
    rest_days: int
    # Averages over the days that have meals logged (None if no day was logged)
    days_logged: int
    avg_calories: int | None
    avg_protein: float | None
    # Average of the weigh-ins that week
    avg_weight_kg: float | None
