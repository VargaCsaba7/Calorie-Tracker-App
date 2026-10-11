import type { Meal } from '../../api/types'
import { formatGrams, MACROS } from '../../lib/macros'
import { Button } from '../ui/Button'
import { FoodImage } from './FoodImage'

interface MealListProps {
  meals: Meal[]
  onDelete: (meal: Meal) => void
}

export function MealList({ meals, onDelete }: MealListProps) {
  if (meals.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-500">Nothing logged for this day. Add a meal to start.</p>
  }

  return (
    <ul className="-my-3 divide-y divide-black/5">
      {meals.map((meal) => (
        <li key={meal.id} className="flex items-center gap-3 py-3">
          <FoodImage imageUrl={meal.food?.image_url} emoji={meal.food?.emoji ?? '🍽️'} name={meal.name} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">
              {meal.name}
              {meal.grams !== null && <span className="ml-1.5 text-sm font-normal text-slate-500">{formatGrams(meal.grams)} g</span>}
            </p>
            <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-slate-500 tabular-nums">
              {MACROS.map((macro) => (
                <span key={macro.key} className="inline-flex items-center gap-1">
                  <span className="h-3 w-1 rounded-sm" style={{ backgroundColor: macro.color }} />
                  {formatGrams(meal[macro.key])} g {macro.label.toLowerCase()}
                </span>
              ))}
            </p>
          </div>
          <p className="font-display text-xl font-semibold whitespace-nowrap tabular-nums">
            {meal.calories} <span className="text-sm font-normal text-slate-500">kcal</span>
          </p>
          <Button variant="danger" size="sm" onClick={() => onDelete(meal)} aria-label={`Delete ${meal.name}`}>
            Delete
          </Button>
        </li>
      ))}
    </ul>
  )
}
