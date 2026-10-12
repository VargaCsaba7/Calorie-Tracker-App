import { useState } from 'react'
import { getErrorMessage } from '../../api/errors'
import { foodsApi } from '../../api/foods'
import type { FoodEstimate } from '../../api/types'
import { formatGrams } from '../../lib/macros'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import type { MealFormValues } from './MealForm'

interface AiEstimateProps {
  enabled: boolean
  /** The estimate goes to the manual form, so the user checks it before saving */
  onReview: (values: MealFormValues) => void
}

export function AiEstimate({ enabled, onReview }: AiEstimateProps) {
  const [description, setDescription] = useState('')
  const [estimate, setEstimate] = useState<FoodEstimate | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  if (!enabled) {
    return (
      <p className="rounded-xl bg-chalk p-4 text-sm text-brand-500">
        The AI isn’t available right now. Make sure Ollama is running (it starts with start.bat), or search
        for a food or enter the meal by hand.
      </p>
    )
  }

  async function handleEstimate() {
    setError(null)
    setEstimate(null)
    setIsLoading(true)
    try {
      setEstimate(await foodsApi.estimate(description.trim()))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          void handleEstimate()
        }}
      >
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Describe what you ate</span>
          <textarea
            required
            minLength={2}
            maxLength={300}
            rows={3}
            placeholder="e.g. egy tányér gulyásleves két szelet kenyérrel"
            className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <Button type="submit" className="w-full" disabled={isLoading || description.trim().length < 2}>
          {isLoading ? 'Estimating...' : 'Estimate calories'}
        </Button>
      </form>

      <Alert message={error} />

      {estimate && (
        <div className="rounded-xl border border-black/5 bg-chalk p-4">
          <p className="font-display leading-none">
            <span className="text-3xl font-bold tabular-nums">{estimate.calories}</span>
            <span className="ml-1 text-slate-500">kcal</span>
            <span className="ml-2 font-sans text-sm text-slate-500">about {Math.round(estimate.portion_grams)} g</span>
          </p>
          <p className="mt-1 text-sm tabular-nums">
            {formatGrams(estimate.protein)} g protein, {formatGrams(estimate.carbs)} g carbs, {formatGrams(estimate.fat)} g fat
          </p>

          <ul className="mt-3 divide-y divide-black/5 rounded-lg bg-white px-3">
            {estimate.items.map((item, i) => (
              <li key={`${item.name}-${i}`} className="flex items-baseline justify-between gap-3 py-2 text-sm">
                <span className="min-w-0">
                  <span className="font-medium">{item.name}</span>
                  <span className="ml-1.5 text-slate-500">{formatGrams(item.grams)} g</span>
                  <span className={`block text-xs ${item.database_food ? 'text-plate-green' : 'text-slate-500'}`}>
                    {item.database_food ? `From the food database: ${item.database_food}` : 'AI estimate'}
                  </span>
                </span>
                <span className="font-display text-base font-semibold whitespace-nowrap tabular-nums">{item.calories} kcal</span>
              </li>
            ))}
          </ul>

          <p className="mt-2 text-xs text-slate-500">
            The AI read the foods and amounts from your description. Check them before saving.
          </p>
          <Button
            className="mt-3 w-full"
            onClick={() =>
              onReview({
                name: estimate.name.slice(0, 100),
                calories: String(estimate.calories),
                protein: String(Math.round(estimate.protein * 10) / 10),
                carbs: String(Math.round(estimate.carbs * 10) / 10),
                fat: String(Math.round(estimate.fat * 10) / 10),
              })
            }
          >
            Review and add
          </Button>
        </div>
      )}
    </div>
  )
}
