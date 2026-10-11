import { useState } from 'react'
import { getErrorMessage } from '../../api/errors'
import { mealsApi } from '../../api/meals'
import { caloriesFromMacros } from '../../lib/macros'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'

const emptyForm = { name: '', calories: '', protein: '', carbs: '', fat: '' }

interface MealFormProps {
  date: string
  onSaved: () => void
}

export function MealForm({ date, onSaved }: MealFormProps) {
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const macros = {
    protein: Number(form.protein) || 0,
    carbs: Number(form.carbs) || 0,
    fat: Number(form.fat) || 0,
  }
  const estimatedKcal = caloriesFromMacros(macros)

  function update(field: keyof typeof emptyForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit() {
    setError(null)
    setIsSaving(true)
    try {
      await mealsApi.create({ name: form.name.trim(), date, calories: Number(form.calories), ...macros })
      setForm(emptyForm)
      onSaved()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        void handleSubmit()
      }}
    >
      <Field
        label="Name"
        placeholder="e.g. Chicken and rice"
        required
        maxLength={100}
        value={form.name}
        onChange={(e) => update('name', e.target.value)}
      />
      <div className="grid grid-cols-3 gap-2">
        {(['protein', 'carbs', 'fat'] as const).map((key) => (
          <Field
            key={key}
            label={`${key[0].toUpperCase()}${key.slice(1)} (g)`}
            type="number"
            inputMode="decimal"
            min={0}
            max={1000}
            step="any"
            placeholder="0"
            value={form[key]}
            onChange={(e) => update(key, e.target.value)}
          />
        ))}
      </div>
      <Field
        label="Calories (kcal)"
        type="number"
        inputMode="numeric"
        required
        min={0}
        max={10000}
        value={form.calories}
        onChange={(e) => update('calories', e.target.value)}
      />
      {estimatedKcal > 0 && String(estimatedKcal) !== form.calories && (
        <p className="text-xs text-slate-500">
          Macros add up to about {estimatedKcal} kcal.{' '}
          <button
            type="button"
            className="font-medium text-brand-600 underline decoration-brand-100 decoration-2 underline-offset-4 hover:decoration-brand-600"
            onClick={() => update('calories', String(estimatedKcal))}
          >
            Use this
          </button>
        </p>
      )}
      <Alert message={error} />
      <Button type="submit" className="w-full" disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Add meal'}
      </Button>
    </form>
  )
}
