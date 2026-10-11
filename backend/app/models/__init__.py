# Import every model here so Base.metadata knows about all tables.
from app.models.food import Food
from app.models.meal import Meal
from app.models.progress import RestDay, WeightEntry
from app.models.user import User
from app.models.workout import Exercise, Workout, WorkoutSet

__all__ = ["User", "Workout", "Exercise", "WorkoutSet", "Meal", "Food", "RestDay", "WeightEntry"]
