"""Calorie needs from a user's body profile.

BMR uses the Mifflin-St Jeor equation, the one most dietitians use today.
Maintenance calories (TDEE) = BMR x an activity factor.
"""

import datetime as dt
from typing import Literal

from pydantic import BaseModel

Sex = Literal["male", "female"]
ActivityLevel = Literal["sedentary", "light", "moderate", "active", "very_active"]

ACTIVITY_FACTORS: dict[str, float] = {
    "sedentary": 1.2,  # desk job, little exercise
    "light": 1.375,  # exercise 1-3 days a week
    "moderate": 1.55,  # exercise 3-5 days a week
    "active": 1.725,  # hard exercise 6-7 days a week
    "very_active": 1.9,  # physical job plus training
}


class EnergyEstimate(BaseModel):
    age: int
    bmr: int
    maintenance_calories: int


def age_on(birth_date: dt.date, today: dt.date) -> int:
    had_birthday = (today.month, today.day) >= (birth_date.month, birth_date.day)
    return today.year - birth_date.year - (0 if had_birthday else 1)


def bmr_mifflin_st_jeor(sex: str, weight_kg: float, height_cm: float, age: int) -> float:
    base = 10 * weight_kg + 6.25 * height_cm - 5 * age
    return base + 5 if sex == "male" else base - 161


def estimate_energy(
    *,
    sex: str | None,
    birth_date: dt.date | None,
    height_cm: float | None,
    weight_kg: float | None,
    activity_level: str | None,
    today: dt.date | None = None,
) -> EnergyEstimate | None:
    """Returns None until every profile field needed for the formula is filled in."""
    if not (sex and birth_date and height_cm and weight_kg and activity_level):
        return None

    age = age_on(birth_date, today or dt.date.today())
    bmr = bmr_mifflin_st_jeor(sex, weight_kg, height_cm, age)
    return EnergyEstimate(
        age=age,
        bmr=round(bmr),
        maintenance_calories=round(bmr * ACTIVITY_FACTORS[activity_level]),
    )
