from fastapi import APIRouter, HTTPException, status
from sqlalchemy.exc import IntegrityError

from app.api.deps import CurrentUser, DbSession
from app.models import User
from app.schemas import UserRead, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead)
def read_me(user: CurrentUser) -> User:
    return user


@router.patch("/me", response_model=UserRead)
def update_me(payload: UserUpdate, user: CurrentUser, db: DbSession) -> User:
    for field, value in payload.model_dump(exclude_unset=True, exclude_none=True).items():
        setattr(user, field, value)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered",
        ) from None
    return user
