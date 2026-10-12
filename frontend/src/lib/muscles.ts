import type { MuscleGroup } from '../api/types'

export const MUSCLE_GROUPS: { id: MuscleGroup; label: string; view: 'anterior' | 'posterior' }[] = [
  { id: 'chest', label: 'Chest', view: 'anterior' },
  { id: 'back', label: 'Back', view: 'posterior' },
  { id: 'shoulders', label: 'Shoulders', view: 'anterior' },
  { id: 'biceps', label: 'Biceps', view: 'anterior' },
  { id: 'triceps', label: 'Triceps', view: 'posterior' },
  { id: 'forearms', label: 'Forearms', view: 'anterior' },
  { id: 'abs', label: 'Abs', view: 'anterior' },
  { id: 'quads', label: 'Quads', view: 'anterior' },
  { id: 'hamstrings', label: 'Hamstrings', view: 'posterior' },
  { id: 'glutes', label: 'Glutes', view: 'posterior' },
  { id: 'calves', label: 'Calves', view: 'posterior' },
]

// Muscle names in the dataset -> body parts of the body map drawing
const BODY_PARTS: Record<string, string[]> = {
  chest: ['chest'],
  lats: ['upper-back'],
  'middle back': ['upper-back'],
  'lower back': ['lower-back'],
  traps: ['trapezius'],
  shoulders: ['front-deltoids', 'back-deltoids'],
  neck: ['neck'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  forearms: ['forearm'],
  abdominals: ['abs', 'obliques'],
  quadriceps: ['quadriceps'],
  hamstrings: ['hamstring'],
  glutes: ['gluteal'],
  abductors: ['abductors'],
  adductors: ['adductor'],
  calves: ['calves'],
}

export function bodyParts(muscles: string[]): string[] {
  return [...new Set(muscles.flatMap((m) => BODY_PARTS[m] ?? []))]
}

/** Body parts of a filter group, for its small icon */
export const GROUP_BODY_PARTS: Record<MuscleGroup, string[]> = {
  chest: ['chest'],
  back: ['upper-back', 'lower-back', 'trapezius'],
  shoulders: ['front-deltoids', 'back-deltoids'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  forearms: ['forearm'],
  abs: ['abs', 'obliques'],
  quads: ['quadriceps'],
  hamstrings: ['hamstring'],
  glutes: ['gluteal', 'abductors', 'adductor'],
  calves: ['calves'],
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
