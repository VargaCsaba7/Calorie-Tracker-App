export const MACROS = [
  { key: 'protein', label: 'Protein', color: 'var(--color-protein)', kcalPerGram: 4 },
  { key: 'carbs', label: 'Carbs', color: 'var(--color-carbs)', kcalPerGram: 4 },
  { key: 'fat', label: 'Fat', color: 'var(--color-fat)', kcalPerGram: 9 },
] as const

export type MacroKey = (typeof MACROS)[number]['key']
export type MacroValues = Record<MacroKey, number>

export function caloriesFromMacros({ protein, carbs, fat }: MacroValues): number {
  return Math.round(protein * 4 + carbs * 4 + fat * 9)
}

export function formatGrams(grams: number): string {
  return (Math.round(grams * 10) / 10).toLocaleString('en-GB')
}
