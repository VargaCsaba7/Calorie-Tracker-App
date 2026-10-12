import type { ExerciseInfo } from '../../api/types'
import { capitalize } from '../../lib/muscles'
import { Button } from '../ui/Button'
import { BodyMap } from './BodyMap'
import { ExerciseImages } from './ExerciseImages'

interface ExerciseDetailProps {
  exercise: ExerciseInfo
  /** Shown when picking an exercise for a workout */
  onUse?: (exercise: ExerciseInfo) => void
}

function youtubeUrl(name: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} exercise proper form`)}`
}

export function ExerciseDetail({ exercise, onUse }: ExerciseDetailProps) {
  const facts = [
    ['Equipment', exercise.equipment],
    ['Level', exercise.level],
    ['Type', exercise.category],
    ['Movement', exercise.mechanic],
  ].filter((fact): fact is [string, string] => Boolean(fact[1]))

  return (
    <div className="space-y-5">
      <div className="grid gap-5 md:grid-cols-[1.3fr_1fr]">
        <ExerciseImages urls={exercise.image_urls} name={exercise.name} />
        <div className="space-y-3">
          <BodyMap primary={exercise.primary_muscles} secondary={exercise.secondary_muscles} />
          <p className="text-center text-sm">
            <span className="font-semibold">{exercise.primary_muscles.map(capitalize).join(', ')}</span>
            {exercise.secondary_muscles.length > 0 && (
              <span className="text-slate-500">, helped by {exercise.secondary_muscles.join(', ')}</span>
            )}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {facts.map(([label, value]) => (
          <div key={label} className="rounded-lg bg-chalk px-3 py-2">
            <dt className="text-xs text-slate-500">{label}</dt>
            <dd className="font-medium">{capitalize(value)}</dd>
          </div>
        ))}
      </dl>

      <section>
        <h3 className="text-xl font-semibold">How to do it</h3>
        <ol className="mt-2 space-y-2">
          {exercise.instructions.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-rubber font-display text-sm font-bold text-white">
                {i + 1}
              </span>
              <span className="text-sm leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="flex flex-wrap gap-2">
        {onUse && <Button onClick={() => onUse(exercise)}>Use this exercise</Button>}
        <a
          href={youtubeUrl(exercise.name)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-brand-100 bg-white px-4 font-display font-semibold tracking-wide text-brand-600 hover:border-brand-500/40"
        >
          <span aria-hidden="true" className="text-plate-red">▶</span> Watch videos on YouTube
        </a>
      </div>
    </div>
  )
}
