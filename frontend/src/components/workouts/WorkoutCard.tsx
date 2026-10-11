import type { Workout } from '../../api/types'
import { formatDate } from '../../lib/date'
import { countSets, formatWeight, workoutVolume } from '../../lib/workout'
import { Button } from '../ui/Button'

interface WorkoutCardProps {
  workout: Workout
  onDelete: (workout: Workout) => void
}

export function WorkoutCard({ workout, onDelete }: WorkoutCardProps) {
  return (
    <article className="rounded-xl border border-slate-200 p-4">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{workout.name}</h3>
          <p className="text-xs text-slate-500">
            {formatDate(workout.date, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <Button variant="danger" size="sm" onClick={() => onDelete(workout)} aria-label={`Delete ${workout.name}`}>
          Delete
        </Button>
      </header>

      <p className="mt-2 text-xs text-slate-600 tabular-nums">
        {workout.exercises.length} exercises · {countSets(workout)} sets ·{' '}
        {formatWeight(workoutVolume(workout))} kg volume
      </p>

      <ul className="mt-3 space-y-2">
        {workout.exercises.map((exercise) => (
          <li key={exercise.id}>
            <p className="text-sm font-medium">{exercise.name}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {exercise.sets.map((set) => (
                <span key={set.id} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700 tabular-nums">
                  {set.weight > 0 ? `${formatWeight(set.weight)} kg × ${set.reps}` : `${set.reps} reps`}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </article>
  )
}
