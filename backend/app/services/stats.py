"""Weekly progress numbers for the profile charts."""

import datetime as dt
from collections import defaultdict

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Exercise, Meal, RestDay, WeightEntry, Workout, WorkoutSet
from app.schemas import PersonalRecord, WeeklyStats


def week_start(day: dt.date) -> dt.date:
    """Monday of the day's week."""
    return day - dt.timedelta(days=day.weekday())


def weekly_stats(db: Session, user_id: int, *, weeks: int, today: dt.date) -> list[WeeklyStats]:
    first_monday = week_start(today) - dt.timedelta(weeks=weeks - 1)
    end = week_start(today) + dt.timedelta(days=6)

    # Each query aggregates in the database as far as it can (per day / per workout);
    # grouping days into weeks happens here, which keeps the SQL portable across databases.
    daily_meals = db.execute(
        select(Meal.date, func.sum(Meal.calories), func.sum(Meal.protein))
        .where(Meal.user_id == user_id, Meal.date.between(first_monday, end))
        .group_by(Meal.date)
    ).all()

    workout_volumes = db.execute(
        select(Workout.date, func.coalesce(func.sum(WorkoutSet.weight * WorkoutSet.reps), 0))
        .select_from(Workout)
        .outerjoin(Exercise, Exercise.workout_id == Workout.id)
        .outerjoin(WorkoutSet, WorkoutSet.exercise_id == Exercise.id)
        .where(Workout.user_id == user_id, Workout.date.between(first_monday, end))
        .group_by(Workout.id, Workout.date)
    ).all()

    rest_days = db.scalars(
        select(RestDay.date).where(RestDay.user_id == user_id, RestDay.date.between(first_monday, end))
    ).all()

    weigh_ins = db.execute(
        select(WeightEntry.date, WeightEntry.weight_kg).where(
            WeightEntry.user_id == user_id, WeightEntry.date.between(first_monday, end)
        )
    ).all()

    calories: dict[dt.date, list[float]] = defaultdict(list)
    protein: dict[dt.date, list[float]] = defaultdict(list)
    for day, kcal, prot in daily_meals:
        calories[week_start(day)].append(float(kcal))
        protein[week_start(day)].append(float(prot))

    workouts: dict[dt.date, int] = defaultdict(int)
    volume: dict[dt.date, float] = defaultdict(float)
    for day, vol in workout_volumes:
        workouts[week_start(day)] += 1
        volume[week_start(day)] += float(vol)

    rests: dict[dt.date, int] = defaultdict(int)
    for day in rest_days:
        rests[week_start(day)] += 1

    weights: dict[dt.date, list[float]] = defaultdict(list)
    for day, kg in weigh_ins:
        weights[week_start(day)].append(kg)

    def avg(values: list[float]) -> float | None:
        return sum(values) / len(values) if values else None

    result = []
    for i in range(weeks):
        monday = first_monday + dt.timedelta(weeks=i)
        avg_kcal = avg(calories[monday])
        avg_prot = avg(protein[monday])
        avg_kg = avg(weights[monday])
        result.append(
            WeeklyStats(
                week_start=monday,
                workouts=workouts[monday],
                volume_kg=round(volume[monday], 1),
                rest_days=rests[monday],
                days_logged=len(calories[monday]),
                avg_calories=round(avg_kcal) if avg_kcal is not None else None,
                avg_protein=round(avg_prot, 1) if avg_prot is not None else None,
                avg_weight_kg=round(avg_kg, 1) if avg_kg is not None else None,
            )
        )
    return result


def epley_1rm(weight: float, reps: int) -> float:
    """Estimated one-rep max. Only meaningful for 1-12 reps with real weight."""
    return weight * (1 + reps / 30) if reps > 1 else weight


def personal_records(db: Session, user_id: int) -> list[PersonalRecord]:
    """Best set per exercise. Exercise names are matched case-insensitively."""
    rows = db.execute(
        select(Exercise.name, WorkoutSet.weight, WorkoutSet.reps, Workout.date, Workout.id)
        .select_from(WorkoutSet)
        .join(Exercise, WorkoutSet.exercise_id == Exercise.id)
        .join(Workout, Exercise.workout_id == Workout.id)
        .where(Workout.user_id == user_id)
        .order_by(Workout.date)
    ).all()

    groups: dict[str, list] = defaultdict(list)
    for row in rows:
        groups[row.name.strip().lower()].append(row)

    records = []
    for sets in groups.values():
        # Heaviest weight, then most reps; the earliest date it was reached (rows are date-ordered)
        best = max(sets, key=lambda s: (s.weight, s.reps))
        first_reached = next(s for s in sets if (s.weight, s.reps) == (best.weight, best.reps))
        e1rm_candidates = [epley_1rm(s.weight, s.reps) for s in sets if s.weight > 0 and 1 <= s.reps <= 12]
        records.append(
            PersonalRecord(
                exercise=sets[-1].name.strip(),  # the latest spelling
                best_weight=best.weight,
                best_weight_reps=best.reps,
                best_weight_date=first_reached.date,
                estimated_1rm=round(max(e1rm_candidates), 1) if e1rm_candidates else None,
                max_reps=max(s.reps for s in sets),
                times_trained=len({s.id for s in sets}),
            )
        )

    records.sort(key=lambda r: (r.estimated_1rm is None, -(r.estimated_1rm or 0), r.exercise.lower()))
    return records
