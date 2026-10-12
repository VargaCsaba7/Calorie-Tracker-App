import axios from 'axios'
import { useEffect, useState, type ReactNode } from 'react'
import { getErrorMessage } from '../../api/errors'
import { exerciseLibraryApi } from '../../api/exerciseLibrary'
import type { ExerciseInfo, MuscleGroup } from '../../api/types'
import { GROUP_BODY_PARTS, MUSCLE_GROUPS } from '../../lib/muscles'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { MiniBody } from './BodyMap'
import { ExerciseCard } from './ExerciseCard'

const PAGE_SIZE = 24
const TYPES = [
  { value: 'strength', label: 'Strength' },
  { value: '', label: 'All types' },
  { value: 'stretching', label: 'Stretching' },
  { value: 'plyometrics', label: 'Plyometrics' },
  { value: 'cardio', label: 'Cardio' },
]

export function ExerciseBrowser({ onOpen }: { onOpen: (exercise: ExerciseInfo) => void }) {
  const [group, setGroup] = useState<MuscleGroup | null>(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('strength')
  const [items, setItems] = useState<ExerciseInfo[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Reload from the first page whenever a filter changes (the search waits for a typing pause)
  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(
      async () => {
        setIsLoading(true)
        setError(null)
        try {
          const page = await exerciseLibraryApi.browse(
            { group: group ?? undefined, q: query.trim() || undefined, category: category || undefined, limit: PAGE_SIZE },
            controller.signal,
          )
          setItems(page.items)
          setTotal(page.total)
        } catch (err) {
          if (!axios.isCancel(err)) setError(getErrorMessage(err))
        } finally {
          if (!controller.signal.aborted) setIsLoading(false)
        }
      },
      query ? 350 : 0,
    )
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [group, query, category])

  async function loadMore() {
    setIsLoading(true)
    try {
      const page = await exerciseLibraryApi.browse({
        group: group ?? undefined,
        q: query.trim() || undefined,
        category: category || undefined,
        skip: items.length,
        limit: PAGE_SIZE,
      })
      setItems((prev) => [...prev, ...page.items])
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div role="group" aria-label="Muscle group" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        <GroupChip label="All" active={group === null} onClick={() => setGroup(null)} />
        {MUSCLE_GROUPS.map((g) => (
          <GroupChip key={g.id} label={g.label} active={group === g.id} onClick={() => setGroup(g.id)}>
            <MiniBody parts={GROUP_BODY_PARTS[g.id]} view={g.view} />
          </GroupChip>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <Field
          label="Search exercises"
          type="search"
          placeholder="e.g. bench press, curl, squat"
          className="min-w-52 flex-1"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Type</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-[38px] rounded-lg border border-slate-300 bg-white px-2 text-sm"
          >
            {TYPES.map((t) => (
              <option key={t.label} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <Alert message={error} />
      <p className="text-sm text-brand-500" aria-live="polite">
        {isLoading && items.length === 0 ? 'Loading exercises...' : `${total} ${total === 1 ? 'exercise' : 'exercises'}`}
      </p>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((exercise) => (
          <li key={exercise.id}>
            <ExerciseCard exercise={exercise} onOpen={onOpen} />
          </li>
        ))}
      </ul>

      {items.length < total && (
        <div className="flex justify-center">
          <Button variant="secondary" onClick={() => void loadMore()} disabled={isLoading}>
            {isLoading ? 'Loading...' : `Show more (${total - items.length} left)`}
          </Button>
        </div>
      )}
    </div>
  )
}

function GroupChip({
  label,
  active,
  onClick,
  children,
}: {
  label: string
  active: boolean
  onClick: () => void
  children?: ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex min-w-16 shrink-0 flex-col items-center gap-1 rounded-xl border px-2 py-1.5 text-xs font-medium ${
        active ? 'border-brand-600 bg-brand-600 text-white' : 'border-brand-100 bg-white text-brand-600 hover:border-brand-500/40'
      }`}
    >
      {children ?? <span className="flex h-[3.2rem] items-center font-display text-lg">All</span>}
      {children && label}
    </button>
  )
}
