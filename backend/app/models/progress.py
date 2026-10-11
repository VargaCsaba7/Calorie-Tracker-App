import datetime as dt
from typing import TYPE_CHECKING

from sqlalchemy import Date, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class RestDay(Base):
    """A day the user planned not to train (so it doesn't count as missed)."""

    __tablename__ = "rest_days"
    __table_args__ = (UniqueConstraint("user_id", "date", name="uq_rest_days_user_date"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    date: Mapped[dt.date] = mapped_column(Date)

    user: Mapped["User"] = relationship(back_populates="rest_days")


class WeightEntry(Base):
    """One body weight measurement. At most one per day."""

    __tablename__ = "weight_entries"
    __table_args__ = (UniqueConstraint("user_id", "date", name="uq_weight_entries_user_date"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    date: Mapped[dt.date] = mapped_column(Date)
    weight_kg: Mapped[float]

    user: Mapped["User"] = relationship(back_populates="weight_entries")
