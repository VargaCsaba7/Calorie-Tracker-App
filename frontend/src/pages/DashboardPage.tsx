import { useMemo } from 'react'
import { Link } from 'react-router'
import { mealsApi } from '../api/meals'
import { workoutsApi } from '../api/workouts'
import { useAuth } from '../auth/useAuth'
import { CaloriesChart } from '../components/dashboard/CaloriesChart'
import { GoalEditor } from '../components/dashboard/GoalEditor'
import { StatRow, StatTile } from '../components/dashboard/StatTile'
import { VolumeChart } from '../components/dashboard/VolumeChart'
import { BarbellMeter } from '../components/nutrition/BarbellMeter'
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
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <p className="text-brand-500">
            {formatDate(todayIso, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-4xl font-bold">Hi, {user?.username}</h1>
        </div>
        <GoalEditor onSaved={() => void summary.reload()} />
      </div>

      <Alert message={summary.error ?? weekMeals.error ?? workouts.error} />

      {summary.data && (
        <BarbellMeter
          title="Eaten today"
          calories={summary.data.calories}
          goal={summary.data.calorie_goal}
          protein={summary.data.protein}
          carbs={summary.data.carbs}
          fat={summary.data.fat}
          action={
            <Link
              to="/nutrition"
              className="rounded-full bg-white px-4 py-1.5 font-display text-lg font-semibold text-rubber hover:bg-chalk"
            >
              Log a meal
            </Link>
          }
        />
      )}

      <StatRow>
        <StatTile
          label="Workouts this week"
          value={String(workoutsThisWeek.length)}
          hint="Last 7 days"
        />
        <StatTile
          label="Volume this week"
          value={formatWeight(volumeThisWeek)}
          unit="kg"
          hint="Weight × reps, all sets"
        />
        <StatTile
          label="Average intake"
          value={averageCalories.toLocaleString('en-GB')}
          unit="kcal"
          hint={`On the ${loggedDays.length} ${loggedDays.length === 1 ? 'day' : 'days'} you logged`}
        />
        <StatTile
          label="Protein today"
          value={formatGrams(summary.data?.protein ?? 0)}
          unit="g"
          hint={`From ${summary.data?.meal_count ?? 0} ${summary.data?.meal_count === 1 ? 'meal' : 'meals'}`}
        />
      </StatRow>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Calories, last 7 days">
          <CaloriesChart data={caloriesByDay} goal={goal} />
        </Card>

        <Card
          title="Volume per workout"
          action={
            <Link to="/workouts" className="text-sm font-medium text-brand-600 underline-offset-4 hover:underline">
              Log a workout
            </Link>
          }
        >
          {volumeSeries.length > 0 ? (
            <VolumeChart data={volumeSeries} />
          ) : (
            <p className="py-10 text-center text-sm text-slate-500">
              Log a workout and its volume will show up here.
            </p>
          )}
        </Card>
      </div>
    </div>
  )
}
