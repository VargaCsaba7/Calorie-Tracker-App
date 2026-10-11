import { useState } from 'react'
import { foodsApi } from '../../api/foods'
import { useApi } from '../../hooks/useApi'
import { AiEstimate } from './AiEstimate'
import { FoodSearch } from './FoodSearch'
import { MealForm, type MealFormValues } from './MealForm'

type Tab = 'search' | 'ai' | 'manual'

const TABS: { id: Tab; label: string }[] = [
  { id: 'search', label: 'Search' },
  { id: 'ai', label: 'Describe (AI)' },
  { id: 'manual', label: 'By hand' },
]

interface AddMealPanelProps {
  date: string
  onSaved: () => void
}

/** Three ways to add a meal: pick a food, let the AI estimate it, or type the numbers. */
export function AddMealPanel({ date, onSaved }: AddMealPanelProps) {
  const [tab, setTab] = useState<Tab>('search')
  const [prefill, setPrefill] = useState<{ values: MealFormValues; version: number } | null>(null)
  const aiStatus = useApi(() => foodsApi.aiEnabled(), [])

  return (
    <div>
      <div role="tablist" aria-label="How to add the meal" className="mb-4 grid grid-cols-3 gap-1 rounded-xl bg-chalk p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-2 py-1.5 font-display text-base font-semibold tracking-wide ${
              tab === t.id ? 'bg-white text-brand-600 shadow-sm' : 'text-brand-500 hover:text-brand-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {tab === 'search' && <FoodSearch date={date} onSaved={onSaved} />}
        {tab === 'ai' && (
          <AiEstimate
            enabled={aiStatus.data ?? false}
            onReview={(values) => {
              setPrefill((prev) => ({ values, version: (prev?.version ?? 0) + 1 }))
              setTab('manual')
            }}
          />
        )}
        {tab === 'manual' && (
          <>
            {prefill && <p className="mb-3 text-sm text-brand-500">Filled in from the AI estimate. Adjust anything that looks off.</p>}
            <MealForm
              // A new estimate remounts the form with its values
              key={prefill?.version ?? 0}
              date={date}
              initialValues={prefill?.values}
              onSaved={() => {
                setPrefill(null)
                onSaved()
              }}
            />
          </>
        )}
      </div>
    </div>
  )
}
