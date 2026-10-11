// Mirrors the backend's Pydantic schemas. Dates are ISO strings ("2026-10-11").

export type Sex = 'male' | 'female'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'

/** Goals and body data; every field is optional (null = not set). */
export interface UserProfile {
  protein_goal: number | null
  carbs_goal: number | null
  fat_goal: number | null
  sex: Sex | null
  birth_date: string | null
  height_cm: number | null
  weight_kg: number | null
  activity_level: ActivityLevel | null
}

/** Calculated by the backend once the body profile is complete. */
export interface EnergyEstimate {
  age: number
  bmr: number
  maintenance_calories: number
}

export interface User extends UserProfile {
  id: number
  username: string
  email: string
  daily_calorie_goal: number
  created_at: string
  energy: EnergyEstimate | null
}

export interface RegisterPayload {
  username: string
  email: string
  password: string
  daily_calorie_goal?: number
}

/** Only the fields sent are changed; null clears a profile field. */
export interface UserUpdate extends Partial<UserProfile> {
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

// --- Progress ---

export interface RestDay {
  date: string
}

export interface WeightEntry {
  date: string
  weight_kg: number
}

export interface WeeklyStats {
  week_start: string
  workouts: number
  volume_kg: number
  rest_days: number
  days_logged: number
  avg_calories: number | null
  avg_protein: number | null
  avg_weight_kg: number | null
}

export interface ListParams {
  date_from?: string
  date_to?: string
  skip?: number
  limit?: number
}
