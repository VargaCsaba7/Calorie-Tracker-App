import { useState } from 'react'
import { authApi } from '../../api/auth'
import { getErrorMessage } from '../../api/errors'
import { progressApi } from '../../api/progress'
import type { WeightEntry } from '../../api/types'
import { useAuth } from '../../auth/useAuth'
import { useConfirm } from '../../confirm/useConfirm'
import { useApi } from '../../hooks/useApi'
import { addDays, formatDate, today } from '../../lib/date'
import { formatWeight } from '../../lib/workout'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Collapsible } from '../ui/Collapsible'
import { Field } from '../ui/Field'
import { WeeklyChart } from './WeeklyChart'

const WEEKS = 12

/** Collapsible: weekly weigh-ins and 12-week trends with charts. */
export function ProgressSection() {
  return (
    <Collapsible title="Weekly progress" subtitle={`Weigh-ins and your averages over the last ${WEEKS} weeks`}>
      <ProgressContent />
    </Collapsible>
  )
}

function ProgressContent() {
  const { user, setUser } = useAuth()
  const confirm = useConfirm()
  const since = addDays(today(), -WEEKS * 7)
  const stats = useApi(() => progressApi.weeklyStats(WEEKS), [])
  const weights = useApi(() => progressApi.weights({ date_from: since }), [since])

  const [date, setDate] = useState(today())
  const [weight, setWeight] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // The profile weight follows the latest weigh-in, so reload the user (and its calorie needs) too
  async function afterWeightChange() {
    const [me] = await Promise.all([authApi.getMe(), weights.reload(), stats.reload()])
    setUser(me)
  }

  async function handleSave() {
    setError(null)
    setIsSaving(true)
    try {
      await progressApi.saveWeight(date, Number(weight))
      setWeight('')
      await afterWeightChange()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(entry: WeightEntry) {
    const confirmed = await confirm({
      title: 'Delete this weigh-in?',
      message: `${formatWeight(entry.weight_kg)} kg on ${formatDate(entry.date, { month: 'long', day: 'numeric' })}.`,
      confirmLabel: 'Delete weigh-in',
      tone: 'danger',
    })
    if (!confirmed) return
    try {
      await progressApi.deleteWeight(entry.date)
      await afterWeightChange()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const weeks = stats.data ?? []
  const label = (iso: string) => formatDate(iso)
  const weightEntries = weights.data ?? []
  const firstWeight = weightEntries[0]?.weight_kg
  const lastWeight = weightEntries.at(-1)?.weight_kg
  const weightChange = firstWeight !== undefined && lastWeight !== undefined ? lastWeight - firstWeight : null

  const avg = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0)
  // The current week is still running, so averages use the finished weeks
  const finished = weeks.slice(0, -1)
  const loggedWeeks = finished.filter((w) => w.avg_calories !== null)

  const summaryItems = [
    {
      label: 'Weight change',
      value: weightChange === null ? '–' : `${weightChange > 0 ? '+' : ''}${formatWeight(Math.round(weightChange * 10) / 10)}`,
      unit: weightChange === null ? '' : 'kg',
    },
    {
      label: 'Workouts per week',
      value: avg(finished.map((w) => w.workouts)).toLocaleString('en-GB', { maximumFractionDigits: 1 }),
      unit: '',
    },
    { label: 'Volume per week', value: formatWeight(Math.round(avg(finished.map((w) => w.volume_kg)))), unit: 'kg' },
    {
      label: 'Calories per day',
      value: loggedWeeks.length ? Math.round(avg(loggedWeeks.map((w) => w.avg_calories ?? 0))).toLocaleString('en-GB') : '–',
      unit: loggedWeeks.length ? 'kcal' : '',
    },
  ]

  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-black/5 bg-black/5 lg:grid-cols-4">
        {summaryItems.map((item) => (
          <div key={item.label} className="bg-white p-4">
            <dt className="text-sm text-brand-500">{item.label}</dt>
            <dd className="mt-1 font-display text-3xl leading-none font-bold tabular-nums">
              {item.value}
              {item.unit && <span className="ml-1 text-base font-semibold text-brand-500">{item.unit}</span>}
            </dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_1fr]">
        <div>
          <h3 className="text-xl font-semibold">Log your weight</h3>
          <p className="mt-0.5 text-sm text-brand-500">Once a week, same time of day, works best.</p>
          <form
            className="mt-3 flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              void handleSave()
            }}
          >
            <Field label="Date" type="date" required className="flex-1" value={date} onChange={(e) => setDate(e.target.value)} />
            <Field
              label="Weight (kg)"
              type="number"
              inputMode="decimal"
              required
              min={30}
              max={300}
              step="any"
              className="w-24"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
            <Button type="submit" disabled={isSaving}>
              Save
            </Button>
          </form>
          <div className="mt-3">
            <Alert message={error ?? weights.error} />
          </div>

          {weightEntries.length > 0 && (
            <ul className="mt-3 divide-y divide-black/5">
              {[...weightEntries].reverse().slice(0, 5).map((entry) => (
                <li key={entry.date} className="flex items-center justify-between gap-3 py-2">
                  <span className="text-sm text-brand-500">
                    {formatDate(entry.date, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <span className="ml-auto font-display text-xl font-semibold tabular-nums">
                    {formatWeight(entry.weight_kg)} kg
                  </span>
                  <Button variant="danger" size="sm" aria-label={`Delete weigh-in on ${entry.date}`} onClick={() => void handleDelete(entry)}>
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <WeeklyChart
          title="Body weight"
          kind="line"
          unit="kg"
          zoomY
          data={weightEntries.map((e) => ({ label: label(e.date), value: e.weight_kg }))}
        />
      </div>

      <Alert message={stats.error} />
      <div className="grid gap-4 lg:grid-cols-3">
        <WeeklyChart
          title="Workouts per week"
          kind="bar"
          unit="workouts"
          data={weeks.map((w) => ({ label: label(w.week_start), value: w.workouts }))}
        />
        <WeeklyChart
          title="Training volume per week"
          kind="bar"
          unit="kg"
          data={weeks.map((w) => ({ label: label(w.week_start), value: w.volume_kg }))}
        />
        <WeeklyChart
          title="Average daily calories"
          kind="bar"
          unit="kcal"
          target={user ? { value: user.daily_calorie_goal, label: `Goal ${user.daily_calorie_goal.toLocaleString('en-GB')}` } : undefined}
          data={weeks.map((w) => ({ label: label(w.week_start), value: w.avg_calories }))}
        />
      </div>
      <p className="text-xs text-slate-500">Weeks run Monday to Sunday. Averages skip the current, unfinished week.</p>
    </div>
  )
}
