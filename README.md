# Calorie Tracker App

A full-stack web app for logging workouts and tracking daily calorie and macronutrient intake.

## Tech stack

**Backend:** Python, FastAPI, SQLAlchemy, Pydantic, JWT auth, MySQL
**Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router, Axios

## Features (planned)

- User registration and login (JWT)
- Workout log: workouts → exercises → sets (weight × reps)
- Nutrition log: meals with calories, protein, carbs and fat
- Dashboard with progress stats

## Running the backend

1. Start MySQL (e.g. from the XAMPP Control Panel) and create the database:

```sql
CREATE DATABASE calorie_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Install dependencies and start the API (tables are created on startup):

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API docs are available at http://localhost:8000/docs.

Copy `backend/.env.example` to `backend/.env` and set a real `SECRET_KEY`.

## Running the frontend

With the backend running:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The dev server proxies `/api` requests to the backend on port 8000.

## API

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | create account |
| POST | `/api/auth/login` | get JWT token (username or email) |
| GET / PATCH | `/api/users/me` | current user, update calorie goal |
| GET / POST | `/api/workouts` | list (filter by `date_from`, `date_to`) / create with exercises and sets |
| GET / PATCH / DELETE | `/api/workouts/{id}` | single workout |
| GET / POST | `/api/meals` | list / create |
| GET | `/api/meals/summary?date=` | daily calorie and macro totals |
| GET / PATCH / DELETE | `/api/meals/{id}` | single meal |

All endpoints except register and login need an `Authorization: Bearer <token>` header.
