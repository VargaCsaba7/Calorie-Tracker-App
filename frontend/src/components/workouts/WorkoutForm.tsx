import { useState } from 'react'
import { getErrorMessage } from '../../api/errors'
import { exerciseLibraryApi } from '../../api/exerciseLibrary'
import type { ExerciseInfo, WorkoutInput } from '../../api/types'
import { workoutsApi } from '../../api/workouts'
import { ExerciseBrowser } from '../exercises/ExerciseBrowser'
import { ExerciseDetail } from '../exercises/ExerciseDetail'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { Modal } from '../ui/Modal'

// Form state keeps raw input strings; they are converted to numbers on submit.
interface SetDraft {
  id: string
  weight: string
  reps: string
}

interface ExerciseDraft {
  id: string
  name: string
  sets: SetDraft[]
}

const WORKOUT_SUGGESTIONS = ['Chest & Triceps', 'Back & Biceps', 'Legs', 'Shoulders', 'Push', 'Pull', 'Full body']
const EXERCISE_SUGGESTIONS = [
  'Bench press',
  'Incline dumbbell press',
  'Dips',
  'Triceps pushdown',
  'Pull-up',
  'Barbell row',
  'Lat pulldown',
  'Biceps curl',
  'Squat',
  'Deadlift',
  'Leg press',
  'Overhead press',
  'Lateral raise',
]

// A new set copies the previous one, since sets are usually similar.
const newSet = (previous?: SetDraft): SetDraft => ({
  id: crypto.randomUUID(),
  weight: previous?.weight ?? '',
  reps: previous?.reps ?? '',
})

const newExercise = (): ExerciseDraft => ({ id: crypto.randomUUID(), name: '', sets: [newSet()] })

interface WorkoutFormProps {
  /** Controlled, so the calendar can pick the day */
  date: string
  onDateChange: (date: string) => void
  onSaved: () => void
}

export function WorkoutForm({ date, onDateChange, onSaved }: WorkoutFormProps) {
  const [name, setName] = useState('')
  const [exercises, setExercises] = useState<ExerciseDraft[]>(() => [newExercise()])
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  // "How to do it": the library entry for the typed name, or why there is none
  const [info, setInfo] = useState<{ exercise: ExerciseInfo | null; message: string | null } | null>(null)
  // "Choose from library": which exercise row gets the picked name
  const [pickingFor, setPickingFor] = useState<string | null>(null)
  const [pickPreview, setPickPreview] = useState<ExerciseInfo | null>(null)

  async function showInfo(name: string) {
    setInfo({ exercise: null, message: 'Loading...' })
    try {
      const exercise = await exerciseLibraryApi.match(name)
      setInfo(
        exercise
          ? { exercise, message: null }
          : { exercise: null, message: `"${name}" isn't in the exercise library. Use "Choose from library" to find a similar one.` },
      )
    } catch (err) {
      setInfo({ exercise: null, message: getErrorMessage(err) })
    }
  }

  function closePicker() {
    setPickingFor(null)
    setPickPreview(null)
  }

  function updateExercise(exerciseId: string, update: (exercise: ExerciseDraft) => ExerciseDraft) {
    setExercises((prev) => prev.map((ex) => (ex.id === exerciseId ? update(ex) : ex)))
  }

  function updateSet(exerciseId: string, setId: string, changes: Partial<SetDraft>) {
    updateExercise(exerciseId, (ex) => ({
      ...ex,
      sets: ex.sets.map((set) => (set.id === setId ? { ...set, ...changes } : set)),
    }))
  }

  function toPayload(): WorkoutInput {
    return {
      name: name.trim(),
      date,
      exercises: exercises.map((ex) => ({
        name: ex.name.trim(),
        sets: ex.sets
          .filter((set) => set.reps !== '')
          .map((set) => ({ weight: Number(set.weight) || 0, reps: Number(set.reps) })),
      })),
    }
  }

  async function handleSubmit() {
    setError(null)
    setIsSaving(true)
    try {
      await workoutsApi.create(toPayload())
      setName('')
      setExercises([newExercise()])
      onSaved()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          void handleSubmit()
        }}
      >
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Field
            label="Workout"
            placeholder="e.g. Chest & Triceps"
            list="workout-suggestions"
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Field label="Date" type="date" required value={date} onChange={(e) => onDateChange(e.target.value)} />
        </div>
        <datalist id="workout-suggestions">
          {WORKOUT_SUGGESTIONS.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
        <datalist id="exercise-suggestions">
          {EXERCISE_SUGGESTIONS.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>

        {exercises.map((exercise, exerciseIndex) => (
          <fieldset key={exercise.id} className="rounded-xl border border-black/5 bg-chalk/70 p-3">
            <legend className="sr-only">Exercise {exerciseIndex + 1}</legend>
            <div className="flex items-end gap-2">
              {/* Exercises are done in order, so they are numbered */}
              <span
                aria-hidden="true"
                className="mb-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-rubber font-display text-lg font-bold text-white"
              >
                {exerciseIndex + 1}
              </span>
              <Field
                className="flex-1"
                label={`Exercise ${exerciseIndex + 1}`}
                hideLabel
                placeholder="Exercise, e.g. Bench press"
                list="exercise-suggestions"
                required
                maxLength={100}
                value={exercise.name}
                onChange={(e) => updateExercise(exercise.id, (ex) => ({ ...ex, name: e.target.value }))}
              />
              {exercises.length > 1 && (
                <Button
                  variant="danger"
                  size="sm"
                  className="mb-1"
                  onClick={() => setExercises((prev) => prev.filter((ex) => ex.id !== exercise.id))}
                >
                  Remove
                </Button>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5 pl-10">
              <Button
                variant="ghost"
                size="sm"
                disabled={exercise.name.trim().length < 2}
                onClick={() => void showInfo(exercise.name.trim())}
              >
                <span aria-hidden="true" className="flex size-4 items-center justify-center rounded-full bg-rubber text-[10px] text-white">i</span>
                How to do it
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setPickingFor(exercise.id)}>
                Choose from library
              </Button>
            </div>

            <div className="mt-3 space-y-2">
              <div aria-hidden="true" className="grid grid-cols-[3rem_1fr_1fr_2rem] gap-2 text-xs font-medium text-slate-500">
                <span>Set</span>
                <span>Weight (kg)</span>
                <span>Reps</span>
              </div>
              {exercise.sets.map((set, setIndex) => (
                <div key={set.id} className="grid grid-cols-[3rem_1fr_1fr_2rem] items-center gap-2">
                  <span className="font-display text-lg font-semibold text-brand-500">{setIndex + 1}</span>
                  <Field
                    label={`Set ${setIndex + 1} weight (kg)`}
                    hideLabel
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={1000}
                    step="any"
                    placeholder="0"
                    value={set.weight}
                    onChange={(e) => updateSet(exercise.id, set.id, { weight: e.target.value })}
                  />
                  <Field
                    label={`Set ${setIndex + 1} reps`}
                    hideLabel
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={1000}
                    placeholder="0"
                    required
                    value={set.reps}
                    onChange={(e) => updateSet(exercise.id, set.id, { reps: e.target.value })}
                  />
                  {exercise.sets.length > 1 ? (
                    <button
                      type="button"
                      aria-label={`Remove set ${setIndex + 1}`}
                      className="flex size-8 items-center justify-center rounded-lg border border-brand-100 bg-white text-lg text-slate-500 hover:border-plate-red/40 hover:text-plate-red"
                      onClick={() =>
                        updateExercise(exercise.id, (ex) => ({
                          ...ex,
                          sets: ex.sets.filter((s) => s.id !== set.id),
                        }))
                      }
                    >
                      ×
                    </button>
                  ) : (
                    <span />
                  )}
                </div>
              ))}
            </div>

            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() => updateExercise(exercise.id, (ex) => ({ ...ex, sets: [...ex.sets, newSet(ex.sets.at(-1))] }))}
            >
              + Add set
            </Button>
          </fieldset>
        ))}

        <Button variant="secondary" className="w-full" onClick={() => setExercises((prev) => [...prev, newExercise()])}>
          + Add exercise
        </Button>

        <Alert message={error} />
        <Button type="submit" className="w-full" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save workout'}
        </Button>
      </form>

      <Modal open={info !== null} onClose={() => setInfo(null)} title={info?.exercise?.name ?? 'Exercise info'}>
        {info?.exercise ? <ExerciseDetail exercise={info.exercise} /> : <p className="text-brand-500">{info?.message}</p>}
      </Modal>

      <Modal open={pickingFor !== null} onClose={closePicker} title={pickPreview?.name ?? 'Choose an exercise'} size="xl">
        {pickPreview ? (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => setPickPreview(null)}>
              ← Back to all exercises
            </Button>
            <ExerciseDetail
              exercise={pickPreview}
              onUse={(picked) => {
                if (pickingFor) updateExercise(pickingFor, (ex) => ({ ...ex, name: picked.name }))
                closePicker()
              }}
            />
          </div>
        ) : (
          <ExerciseBrowser onOpen={setPickPreview} />
        )}
      </Modal>
    </>
  )
}
