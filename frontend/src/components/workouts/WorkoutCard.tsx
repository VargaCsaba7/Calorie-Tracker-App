import type { Workout } from '../../api/types'
import { formatDate } from '../../lib/date'
import { countSets, formatWeight, workoutColor, workoutVolume } from '../../lib/workout'
import { Button } from '../ui/Button'

interface WorkoutCardProps {
  workout: Workout
  onDelete: (workout: Workout) => void
}

export function WorkoutCard({ workout, onDelete }: WorkoutCardProps) {
  const sets = countSets(workout)

  return (
    <article
      className="rounded-xl border border-black/5 border-l-[6px] bg-chalk/50 p-4"
      style={{ borderLeftColor: workoutColor(workout.name) }}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-slate-500">
            {formatDate(workout.date, { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
          <h3 className="truncate text-2xl font-semibold">{workout.name}</h3>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl leading-none font-bold tabular-nums">
            {formatWeight(workoutVolume(workout))}
            <span className="ml-0.5 text-sm font-normal text-slate-500">kg</span>
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            lifted in {sets} {sets === 1 ? 'set' : 'sets'}
          </p>
        </div>
      </header>

      <ul className="mt-3 space-y-2.5">
        {workout.exercises.map((exercise) => (
          <li key={exercise.id}>
            <p className="text-sm font-medium">{exercise.name}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {exercise.sets.map((set) => (
                <span
                  key={set.id}
                  className="rounded-md bg-white px-2 py-0.5 font-display text-base leading-tight tabular-nums ring-1 ring-black/5"
                >
                  {set.weight > 0 ? `${formatWeight(set.weight)} kg × ${set.reps}` : `${set.reps} reps`}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex justify-end">
        <Button variant="danger" size="sm" onClick={() => onDelete(workout)} aria-label={`Delete ${workout.name}`}>
          Delete workout
        </Button>
      </div>
    </article>
  )
}
