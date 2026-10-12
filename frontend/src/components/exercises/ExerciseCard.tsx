import { useState } from 'react'
import type { ExerciseInfo } from '../../api/types'
import { capitalize } from '../../lib/muscles'

/** Grid card: hovering (or focusing) shows the end position, so the card hints at the movement. */
export function ExerciseCard({ exercise, onOpen }: { exercise: ExerciseInfo; onOpen: (e: ExerciseInfo) => void }) {
  const [showEnd, setShowEnd] = useState(false)
  const [start, end] = exercise.image_urls

  return (
    <button
      type="button"
      onClick={() => onOpen(exercise)}
      onMouseEnter={() => setShowEnd(true)}
      onMouseLeave={() => setShowEnd(false)}
      onFocus={() => setShowEnd(true)}
      onBlur={() => setShowEnd(false)}
      className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-black/5 bg-white text-left transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-plate-blue"
    >
      <span className="relative block aspect-[4/3] w-full bg-white">
        {start && (
          <img src={start} alt="" loading="lazy" className={`absolute inset-0 h-full w-full object-contain transition-opacity ${showEnd && end ? 'opacity-0' : 'opacity-100'}`} />
        )}
        {end && (
          <img src={end} alt="" loading="lazy" className={`absolute inset-0 h-full w-full object-contain transition-opacity ${showEnd ? 'opacity-100' : 'opacity-0'}`} />
        )}
        <span
          aria-hidden="true"
          className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-rubber/80 font-display text-sm font-bold text-white"
        >
          i
        </span>
      </span>
      <span className="flex flex-1 flex-col gap-0.5 border-t border-black/5 p-3">
        <span className="font-display text-lg leading-tight font-semibold">{exercise.name}</span>
        <span className="text-xs text-slate-500">
          {exercise.primary_muscles.map(capitalize).join(', ')}
          {exercise.equipment && `, ${exercise.equipment}`}
        </span>
      </span>
    </button>
  )
}
