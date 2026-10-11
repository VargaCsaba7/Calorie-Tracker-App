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

export function formatWeight(kg: number): string {
  return kg.toLocaleString('en-GB', { maximumFractionDigits: 2 })
}
