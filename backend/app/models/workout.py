import datetime as dt
from typing import TYPE_CHECKING

from sqlalchemy import Date, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class Workout(Base):
    __tablename__ = "workouts"
    # Most queries are "workouts of user X in a date range".
    __table_args__ = (Index("ix_workouts_user_id_date", "user_id", "date"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    date: Mapped[dt.date] = mapped_column(Date)
    name: Mapped[str] = mapped_column(String(100))

    user: Mapped["User"] = relationship(back_populates="workouts")
    exercises: Mapped[list["Exercise"]] = relationship(
        back_populates="workout",
        cascade="all, delete-orphan",
        order_by="Exercise.id",
    )

    def __repr__(self) -> str:
        return f"<Workout id={self.id} name={self.name!r} date={self.date}>"


class Exercise(Base):
    __tablename__ = "exercises"

    id: Mapped[int] = mapped_column(primary_key=True)
    workout_id: Mapped[int] = mapped_column(
        ForeignKey("workouts.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(100))

    workout: Mapped["Workout"] = relationship(back_populates="exercises")
    sets: Mapped[list["WorkoutSet"]] = relationship(
        back_populates="exercise",
        cascade="all, delete-orphan",
        order_by="WorkoutSet.id",
    )

    def __repr__(self) -> str:
        return f"<Exercise id={self.id} name={self.name!r}>"


class WorkoutSet(Base):
    __tablename__ = "workout_sets"

    id: Mapped[int] = mapped_column(primary_key=True)
    exercise_id: Mapped[int] = mapped_column(
        ForeignKey("exercises.id", ondelete="CASCADE"), index=True
    )
    weight: Mapped[float]  # kg
    reps: Mapped[int]

    exercise: Mapped["Exercise"] = relationship(back_populates="sets")

    def __repr__(self) -> str:
        return f"<WorkoutSet id={self.id} {self.weight}kg x {self.reps}>"
