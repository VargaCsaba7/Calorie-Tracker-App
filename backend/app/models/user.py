import datetime as dt
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

if TYPE_CHECKING:
    from app.models.meal import Meal
    from app.models.workout import Workout


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    daily_calorie_goal: Mapped[int] = mapped_column(default=2500)

    # Optional daily macro targets in grams
    protein_goal: Mapped[int | None]
    carbs_goal: Mapped[int | None]
    fat_goal: Mapped[int | None]

    # Body profile, used to estimate calorie needs. All optional.
    sex: Mapped[str | None] = mapped_column(String(10))  # "male" / "female"
    birth_date: Mapped[dt.date | None] = mapped_column(Date)
    height_cm: Mapped[float | None]
    weight_kg: Mapped[float | None]
    activity_level: Mapped[str | None] = mapped_column(String(20))

    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    workouts: Mapped[list["Workout"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    meals: Mapped[list["Meal"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} username={self.username!r}>"
