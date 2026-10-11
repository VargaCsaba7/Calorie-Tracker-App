import { useState } from 'react'
import { getErrorMessage } from '../api/errors'
import type { Workout } from '../api/types'
import { workoutsApi } from '../api/workouts'
import { Alert } from '../components/ui/Alert'
import { Card } from '../components/ui/Card'
import { WorkoutCard } from '../components/workouts/WorkoutCard'
import { WorkoutForm } from '../components/workouts/WorkoutForm'
import { useApi } from '../hooks/useApi'

export function WorkoutsPage() {
  const workouts = useApi(() => workoutsApi.list({ limit: 30 }), [])
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleDelete(workout: Workout) {
    if (!window.confirm(`Delete "${workout.name}"?`)) return
    setDeleteError(null)
    try {
      await workoutsApi.remove(workout.id)
      void workouts.reload()
    } catch (err) {
      setDeleteError(getErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold">Workouts</h1>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
        <Card title="Log a workout" className="lg:self-start">
          <WorkoutForm onSaved={() => void workouts.reload()} />
        </Card>

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
