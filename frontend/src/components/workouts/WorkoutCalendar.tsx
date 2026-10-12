import { useState } from 'react'
import { getErrorMessage } from '../../api/errors'
import { progressApi } from '../../api/progress'
import type { Workout } from '../../api/types'
import { workoutsApi } from '../../api/workouts'
import { useApi } from '../../hooks/useApi'
import { addDays, addMonths, formatDate, lastDayOfMonth, mondayOf, monthOf, today } from '../../lib/date'
import { formatWeight, workoutVolume } from '../../lib/workout'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'

type DayStatus = 'trained' | 'rest' | 'missed' | 'none'

// Color plus a symbol, so the status doesn't depend on telling red from green.
const STATUS_STYLE: Record<DayStatus, { cell: string; symbol: string; label: string }> = {
  trained: { cell: 'bg-plate-green text-white', symbol: '✓', label: 'Trained' },
  rest: { cell: 'bg-plate-yellow text-rubber', symbol: 'Z', label: 'Rest day' },
  missed: { cell: 'bg-plate-red text-white', symbol: '✕', label: 'Missed' },
  none: { cell: 'bg-chalk text-brand-500', symbol: '', label: '' },
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface WorkoutCalendarProps {
  /** Days before sign-up are never shown as missed */
  trackingSince: string
  /** Bump to reload after a workout was added or deleted elsewhere */
  refreshKey: number
  onLogForDay: (date: string) => void
}

export function WorkoutCalendar({ trackingSince, refreshKey, onLogForDay }: WorkoutCalendarProps) {
  const todayIso = today()
  const [month, setMonth] = useState(monthOf(todayIso))
  const [selected, setSelected] = useState(todayIso)
  const [actionError, setActionError] = useState<string | null>(null)

  const gridStart = mondayOf(`${month}-01`)
  const gridEnd = addDays(mondayOf(lastDayOfMonth(month)), 6)

  const workouts = useApi(
    () => workoutsApi.list({ date_from: gridStart, date_to: gridEnd, limit: 100 }),
    [gridStart, gridEnd, refreshKey],
  )
  const restDays = useApi(() => progressApi.restDays({ date_from: gridStart, date_to: gridEnd }), [gridStart, gridEnd])

  const workoutsByDay = new Map<string, Workout[]>()
  for (const workout of workouts.data ?? []) {
    workoutsByDay.set(workout.date, [...(workoutsByDay.get(workout.date) ?? []), workout])
  }
  const restSet = new Set((restDays.data ?? []).map((r) => r.date))

  function statusOf(date: string): DayStatus {
    if (workoutsByDay.has(date)) return 'trained'
    if (restSet.has(date)) return 'rest'
    // Today isn't over yet, so it can't be missed
    if (date < todayIso && date >= trackingSince) return 'missed'
    return 'none'
  }

  const days: string[] = []
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) days.push(d)

  const inMonth = days.filter((d) => monthOf(d) === month)
  const counts = { trained: 0, rest: 0, missed: 0 }
  for (const d of inMonth) {
    const status = statusOf(d)
    if (status !== 'none') counts[status]++
  }

  async function toggleRestDay(date: string) {
    setActionError(null)
    try {
      if (restSet.has(date)) await progressApi.unmarkRestDay(date)
      else await progressApi.markRestDay(date)
      await restDays.reload()
    } catch (err) {
      setActionError(getErrorMessage(err))
    }
  }

  const selectedWorkouts = workoutsByDay.get(selected) ?? []
  const selectedStatus = statusOf(selected)

  return (
    <section className="rounded-2xl border border-black/5 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">{formatDate(`${month}-01`, { month: 'long', year: 'numeric' })}</h2>
        <div className="flex gap-1.5">
          <Button variant="secondary" size="sm" aria-label="Previous month" onClick={() => setMonth(addMonths(month, -1))}>
            ←
          </Button>
          <Button variant="secondary" size="sm" disabled={month === monthOf(todayIso)} onClick={() => setMonth(monthOf(todayIso))}>
            This month
          </Button>
          <Button variant="secondary" size="sm" aria-label="Next month" onClick={() => setMonth(addMonths(month, 1))}>
            →
          </Button>
        </div>
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {(['trained', 'rest', 'missed'] as const).map((status) => (
          <li key={status} className="flex items-center gap-1.5">
            <span
              className={`flex size-5 items-center justify-center rounded text-xs font-bold ${STATUS_STYLE[status].cell}`}
              aria-hidden="true"
            >
              {STATUS_STYLE[status].symbol}
            </span>
            {STATUS_STYLE[status].label}
            <span className="font-display font-bold tabular-nums">{counts[status]}</span>
          </li>
        ))}
      </ul>

      <Alert message={workouts.error ?? restDays.error ?? actionError} />

      <div className="mt-4 grid grid-cols-7 gap-1 sm:gap-1.5" role="grid" aria-label="Training calendar">
        {WEEKDAYS.map((day) => (
          <div key={day} className="pb-1 text-center text-xs font-medium text-slate-500" role="columnheader">
            {day}
          </div>
        ))}
        {days.map((date) => {
          const status = statusOf(date)
          const style = STATUS_STYLE[status]
          const isOutside = monthOf(date) !== month
          const isSelected = date === selected
          return (
            <button
              key={date}
              type="button"
              role="gridcell"
              aria-selected={isSelected}
              aria-label={`${formatDate(date, { weekday: 'long', month: 'long', day: 'numeric' })}${style.label ? `, ${style.label}` : ''}`}
              onClick={() => setSelected(date)}
              className={`relative flex h-12 flex-col items-start justify-between rounded-lg p-1.5 text-left transition sm:h-16 sm:p-2 ${style.cell} ${
                isOutside ? 'opacity-35' : ''
              } ${isSelected ? 'ring-3 ring-plate-blue ring-offset-2' : 'hover:brightness-95'} ${
                date === todayIso && !isSelected ? 'ring-2 ring-brand-600' : ''
              }`}
            >
              <span className="font-display text-sm leading-none font-semibold sm:text-lg">{Number(date.slice(8))}</span>
              {style.symbol && (
                <span aria-hidden="true" className="self-end font-display text-sm leading-none font-bold sm:text-xl">
                  {style.symbol}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-5 rounded-xl bg-chalk p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-xl font-semibold">
            {selected === todayIso ? 'Today' : formatDate(selected, { weekday: 'long', month: 'long', day: 'numeric' })}
          </h3>
          {selectedStatus !== 'none' && <p className="text-sm text-brand-500">{STATUS_STYLE[selectedStatus].label}</p>}
        </div>

        {selectedWorkouts.length > 0 ? (
          <ul className="mt-2 space-y-1">
            {selectedWorkouts.map((w) => (
              <li key={w.id} className="flex justify-between gap-3">
                <span className="font-medium">{w.name}</span>
                <span className="font-display tabular-nums">{formatWeight(workoutVolume(w))} kg</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-brand-500">
            {selectedStatus === 'rest'
              ? 'Planned rest. It won’t count as a missed day.'
              : selectedStatus === 'missed'
                ? 'No workout logged. Log one, or mark it as a rest day.'
                : 'No workout logged.'}
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => onLogForDay(selected)}>
            Log a workout for this day
          </Button>
          {selectedWorkouts.length === 0 && (
            <Button variant="secondary" size="sm" onClick={() => void toggleRestDay(selected)}>
              {restSet.has(selected) ? 'Remove rest day' : 'Mark as rest day'}
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}
