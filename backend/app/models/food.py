import datetime as dt

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class Food(Base):
    """A food with nutrition values per 100 g.

    source = "builtin": common foods shipped with the app (seeded by a migration)
    source = "off":     products cached from Open Food Facts, keyed by barcode
    """

    __tablename__ = "foods"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(150), index=True)
    brand: Mapped[str | None] = mapped_column(String(100))
    source: Mapped[str] = mapped_column(String(10))
    external_id: Mapped[str | None] = mapped_column(String(32), unique=True)
    image_url: Mapped[str | None] = mapped_column(String(300))
    emoji: Mapped[str | None] = mapped_column(String(8))
    kcal_100g: Mapped[float]
    protein_100g: Mapped[float]
    carbs_100g: Mapped[float]
    fat_100g: Mapped[float]
    # A typical portion, to pre-fill the grams field (e.g. one egg = 55 g)
    serving_g: Mapped[float | None]
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self) -> str:
        return f"<Food id={self.id} name={self.name!r} source={self.source}>"
