import type { Meal } from '../../api/types'
import { formatGrams } from '../../lib/macros'
import { Button } from '../ui/Button'

interface MealListProps {
  meals: Meal[]
  onDelete: (meal: Meal) => void
}

export function MealList({ meals, onDelete }: MealListProps) {
  if (meals.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-500">No meals logged for this day yet.</p>
  }

  return (
    <ul className="-my-3 divide-y divide-slate-100">
      {meals.map((meal) => (
        <li key={meal.id} className="flex items-center gap-3 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{meal.name}</p>
            <p className="text-xs text-slate-500 tabular-nums">
              P {formatGrams(meal.protein)} g · C {formatGrams(meal.carbs)} g · F {formatGrams(meal.fat)} g
            </p>
          </div>
          <p className="font-semibold whitespace-nowrap tabular-nums">{meal.calories} kcal</p>
          <Button variant="danger" size="sm" onClick={() => onDelete(meal)} aria-label={`Delete ${meal.name}`}>
            Delete
          </Button>
        </li>
      ))}
    </ul>
  )
}
