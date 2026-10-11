import datetime as dt
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import CurrentUser, DbSession
from app.models import Exercise, User, Workout, WorkoutSet
from app.schemas import ExerciseCreate, WorkoutCreate, WorkoutRead, WorkoutUpdate

router = APIRouter(prefix="/workouts", tags=["workouts"])

# Load exercises and their sets in 2 extra queries instead of one per row (N+1).
_load_tree = selectinload(Workout.exercises).selectinload(Exercise.sets)


def _build_exercises(items: list[ExerciseCreate]) -> list[Exercise]:
    return [
        Exercise(name=item.name, sets=[WorkoutSet(**s.model_dump()) for s in item.sets])
        for item in items
    ]


def _get_owned_workout(db: Session, workout_id: int, user: User) -> Workout:
    # Filtering by user_id too means other users' workouts look like a 404,
    # so the API doesn't leak which ids exist.
    workout = db.scalar(
        select(Workout)
        .where(Workout.id == workout_id, Workout.user_id == user.id)
        .options(_load_tree)
    )
    if workout is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workout not found")
    return workout


@router.get("", response_model=list[WorkoutRead])
def list_workouts(
    db: DbSession,
    user: CurrentUser,
    date_from: dt.date | None = None,
    date_to: dt.date | None = None,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
) -> list[Workout]:
    stmt = (
        select(Workout)
        .where(Workout.user_id == user.id)
        .options(_load_tree)
        .order_by(Workout.date.desc(), Workout.id.desc())
    )
    if date_from:
        stmt = stmt.where(Workout.date >= date_from)
    if date_to:
        stmt = stmt.where(Workout.date <= date_to)
    return list(db.scalars(stmt.offset(skip).limit(limit)))


@router.post("", response_model=WorkoutRead, status_code=status.HTTP_201_CREATED)
def create_workout(payload: WorkoutCreate, db: DbSession, user: CurrentUser) -> Workout:
    workout = Workout(
        user_id=user.id,
        name=payload.name,
        date=payload.date,
        exercises=_build_exercises(payload.exercises),
    )
    db.add(workout)
    db.commit()
    return workout


@router.get("/{workout_id}", response_model=WorkoutRead)
def get_workout(workout_id: int, db: DbSession, user: CurrentUser) -> Workout:
    return _get_owned_workout(db, workout_id, user)


@router.patch("/{workout_id}", response_model=WorkoutRead)
def update_workout(
    workout_id: int, payload: WorkoutUpdate, db: DbSession, user: CurrentUser
) -> Workout:
    workout = _get_owned_workout(db, workout_id, user)
    changes = payload.model_dump(exclude_unset=True, exclude_none=True, exclude={"exercises"})
    for field, value in changes.items():
        setattr(workout, field, value)
    if payload.exercises is not None:
        # delete-orphan cascade removes the old exercises and sets
        workout.exercises = _build_exercises(payload.exercises)
    db.commit()
    return workout


@router.delete("/{workout_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workout(workout_id: int, db: DbSession, user: CurrentUser) -> Response:
    workout = _get_owned_workout(db, workout_id, user)
    db.delete(workout)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
