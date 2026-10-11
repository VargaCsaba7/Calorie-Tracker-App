// Mirrors the backend's Pydantic schemas. Dates are ISO strings ("2026-10-11").

export interface User {
  id: number
  username: string
  email: string
  daily_calorie_goal: number
  created_at: string
}

export interface RegisterPayload {
  username: string
  email: string
  password: string
  daily_calorie_goal?: number
}

export interface UserUpdate {
  email?: string
  daily_calorie_goal?: number
}

export interface Token {
  access_token: string
  token_type: 'bearer'
}

// --- Workouts ---

export interface WorkoutSet {
  id: number
  weight: number
  reps: number
}

export interface Exercise {
  id: number
  name: string
  sets: WorkoutSet[]
}

export interface Workout {
  id: number
  name: string
  date: string
  exercises: Exercise[]
}

export type WorkoutSetInput = Omit<WorkoutSet, 'id'>

export interface ExerciseInput {
  name: string
  sets: WorkoutSetInput[]
}

export interface WorkoutInput {
  name: string
  date: string
  exercises: ExerciseInput[]
}

/** If `exercises` is sent, it replaces the whole list on the server. */
export type WorkoutUpdate = Partial<WorkoutInput>

// --- Meals ---

export interface Meal {
  id: number
  name: string
  date: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

export type MealInput = Omit<Meal, 'id'>
export type MealUpdate = Partial<MealInput>

export interface DailyNutritionSummary {
  date: string
  calories: number
  protein: number
  carbs: number
  fat: number
  meal_count: number
  calorie_goal: number
  calories_remaining: number
}

export interface ListParams {
  date_from?: string
  date_to?: string
  skip?: number
  limit?: number
}
