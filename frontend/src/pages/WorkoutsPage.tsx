import { useRef, useState } from 'react'
import { getErrorMessage } from '../api/errors'
import type { Workout } from '../api/types'
import { workoutsApi } from '../api/workouts'
import { useAuth } from '../auth/useAuth'
import { useConfirm } from '../confirm/useConfirm'
import { Alert } from '../components/ui/Alert'
import { Card } from '../components/ui/Card'
import { WorkoutCalendar } from '../components/workouts/WorkoutCalendar'
import { WorkoutCard } from '../components/workouts/WorkoutCard'
import { WorkoutForm } from '../components/workouts/WorkoutForm'
import { useApi } from '../hooks/useApi'
import { today } from '../lib/date'

/**
 * Days count as "missed" from when tracking started: sign-up, or the first logged
 * workout if older workouts were added afterwards.
 */
function trackingSince(signupDate: string, workouts: Workout[]): string {
  const oldest = workouts.at(-1)?.date // the list is newest first
  return oldest && oldest < signupDate ? oldest : signupDate
}

export function WorkoutsPage() {
  const { user } = useAuth()
  const confirm = useConfirm()
  const workouts = useApi(() => workoutsApi.list({ limit: 30 }), [])
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [formDate, setFormDate] = useState(today())
  // Tells the calendar to reload when workouts change
  const [calendarVersion, setCalendarVersion] = useState(0)
  const formRef = useRef<HTMLDivElement>(null)

  function refresh() {
    void workouts.reload()
    setCalendarVersion((v) => v + 1)
  }

  async function handleDelete(workout: Workout) {
    const confirmed = await confirm({
      title: `Delete "${workout.name}"?`,
      message: 'The workout and all its sets will be removed. This can’t be undone.',
      confirmLabel: 'Delete workout',
      tone: 'danger',
    })
    if (!confirmed) return
    setDeleteError(null)
    try {
      await workoutsApi.remove(workout.id)
      refresh()
    } catch (err) {
      setDeleteError(getErrorMessage(err))
    }
  }

  function logForDay(date: string) {
    setFormDate(date)
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    formRef.current?.querySelector('input')?.focus({ preventScroll: true })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold">Workouts</h1>

      {user && (
        <WorkoutCalendar
          trackingSince={trackingSince(user.created_at.slice(0, 10), workouts.data ?? [])}
          refreshKey={calendarVersion}
          onLogForDay={logForDay}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
        <div ref={formRef} className="scroll-mt-24 lg:self-start">
          <Card title="Log a workout">
            <WorkoutForm date={formDate} onDateChange={setFormDate} onSaved={refresh} />
          </Card>
        </div>

        <Card title="History" className="min-w-0">
          <div className="space-y-3">
            <Alert message={workouts.error ?? deleteError} />
            {workouts.data?.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-500">No workouts yet. Log your first one!</p>
            )}
            {!workouts.data && workouts.isLoading && <p className="text-sm text-slate-500">Loading...</p>}
            {workouts.data?.map((workout) => (
              <WorkoutCard key={workout.id} workout={workout} onDelete={handleDelete} />
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
