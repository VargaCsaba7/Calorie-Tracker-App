from typing import Annotated, Literal

from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps import CurrentUser, DbSession
from app.models import ExerciseInfo
from app.schemas.exercise_info import ExerciseInfoList, ExerciseInfoRead
from app.services.exercise_library import MUSCLE_GROUPS, find_by_name, image_urls, list_exercises

router = APIRouter(prefix="/exercise-library", tags=["exercise library"])

MuscleGroup = Literal[tuple(MUSCLE_GROUPS)]  # type: ignore[valid-type]


def _read(exercise: ExerciseInfo) -> ExerciseInfoRead:
    return ExerciseInfoRead(
        id=exercise.id,
        name=exercise.name,
        muscle_group=exercise.muscle_group,
        category=exercise.category,
        level=exercise.level,
        equipment=exercise.equipment,
        force=exercise.force,
        mechanic=exercise.mechanic,
        primary_muscles=exercise.primary_muscles,
        secondary_muscles=exercise.secondary_muscles,
        instructions=exercise.instructions,
        image_urls=image_urls(exercise),
    )


@router.get("", response_model=ExerciseInfoList)
def browse(
    db: DbSession,
    _user: CurrentUser,
    group: MuscleGroup | None = None,
    q: Annotated[str | None, Query(max_length=60)] = None,
    category: Annotated[str | None, Query(max_length=30)] = None,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=60)] = 24,
) -> ExerciseInfoList:
    """Exercises filtered by muscle group, name and type (strength, stretching, ...)."""
    items, total = list_exercises(db, group=group, query=q, category=category, skip=skip, limit=limit)
    return ExerciseInfoList(items=[_read(e) for e in items], total=total)


# Declared before /{exercise_id} so "match" isn't read as an id
@router.get("/match", response_model=ExerciseInfoRead)
def match(db: DbSession, _user: CurrentUser, name: Annotated[str, Query(min_length=2, max_length=100)]) -> ExerciseInfoRead:
    """The library entry for a name typed in a workout ("Fekvenyomás", "Bench press")."""
    exercise = find_by_name(db, name)
    if exercise is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No matching exercise in the library")
    return _read(exercise)


@router.get("/{exercise_id}", response_model=ExerciseInfoRead)
def get_exercise(exercise_id: str, db: DbSession, _user: CurrentUser) -> ExerciseInfoRead:
    exercise = db.get(ExerciseInfo, exercise_id)
    if exercise is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Exercise not found")
    return _read(exercise)
