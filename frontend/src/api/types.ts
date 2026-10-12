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
  /** Set when the meal was picked from the food database */
  grams: number | null
  food: { id: number; image_url: string | null; emoji: string | null; brand: string | null } | null
}

/** Entered by hand */
export interface MealInput {
  name: string
  date: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

/** Picked from the food database: the server calculates the numbers */
export interface MealFromFoodInput {
  date: string
  food_id: number
  grams: number
}

export type MealUpdate = Partial<MealInput> & { grams?: number }

// --- Foods ---

export interface Food {
  id: number
  name: string
  brand: string | null
  source: 'builtin' | 'off'
  image_url: string | null
  emoji: string | null
  kcal_100g: number
  protein_100g: number
  carbs_100g: number
  fat_100g: number
  serving_g: number | null
}

export interface FoodSearchResult {
  foods: Food[]
  online_search_ok: boolean
}

export interface EstimateItem {
  name: string
  grams: number
  calories: number
  protein: number
  carbs: number
  fat: number
  /** Set when the numbers come from the app's food database instead of the AI */
  database_food: string | null
}

/** The AI's estimate for the whole described meal: its foods plus their totals */
export interface FoodEstimate {
  name: string
  portion_grams: number
  calories: number
  protein: number
  carbs: number
  fat: number
  items: EstimateItem[]
}

export interface PersonalRecord {
  exercise: string
  best_weight: number
  best_weight_reps: number
  best_weight_date: string
  estimated_1rm: number | null
  max_reps: number
  times_trained: number
}

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

// --- Gyms ---

export interface Gym {
  /** OpenStreetMap id, e.g. "node/123" */
  id: string
  name: string
  lat: number
  lon: number
  distance_m: number
  address: string | null
  opening_hours: string | null
  website: string | null
  phone: string | null
}

export interface GymSearchResult {
  gyms: Gym[]
  radius_m: number
}
