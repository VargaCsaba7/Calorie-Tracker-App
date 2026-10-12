import axios from 'axios'
import { useEffect, useState } from 'react'
import { getErrorMessage } from '../../api/errors'
import { foodsApi } from '../../api/foods'
import { mealsApi } from '../../api/meals'
import type { Food, FoodSearchResult } from '../../api/types'
import { formatGrams, MACROS } from '../../lib/macros'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { FoodImage } from './FoodImage'

const SEARCH_DELAY_MS = 450

interface FoodSearchProps {
  date: string
  onSaved: () => void
}

export function FoodSearch({ date, onSaved }: FoodSearchProps) {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<FoodSearchResult | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Food | null>(null)

  // Search once typing pauses, and cancel a request that a newer query made obsolete
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) return
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setIsSearching(true)
      setError(null)
      try {
        setResult(await foodsApi.search(q, controller.signal))
      } catch (err) {
        if (!axios.isCancel(err)) setError(getErrorMessage(err))
      } finally {
        if (!controller.signal.aborted) setIsSearching(false)
      }
    }, SEARCH_DELAY_MS)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  async function select(food: Food) {
    setSelected(food)
    // The server may fill in a missing product photo on this request
    try {
      setSelected(await foodsApi.get(food.id))
    } catch {
      // keep the search result version
    }
  }

  if (selected) {
    return (
      <FoodPortion
        food={selected}
        date={date}
        onBack={() => setSelected(null)}
        onSaved={() => {
          setSelected(null)
          setQuery('')
          onSaved()
        }}
      />
    )
  }

  // Old results stay in state but are hidden once the query is too short again
  const shown = query.trim().length >= 2 ? result : null
  const common = shown?.foods.filter((f) => f.source === 'builtin') ?? []
  const products = shown?.foods.filter((f) => f.source !== 'builtin') ?? []

  return (
    <div className="space-y-3">
      <Field
        label="Search food"
        type="search"
        placeholder="e.g. rizs, csirkemell, Túró Rudi"
        autoComplete="off"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <Alert message={error} />
      {isSearching && <p className="text-sm text-slate-500">Searching...</p>}
      {shown && !shown.online_search_ok && (
        <p className="text-sm text-slate-500">Product search is busy right now, showing common foods only.</p>
      )}
      {shown && shown.foods.length === 0 && !isSearching && (
        <p className="text-sm text-slate-500">No matches. Try another word, or enter the meal by hand.</p>
      )}

      {common.length > 0 && <FoodGroup title="Common foods" foods={common} onSelect={select} />}
      {products.length > 0 && <FoodGroup title="Products from Open Food Facts" foods={products} onSelect={select} />}
    </div>
  )
}

function FoodGroup({ title, foods, onSelect }: { title: string; foods: Food[]; onSelect: (food: Food) => void }) {
  return (
    <section>
      <h3 className="mb-1 font-sans text-xs font-medium tracking-normal text-slate-500">{title}</h3>
      <ul className="space-y-1">
        {foods.map((food) => (
          <li key={food.id}>
            <button
              type="button"
              onClick={() => onSelect(food)}
              className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-chalk focus-visible:outline-2 focus-visible:outline-plate-blue"
            >
              <FoodImage imageUrl={food.image_url} emoji={food.emoji} name={food.name} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{food.name}</span>
                {food.brand && <span className="block truncate text-xs text-slate-500">{food.brand}</span>}
              </span>
              <span className="text-right">
                <span className="block font-display text-lg leading-none font-semibold tabular-nums">
                  {Math.round(food.kcal_100g)}
                </span>
                <span className="block text-xs text-slate-500">kcal / 100 g</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

interface FoodPortionProps {
  food: Food
  date: string
  onBack: () => void
  onSaved: () => void
}

function FoodPortion({ food, date, onBack, onSaved }: FoodPortionProps) {
  const [grams, setGrams] = useState(String(food.serving_g ?? 100))
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const amount = Number(grams) || 0
  const factor = amount / 100
  const calories = Math.round(food.kcal_100g * factor)
  const macros = {
    protein: food.protein_100g * factor,
    carbs: food.carbs_100g * factor,
    fat: food.fat_100g * factor,
  }
  const plates = Math.round(calories / 100)

  const presets = [
    ...(food.serving_g ? [{ label: `1 serving (${food.serving_g} g)`, grams: food.serving_g }] : []),
    { label: '100 g', grams: 100 },
  ]

  async function handleAdd() {
    setError(null)
    setIsSaving(true)
    try {
      await mealsApi.create({ date, food_id: food.id, grams: amount })
      onSaved()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        void handleAdd()
      }}
    >
      <Button variant="ghost" size="sm" onClick={onBack}>
        ← Back to results
      </Button>

      <div className="flex items-center gap-3">
        <FoodImage imageUrl={food.image_url} emoji={food.emoji} name={food.name} size="lg" />
        <div className="min-w-0">
          <p className="font-display text-2xl leading-tight font-semibold">{food.name}</p>
          {food.brand && <p className="text-sm text-slate-500">{food.brand}</p>}
          <p className="text-sm text-slate-500">{Math.round(food.kcal_100g)} kcal per 100 g</p>
        </div>
      </div>

      <div>
        <Field
          label="Amount (g)"
          type="number"
          inputMode="decimal"
          required
          min={1}
          max={5000}
          step="any"
          autoFocus
          value={grams}
          onChange={(e) => setGrams(e.target.value)}
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {presets.map((preset) => (
            <Button key={preset.label} variant="secondary" size="sm" onClick={() => setGrams(String(preset.grams))}>
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-rubber p-4 text-white">
        <p className="font-display leading-none">
          <span className="text-4xl font-bold tabular-nums">{calories}</span>
          <span className="ml-1.5 text-lg text-steel">kcal</span>
        </p>
        <p className="mt-1 text-sm text-steel">
          {plates === 0 ? 'Less than one plate on the bar' : `Loads ${plates} ${plates === 1 ? 'plate' : 'plates'} on today’s bar`}
        </p>
        <ul className="mt-3 grid grid-cols-3 gap-2">
          {MACROS.map((macro) => (
            <li key={macro.key} className="flex items-center gap-2">
              <span className="h-6 w-1.5 rounded-sm" style={{ backgroundColor: macro.color }} />
              <span>
                <span className="block font-display text-lg leading-none font-semibold tabular-nums">
                  {formatGrams(macros[macro.key])} g
                </span>
                <span className="block text-xs text-steel">{macro.label}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <Alert message={error} />
      <Button type="submit" className="w-full" disabled={isSaving || amount <= 0}>
        {isSaving ? 'Adding...' : `Add ${formatGrams(amount)} g to this day`}
      </Button>
    </form>
  )
}
