import datetime as dt
from typing import Annotated

from pydantic import AfterValidator, BaseModel, ConfigDict, EmailStr, Field, computed_field

from app.services.energy import ActivityLevel, EnergyEstimate, Sex, age_on, estimate_energy


def _check_birth_date(value: dt.date | None) -> dt.date | None:
    if value is not None and not 13 <= age_on(value, dt.date.today()) <= 100:
        raise ValueError("age must be between 13 and 100")
    return value


BirthDate = Annotated[dt.date | None, AfterValidator(_check_birth_date)]
MacroGoal = Annotated[int | None, Field(ge=0, le=1000)]


class UserBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    username: str = Field(min_length=3, max_length=50, pattern=r"^[A-Za-z0-9_]+$")
    email: EmailStr


class UserCreate(UserBase):
    """Registration payload. The plain password never leaves the auth layer."""

    password: str = Field(min_length=8, max_length=128)
    daily_calorie_goal: int = Field(default=2500, ge=800, le=10_000)


class UserProfile(BaseModel):
    """Goals and body data. Every field is optional."""

    protein_goal: MacroGoal = None
    carbs_goal: MacroGoal = None
    fat_goal: MacroGoal = None

    sex: Sex | None = None
    birth_date: BirthDate = None
    height_cm: float | None = Field(default=None, ge=100, le=250)
    weight_kg: float | None = Field(default=None, ge=30, le=300)
    activity_level: ActivityLevel | None = None


class UserUpdate(UserProfile):
    """Partial update: only the fields sent are changed. Sending null clears a profile field."""

    model_config = ConfigDict(str_strip_whitespace=True)

    email: EmailStr | None = None
    daily_calorie_goal: int | None = Field(default=None, ge=800, le=10_000)


class UserRead(UserBase, UserProfile):
    """Public representation; hashed_password is deliberately excluded."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    daily_calorie_goal: int
    created_at: dt.datetime

    @computed_field  # type: ignore[prop-decorator]
    @property
    def energy(self) -> EnergyEstimate | None:
        """BMR and maintenance calories, once the body profile is complete."""
        return estimate_energy(
            sex=self.sex,
            birth_date=self.birth_date,
            height_cm=self.height_cm,
            weight_kg=self.weight_kg,
            activity_level=self.activity_level,
        )
