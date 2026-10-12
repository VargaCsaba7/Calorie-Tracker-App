from sqlalchemy import JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class ExerciseInfo(Base):
    """One exercise of the built-in exercise library (read-only reference data)."""

    __tablename__ = "exercise_library"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)  # slug from the dataset
    name: Mapped[str] = mapped_column(String(100), index=True)
    # The filter group shown in the app (chest, back, quads, ...), from the first primary muscle
    muscle_group: Mapped[str] = mapped_column(String(20), index=True)
    category: Mapped[str] = mapped_column(String(30))
    level: Mapped[str] = mapped_column(String(20))
    equipment: Mapped[str | None] = mapped_column(String(30))
    force: Mapped[str | None] = mapped_column(String(10))
    mechanic: Mapped[str | None] = mapped_column(String(20))
    primary_muscles: Mapped[list[str]] = mapped_column(JSON)
    secondary_muscles: Mapped[list[str]] = mapped_column(JSON)
    instructions: Mapped[list[str]] = mapped_column(JSON)
    images: Mapped[list[str]] = mapped_column(JSON)  # paths relative to the image base URL
