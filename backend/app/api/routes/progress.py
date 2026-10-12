import datetime as dt
from typing import Annotated

from fastapi import APIRouter, Query, Response, status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, DbSession
from app.models import RestDay, User, WeightEntry
from app.schemas import PersonalRecord, RestDayRead, WeeklyStats, WeightEntryRead, WeightEntryWrite
from app.services.stats import personal_records, weekly_stats

router = APIRouter(tags=["progress"])


# --- Rest days ------------------------------------------------------------------


@router.get("/rest-days", response_model=list[RestDayRead])
def list_rest_days(
    db: DbSession,
    user: CurrentUser,
    date_from: dt.date | None = None,
    date_to: dt.date | None = None,
) -> list[RestDay]:
    stmt = select(RestDay).where(RestDay.user_id == user.id).order_by(RestDay.date)
    if date_from:
        stmt = stmt.where(RestDay.date >= date_from)
    if date_to:
        stmt = stmt.where(RestDay.date <= date_to)
    return list(db.scalars(stmt))


@router.put("/rest-days/{day}", response_model=RestDayRead)
def mark_rest_day(day: dt.date, db: DbSession, user: CurrentUser) -> RestDay:
    """Idempotent: marking the same day twice is fine."""
    rest_day = db.scalar(select(RestDay).where(RestDay.user_id == user.id, RestDay.date == day))
    if rest_day is None:
        rest_day = RestDay(user_id=user.id, date=day)
        db.add(rest_day)
        db.commit()
    return rest_day


@router.delete("/rest-days/{day}", status_code=status.HTTP_204_NO_CONTENT)
def unmark_rest_day(day: dt.date, db: DbSession, user: CurrentUser) -> Response:
    db.execute(delete(RestDay).where(RestDay.user_id == user.id, RestDay.date == day))
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --- Body weight ----------------------------------------------------------------


def _sync_current_weight(db: Session, user: User) -> None:
    """The profile weight (used for calorie needs) follows the latest weigh-in."""
    latest = db.scalar(
        select(WeightEntry.weight_kg)
        .where(WeightEntry.user_id == user.id)
        .order_by(WeightEntry.date.desc())
        .limit(1)
    )
    if latest is not None:
        user.weight_kg = latest


@router.get("/weights", response_model=list[WeightEntryRead])
def list_weights(
    db: DbSession,
    user: CurrentUser,
    date_from: dt.date | None = None,
    date_to: dt.date | None = None,
) -> list[WeightEntry]:
    stmt = select(WeightEntry).where(WeightEntry.user_id == user.id).order_by(WeightEntry.date)
    if date_from:
        stmt = stmt.where(WeightEntry.date >= date_from)
    if date_to:
        stmt = stmt.where(WeightEntry.date <= date_to)
    return list(db.scalars(stmt))


@router.put("/weights/{day}", response_model=WeightEntryRead)
def save_weight(day: dt.date, payload: WeightEntryWrite, db: DbSession, user: CurrentUser) -> WeightEntry:
    """Create or replace the weigh-in for a day."""
    entry = db.scalar(select(WeightEntry).where(WeightEntry.user_id == user.id, WeightEntry.date == day))
    if entry is None:
        entry = WeightEntry(user_id=user.id, date=day, weight_kg=payload.weight_kg)
        db.add(entry)
    else:
        entry.weight_kg = payload.weight_kg
    db.flush()
    _sync_current_weight(db, user)
    db.commit()
    return entry


@router.delete("/weights/{day}", status_code=status.HTTP_204_NO_CONTENT)
def delete_weight(day: dt.date, db: DbSession, user: CurrentUser) -> Response:
    db.execute(delete(WeightEntry).where(WeightEntry.user_id == user.id, WeightEntry.date == day))
    _sync_current_weight(db, user)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --- Weekly stats ---------------------------------------------------------------


@router.get("/stats/records", response_model=list[PersonalRecord])
def get_personal_records(db: DbSession, user: CurrentUser) -> list[PersonalRecord]:
    """Best set per exercise, strongest (by estimated 1RM) first."""
    return personal_records(db, user.id)


@router.get("/stats/weekly", response_model=list[WeeklyStats])
def get_weekly_stats(
    db: DbSession,
    user: CurrentUser,
    weeks: Annotated[int, Query(ge=1, le=52)] = 12,
) -> list[WeeklyStats]:
    """One row per week, oldest first, ending with the current week."""
    return weekly_stats(db, user.id, weeks=weeks, today=dt.date.today())
