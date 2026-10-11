import type { ActivityLevel } from '../api/types'

export const ACTIVITY_LEVELS: { value: ActivityLevel; label: string; description: string }[] = [
  { value: 'sedentary', label: 'Mostly sitting', description: 'Desk job, little or no exercise' },
  { value: 'light', label: 'Lightly active', description: 'Training 1–3 days a week' },
  { value: 'moderate', label: 'Moderately active', description: 'Training 3–5 days a week' },
  { value: 'active', label: 'Very active', description: 'Hard training 6–7 days a week' },
  { value: 'very_active', label: 'Extremely active', description: 'Physical job plus training' },
]

export function activityLabel(level: ActivityLevel | null): string {
  return ACTIVITY_LEVELS.find((a) => a.value === level)?.label ?? 'Not set'
}

/** Calorie goal presets relative to maintenance. */
export const GOAL_PRESETS = [
  { label: 'Lose fat', offset: -500, hint: 'about 0.5 kg a week' },
  { label: 'Maintain', offset: 0, hint: 'keep your weight' },
  { label: 'Build muscle', offset: 300, hint: 'slow, lean gain' },
]

/** 2 g protein per kg bodyweight, 25% of calories from fat, carbs fill the rest. */
export function suggestMacros(calorieGoal: number, weightKg: number) {
  const protein = 2 * weightKg
  const fat = (calorieGoal * 0.25) / 9
  const carbs = Math.max(calorieGoal - protein * 4 - fat * 9, 0) / 4
  return { protein: Math.round(protein), carbs: Math.round(carbs), fat: Math.round(fat) }
}

/** '' -> null, otherwise a number. Form inputs keep strings until saving. */
export function toNumberOrNull(value: string): number | null {
  return value.trim() === '' ? null : Number(value)
}
