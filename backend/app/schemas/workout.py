import datetime as dt

from pydantic import BaseModel, ConfigDict, Field

# --- WorkoutSet ---------------------------------------------------------------


class WorkoutSetBase(BaseModel):
    weight: float = Field(ge=0, le=1000, description="Weight in kg (0 = bodyweight)")
    reps: int = Field(ge=1, le=1000)


class WorkoutSetCreate(WorkoutSetBase):
    pass


class WorkoutSetRead(WorkoutSetBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


# --- Exercise -----------------------------------------------------------------


class ExerciseBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=100, examples=["Bench press"])


class ExerciseCreate(ExerciseBase):
    sets: list[WorkoutSetCreate] = Field(default_factory=list)


class ExerciseRead(ExerciseBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sets: list[WorkoutSetRead]


# --- Workout ------------------------------------------------------------------


class WorkoutBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=100, examples=["Chest & Biceps"])
    date: dt.date


class WorkoutCreate(WorkoutBase):
    """A whole workout (with its exercises and sets) is created in one request."""

    exercises: list[ExerciseCreate] = Field(default_factory=list)


class WorkoutUpdate(BaseModel):
    """Partial update. If `exercises` is given, it replaces the existing list."""

    model_config = ConfigDict(str_strip_whitespace=True)

    name: str | None = Field(default=None, min_length=1, max_length=100)
    date: dt.date | None = None
    exercises: list[ExerciseCreate] | None = None


class WorkoutRead(WorkoutBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    exercises: list[ExerciseRead]
