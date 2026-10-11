import datetime as dt
from typing import TYPE_CHECKING

from sqlalchemy import Date, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class Meal(Base):
    __tablename__ = "meals"
    # Daily totals are computed per user per date, so index both together.
    __table_args__ = (Index("ix_meals_user_id_date", "user_id", "date"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    date: Mapped[dt.date] = mapped_column(Date)
    name: Mapped[str] = mapped_column(String(100))
    calories: Mapped[int]
    protein: Mapped[float] = mapped_column(default=0)  # grams
    carbs: Mapped[float] = mapped_column(default=0)  # grams
    fat: Mapped[float] = mapped_column(default=0)  # grams

    user: Mapped["User"] = relationship(back_populates="meals")

    def __repr__(self) -> str:
        return f"<Meal id={self.id} name={self.name!r} kcal={self.calories}>"
