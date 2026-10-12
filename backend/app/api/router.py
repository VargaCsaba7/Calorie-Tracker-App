from fastapi import APIRouter

from app.api.routes import auth, foods, gyms, meals, progress, users, workouts

api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(workouts.router)
api_router.include_router(meals.router)
api_router.include_router(foods.router)
api_router.include_router(progress.router)
api_router.include_router(gyms.router)
