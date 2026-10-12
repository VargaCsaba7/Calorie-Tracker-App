"""The built-in exercise library: filtering, search, and finding the entry for a typed name."""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import ExerciseInfo
from app.services.text_match import word_score, words

IMAGE_BASE_URL = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/"

MUSCLE_GROUPS = ["chest", "back", "shoulders", "biceps", "triceps", "forearms", "abs", "quads", "hamstrings", "glutes", "calves"]

# Common names people type (Hungarian and English) -> the library entry they usually mean
_KNOWN_NAMES = {
    "fekvenyomas": "Barbell_Bench_Press_-_Medium_Grip",
    "bench press": "Barbell_Bench_Press_-_Medium_Grip",
    "guggolas": "Barbell_Squat",
    "squat": "Barbell_Squat",
    "felhuzas": "Barbell_Deadlift",
    "deadlift": "Barbell_Deadlift",
    "roman felhuzas": "Romanian_Deadlift",
    "huzodzkodas": "Pullups",
    "pull up": "Pullups",
    "pullup": "Pullups",
    "tolodzkodas": "Dips_-_Triceps_Version",
    "dips": "Dips_-_Triceps_Version",
    "vallbol nyomas": "Standing_Military_Press",
    "katonai nyomas": "Standing_Military_Press",
    "overhead press": "Standing_Military_Press",
    "evezes": "Bent_Over_Barbell_Row",
    "dontott torzsu evezes": "Bent_Over_Barbell_Row",
    "barbell row": "Bent_Over_Barbell_Row",
    "lehuzas": "Wide-Grip_Lat_Pulldown",
    "mellre huzas": "Wide-Grip_Lat_Pulldown",
    "lat pulldown": "Wide-Grip_Lat_Pulldown",
    "bicepsz": "Barbell_Curl",
    "bicepsz hajlitas": "Barbell_Curl",
    "biceps curl": "Barbell_Curl",
    "labtolas": "Leg_Press",
    "leg press": "Leg_Press",
    "oldalemeles": "Side_Lateral_Raise",
    "lateral raise": "Side_Lateral_Raise",
    "tricepsz letolas": "Triceps_Pushdown",
    "triceps pushdown": "Triceps_Pushdown",
    "ferde fekvenyomas": "Incline_Dumbbell_Press",
    "incline dumbbell press": "Incline_Dumbbell_Press",
    "fekvotamasz": "Pushups",
    "push up": "Pushups",
    "alkartamasz": "Plank",
    "csipoemeles": "Barbell_Hip_Thrust",
    "hip thrust": "Barbell_Hip_Thrust",
    "combhajlitas": "Lying_Leg_Curls",
    "leg curl": "Lying_Leg_Curls",
    "combfeszites": "Leg_Extensions",
    "leg extension": "Leg_Extensions",
    "vadli": "Standing_Calf_Raises",
    "calf raise": "Standing_Calf_Raises",
    "kitores": "Dumbbell_Lunges",
    "lunge": "Dumbbell_Lunges",
    "hasprest": "Crunches",
    "felules": "Crunches",
}
_MIN_SCORE = 0.6


def image_urls(exercise: ExerciseInfo) -> list[str]:
    return [IMAGE_BASE_URL + path for path in exercise.images]


def list_exercises(
    db: Session,
    *,
    group: str | None,
    query: str | None,
    category: str | None,
    skip: int,
    limit: int,
) -> tuple[list[ExerciseInfo], int]:
    stmt = select(ExerciseInfo)
    if group:
        stmt = stmt.where(ExerciseInfo.muscle_group == group)
    if category:
        stmt = stmt.where(ExerciseInfo.category == category)
    if query:
        for word in query.split():
            stmt = stmt.where(func.lower(ExerciseInfo.name).contains(word.lower(), autoescape=True))
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    # Beginner-friendly basics first, then alphabetical
    order = (ExerciseInfo.level != "beginner", ExerciseInfo.name)
    return list(db.scalars(stmt.order_by(*order).offset(skip).limit(limit))), total


def find_by_name(db: Session, name: str) -> ExerciseInfo | None:
    """The library entry for an exercise name typed in a workout, e.g. "Fekvenyomás" or "Bench press"."""
    key = " ".join(words(name))
    if not key:
        return None
    if key in _KNOWN_NAMES:
        return db.get(ExerciseInfo, _KNOWN_NAMES[key])

    query = key.split()
    best, best_score = None, _MIN_SCORE
    for exercise in db.scalars(select(ExerciseInfo).order_by(ExerciseInfo.name)):
        known = words(exercise.name)
        matched = sum(max((word_score(q, k) for k in known), default=0.0) for q in query)
        extra = sum(1 for k in known if not any(word_score(q, k) for q in query))
        score = matched / len(query) - 0.05 * extra
        if score > best_score or (score == best_score and best and len(exercise.name) < len(best.name)):
            best, best_score = exercise, score
    return best
