import { useState } from 'react'
import type { ExerciseInfo } from '../api/types'
import { ExerciseBrowser } from '../components/exercises/ExerciseBrowser'
import { ExerciseDetail } from '../components/exercises/ExerciseDetail'
import { Modal } from '../components/ui/Modal'

export function ExercisesPage() {
  const [open, setOpen] = useState<ExerciseInfo | null>(null)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold">Exercises</h1>
        <p className="mt-1 text-brand-500">Pick a muscle group, then open an exercise to see how it’s done.</p>
      </div>

      <ExerciseBrowser onOpen={setOpen} />

      <Modal open={open !== null} onClose={() => setOpen(null)} title={open?.name ?? ''}>
        {open && <ExerciseDetail exercise={open} />}
      </Modal>

      <p className="text-xs text-slate-500">
        Exercises and photos from the public domain{' '}
        <a href="https://github.com/yuhonas/free-exercise-db" target="_blank" rel="noreferrer" className="underline">
          free-exercise-db
        </a>
        .
      </p>
    </div>
  )
}
