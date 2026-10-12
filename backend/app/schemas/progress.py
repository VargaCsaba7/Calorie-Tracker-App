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


class PersonalRecord(BaseModel):
    """Best performance on one exercise across all workouts."""

    exercise: str
    # Heaviest set (most reps breaks ties). For bodyweight exercises weight is 0.
    best_weight: float
    best_weight_reps: int
    best_weight_date: dt.date
    # Epley estimate: weight x (1 + reps / 30), from sets of 1-12 reps
    estimated_1rm: float | None
    max_reps: int
    times_trained: int


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
