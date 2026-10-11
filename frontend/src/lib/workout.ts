import type { Workout } from '../api/types'

/** Total volume = sum of weight × reps over every set (kg). */
export function workoutVolume(workout: Workout): number {
  return workout.exercises.reduce(
    (total, exercise) => total + exercise.sets.reduce((sum, set) => sum + set.weight * set.reps, 0),
    0,
  )
}

export function countSets(workout: Workout): number {
  return workout.exercises.reduce((total, exercise) => total + exercise.sets.length, 0)
}

// Bumper plate colors: 25, 20, 15, 10 and 5 kg (the "white" one is a light grey here)
const PLATE_COLORS = [
  'var(--color-plate-red)',
  'var(--color-plate-blue)',
  'var(--color-plate-yellow)',
  'var(--color-plate-green)',
  'var(--color-plate-white)',
]
const LIGHT_PLATES = new Set(['var(--color-plate-yellow)', 'var(--color-plate-white)'])

/** A stable plate color per workout name, so "Push" always looks the same. */
export function workoutColor(name: string): string {
  const key = name.trim().toLowerCase()
  let hash = 0
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return PLATE_COLORS[hash % PLATE_COLORS.length]
}

/** Text color that stays readable on top of a plate color. */
export function textOnPlate(color: string): string {
  return LIGHT_PLATES.has(color) ? 'text-rubber' : 'text-white'
}

export function formatWeight(kg: number): string {
  return kg.toLocaleString('en-GB', { maximumFractionDigits: 2 })
}
