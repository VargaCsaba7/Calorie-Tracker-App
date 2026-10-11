import { useState } from 'react'
import { getErrorMessage } from '../api/errors'
import { mealsApi } from '../api/meals'
import type { Meal } from '../api/types'
import { DateSwitcher } from '../components/DateSwitcher'
import { CalorieProgress } from '../components/nutrition/CalorieProgress'
import { MacroBreakdown } from '../components/nutrition/MacroBreakdown'
import { MealForm } from '../components/nutrition/MealForm'
import { MealList } from '../components/nutrition/MealList'
import { Alert } from '../components/ui/Alert'
import { Card } from '../components/ui/Card'
import { useApi } from '../hooks/useApi'
import { formatDate, today } from '../lib/date'

export function NutritionPage() {
  const [date, setDate] = useState(today())
  const summary = useApi(() => mealsApi.summary(date), [date])
  const meals = useApi(() => mealsApi.list({ date_from: date, date_to: date }), [date])
  const [deleteError, setDeleteError] = useState<string | null>(null)

  function refresh() {
    void summary.reload()
    void meals.reload()
  }

  async function handleDelete(meal: Meal) {
    if (!window.confirm(`Delete "${meal.name}"?`)) return
    setDeleteError(null)
    try {
      await mealsApi.remove(meal.id)
      refresh()
    } catch (err) {
      setDeleteError(getErrorMessage(err))
    }
  }

  const dayTitle =
    date === today() ? 'Today' : formatDate(date, { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Nutrition</h1>
        <DateSwitcher value={date} onChange={setDate} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          <Card title={dayTitle}>
            <Alert message={summary.error} />
            {summary.data && (
              <div className="space-y-6">
                <CalorieProgress consumed={summary.data.calories} goal={summary.data.calorie_goal} />
                <MacroBreakdown
                  protein={summary.data.protein}
                  carbs={summary.data.carbs}
                  fat={summary.data.fat}
                />
              </div>
            )}
          </Card>

          <Card title="Meals">
            <div className="space-y-3">
              <Alert message={meals.error ?? deleteError} />
              {meals.data ? (
                <MealList meals={meals.data} onDelete={handleDelete} />
              ) : (
                meals.isLoading && <p className="text-sm text-slate-500">Loading...</p>
              )}
            </div>
          </Card>
        </div>

        <Card title="Add a meal" className="lg:self-start">
          <MealForm date={date} onSaved={refresh} />
        </Card>
      </div>
    </div>
  )
}
