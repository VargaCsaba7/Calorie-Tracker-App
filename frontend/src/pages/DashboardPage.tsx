import { useMemo } from 'react'
import { Link } from 'react-router'
import { mealsApi } from '../api/meals'
import { workoutsApi } from '../api/workouts'
import { useAuth } from '../auth/useAuth'
import { CaloriesChart } from '../components/dashboard/CaloriesChart'
import { GoalEditor } from '../components/dashboard/GoalEditor'
import { StatTile } from '../components/dashboard/StatTile'
import { VolumeChart } from '../components/dashboard/VolumeChart'
import { CalorieProgress } from '../components/nutrition/CalorieProgress'
import { MacroBreakdown } from '../components/nutrition/MacroBreakdown'
import { Alert } from '../components/ui/Alert'
import { Card } from '../components/ui/Card'
import { useApi } from '../hooks/useApi'
import { addDays, formatDate, today } from '../lib/date'
import { formatGrams } from '../lib/macros'
import { formatWeight, workoutVolume } from '../lib/workout'

export function DashboardPage() {
  const { user } = useAuth()
  const todayIso = today()
  const weekStart = addDays(todayIso, -6)

  const summary = useApi(() => mealsApi.summary(todayIso), [todayIso])
  const weekMeals = useApi(
    () => mealsApi.list({ date_from: weekStart, date_to: todayIso, limit: 200 }),
    [weekStart, todayIso],
  )
  const workouts = useApi(() => workoutsApi.list({ limit: 50 }), [])

  const caloriesByDay = useMemo(() => {
    const totals = new Map<string, number>()
    for (const meal of weekMeals.data ?? []) {
      totals.set(meal.date, (totals.get(meal.date) ?? 0) + meal.calories)
    }
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i)
      return { label: formatDate(date, { weekday: 'short' }), calories: totals.get(date) ?? 0 }
    })
  }, [weekMeals.data, weekStart])

  const loggedDays = caloriesByDay.filter((day) => day.calories > 0)
  const averageCalories = loggedDays.length
    ? Math.round(loggedDays.reduce((sum, day) => sum + day.calories, 0) / loggedDays.length)
    : 0

  const workoutsThisWeek = (workouts.data ?? []).filter((w) => w.date >= weekStart)
  const volumeThisWeek = workoutsThisWeek.reduce((sum, w) => sum + workoutVolume(w), 0)

  // API returns newest first; the chart reads left to right, oldest first.
  const volumeSeries = useMemo(
    () =>
      (workouts.data ?? [])
        .slice(0, 12)
        .reverse()
        .map((w) => ({ label: formatDate(w.date), name: w.name, volume: workoutVolume(w) })),
    [workouts.data],
  )

  const goal = summary.data?.calorie_goal ?? user?.daily_calorie_goal ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hi, {user?.username}</h1>
        <p className="text-sm text-slate-500">
          {formatDate(todayIso, { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <Alert message={summary.error ?? weekMeals.error ?? workouts.error} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Calories today"
          value={(summary.data?.calories ?? 0).toLocaleString('en-GB')}
          hint={`of ${goal.toLocaleString('en-GB')} kcal`}
        />
        <StatTile
          label="Protein today"
          value={`${formatGrams(summary.data?.protein ?? 0)} g`}
          hint={`${summary.data?.meal_count ?? 0} ${summary.data?.meal_count === 1 ? 'meal' : 'meals'} logged`}
        />
        <StatTile
          label="Workouts this week"
          value={String(workoutsThisWeek.length)}
          hint={`${formatWeight(volumeThisWeek)} kg volume`}
        />
        <StatTile
          label="7-day average"
          value={`${averageCalories.toLocaleString('en-GB')}`}
          hint={`kcal · ${loggedDays.length} of 7 days logged`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title="Today"
          action={
            <Link to="/nutrition" className="text-sm font-medium text-brand-700 hover:underline">
              Log a meal
            </Link>
          }
        >
          {summary.data && (
            <div className="space-y-6">
              <CalorieProgress consumed={summary.data.calories} goal={summary.data.calorie_goal} />
              <MacroBreakdown protein={summary.data.protein} carbs={summary.data.carbs} fat={summary.data.fat} />
              <GoalEditor onSaved={() => void summary.reload()} />
            </div>
          )}
        </Card>

        <Card title="Calories, last 7 days">
          <CaloriesChart data={caloriesByDay} goal={goal} />
        </Card>
      </div>

      <Card
        title="Training volume per workout"
        action={
          <Link to="/workouts" className="text-sm font-medium text-brand-700 hover:underline">
            Log a workout
          </Link>
        }
      >
        {volumeSeries.length > 0 ? (
          <VolumeChart data={volumeSeries} />
        ) : (
          <p className="py-10 text-center text-sm text-slate-500">
            No workouts yet. Your progress will show up here.
          </p>
        )}
      </Card>
    </div>
  )
}
