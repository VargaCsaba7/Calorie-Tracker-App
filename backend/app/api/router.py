from fastapi import APIRouter

from app.api.routes import auth, meals, users, workouts

api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(workouts.router)
api_router.include_router(meals.router)
