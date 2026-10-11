import datetime as dt

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    username: str = Field(min_length=3, max_length=50, pattern=r"^[A-Za-z0-9_]+$")
    email: EmailStr


class UserCreate(UserBase):
    """Registration payload. The plain password never leaves the auth layer."""

    password: str = Field(min_length=8, max_length=128)
    daily_calorie_goal: int = Field(default=2500, ge=800, le=10_000)


class UserUpdate(BaseModel):
    """Partial update: only the provided fields are changed."""

    model_config = ConfigDict(str_strip_whitespace=True)

    email: EmailStr | None = None
    daily_calorie_goal: int | None = Field(default=None, ge=800, le=10_000)


class UserRead(UserBase):
    """Public representation; hashed_password is deliberately excluded."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    daily_calorie_goal: int
    created_at: dt.datetime
