# Calorie Tracker App

A full-stack web app for logging workouts and tracking daily calorie and macronutrient intake.

## Tech stack

**Backend:** Python, FastAPI, SQLAlchemy, Alembic, Pydantic, JWT auth, MySQL
**Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router, Axios, Recharts

## Features

- Sign up / log in with JWT, stays logged in after reload
- **Workout logger:** log a workout with any number of exercises and sets (weight × reps), see your history with total volume
- **Nutrition tracker:** search ~75 common foods (Hungarian names) and packaged products from [Open Food Facts](https://world.openfoodfacts.org) with photos, enter the grams and the server calculates calories and macros; or describe a meal and let an AI (Claude API) estimate it; or type the numbers by hand
- **Personal records:** best set and estimated one-rep max (Epley) for every exercise
- **Profile:** height, weight, age and activity level give your daily calorie needs (Mifflin-St Jeor formula); set a calorie goal and optional protein/carbs/fat targets
- **Dashboard:** today's calories on a barbell (each plate is 100 kcal), macro targets, your body stats, calories of the last 7 days vs. goal, training volume per workout
- Responsive, works on phones too

## Quick start (Windows)

Double-click `start.bat`. It starts MySQL from XAMPP if needed, creates the database, sets up the
Python venv and npm packages on the first run, then starts the backend and frontend and opens
http://localhost:5173. Close the two server windows to stop the app.

## Running the backend

1. Start MySQL (e.g. from the XAMPP Control Panel) and create the database:

```sql
CREATE DATABASE calorie_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Install dependencies, create the tables with Alembic and start the API:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
alembic upgrade head
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
| GET / PATCH | `/api/users/me` | current user with calculated calorie needs; update profile and goals |
| GET / POST | `/api/workouts` | list (filter by `date_from`, `date_to`) / create with exercises and sets |
| GET / PATCH / DELETE | `/api/workouts/{id}` | single workout |
| GET / POST | `/api/meals` | list / create |
| GET | `/api/meals/summary?date=` | daily calorie and macro totals |
| GET / PATCH / DELETE | `/api/meals/{id}` | single meal |

All endpoints except register and login need an `Authorization: Bearer <token>` header.

## AI meal estimate (optional)

On the Nutrition page, "Describe (AI)" sends a short description ("egy tányér gulyásleves két szelet kenyérrel")
to a language model, which answers in a fixed JSON schema (structured outputs) with the portion size, calories and
macros. The estimate only pre-fills the manual form, so the user checks it before saving.

**Default: free and local with [Ollama](https://ollama.com).** No account or API key, nothing leaves your machine.

```bash
ollama pull qwen2.5:7b
```

`start.bat` starts Ollama if it's installed. Any other Ollama model works too (`OLLAMA_MODEL` in `backend/.env`).

**Alternative: Claude** (paid, more accurate). In `backend/.env`:

```
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

If the selected provider isn't available, everything else still works and the AI tab says so.
