import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { authApi } from '../api/auth'
import { getErrorMessage } from '../api/errors'
import type { ActivityLevel, Sex, User } from '../api/types'
import { useAuth } from '../auth/useAuth'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Field } from '../components/ui/Field'
import { ACTIVITY_LEVELS, GOAL_PRESETS, suggestMacros, toNumberOrNull } from '../lib/profile'

const str = (value: number | null) => (value === null ? '' : String(value))

export function ProfilePage() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  if (!user) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold">Profile</h1>
        {searchParams.has('welcome') ? (
          <p className="mt-1 max-w-xl text-brand-500">
            Welcome! Fill in your body data so the app can estimate how many calories you burn. You can skip this and
            come back any time.
          </p>
        ) : (
          <p className="mt-1 text-brand-500">Your body data and daily targets.</p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <BodyForm user={user} />
        <GoalsForm user={user} />
      </div>
    </div>
  )
}

function BodyForm({ user }: { user: User }) {
  const { setUser } = useAuth()
  const [sex, setSex] = useState<Sex | null>(user.sex)
  const [birthDate, setBirthDate] = useState(user.birth_date ?? '')
  const [height, setHeight] = useState(str(user.height_cm))
  const [weight, setWeight] = useState(str(user.weight_kg))
  const [activity, setActivity] = useState<ActivityLevel | null>(user.activity_level)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  async function handleSave() {
    setError(null)
    setSaved(false)
    setIsSaving(true)
    try {
      setUser(
        await authApi.updateMe({
          sex,
          birth_date: birthDate || null,
          height_cm: toNumberOrNull(height),
          weight_kg: toNumberOrNull(weight),
          activity_level: activity,
        }),
      )
      setSaved(true)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card title="Your body">
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault()
          void handleSave()
        }}
      >
        <fieldset>
          <legend className="mb-1 text-xs font-medium text-slate-600">Sex (used by the calorie formula)</legend>
          <div className="grid grid-cols-2 gap-2">
            {(['male', 'female'] as const).map((option) => (
              <label
                key={option}
                className={`flex h-10 cursor-pointer items-center justify-center rounded-lg border font-display text-lg font-semibold capitalize has-focus-visible:outline-2 has-focus-visible:outline-plate-blue ${
                  sex === option ? 'border-brand-600 bg-brand-600 text-white' : 'border-brand-100 bg-white hover:border-brand-500/40'
                }`}
              >
                <input
                  type="radio"
                  name="sex"
                  value={option}
                  className="sr-only"
                  checked={sex === option}
                  onChange={() => setSex(option)}
                />
                {option}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1.6fr_1fr_1fr]">
          <Field
            label="Birth date"
            type="date"
            className="col-span-2 sm:col-span-1"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
          <Field
            label="Height (cm)"
            type="number"
            inputMode="decimal"
            min={100}
            max={250}
            step="any"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
          />
          <Field
            label="Weight (kg)"
            type="number"
            inputMode="decimal"
            min={30}
            max={300}
            step="any"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>

        <fieldset>
          <legend className="mb-1 text-xs font-medium text-slate-600">How active are you?</legend>
          <div className="space-y-1.5">
            {ACTIVITY_LEVELS.map((level) => (
              <label
                key={level.value}
                className={`flex cursor-pointer flex-col gap-0.5 rounded-lg border px-3 py-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3 has-focus-visible:outline-2 has-focus-visible:outline-plate-blue ${
                  activity === level.value ? 'border-brand-600 bg-brand-50' : 'border-brand-100 bg-white hover:border-brand-500/40'
                }`}
              >
                <input
                  type="radio"
                  name="activity"
                  value={level.value}
                  className="sr-only"
                  checked={activity === level.value}
                  onChange={() => setActivity(level.value)}
                />
                <span className="font-medium">{level.label}</span>
                <span className="text-sm text-slate-500 sm:text-right">{level.description}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <Alert message={error} />
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save body data'}
          </Button>
          {saved && <p className="text-sm text-plate-green">Saved</p>}
        </div>
      </form>
    </Card>
  )
}

function GoalsForm({ user }: { user: User }) {
  const { setUser } = useAuth()
  const [calories, setCalories] = useState(String(user.daily_calorie_goal))
  const [protein, setProtein] = useState(str(user.protein_goal))
  const [carbs, setCarbs] = useState(str(user.carbs_goal))
  const [fat, setFat] = useState(str(user.fat_goal))
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const energy = user.energy

  async function handleSave() {
    setError(null)
    setSaved(false)
    setIsSaving(true)
    try {
      setUser(
        await authApi.updateMe({
          daily_calorie_goal: Number(calories),
          protein_goal: toNumberOrNull(protein),
          carbs_goal: toNumberOrNull(carbs),
          fat_goal: toNumberOrNull(fat),
        }),
      )
      setSaved(true)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  function fillSuggestedMacros() {
    if (!user.weight_kg) return
    const suggestion = suggestMacros(Number(calories), user.weight_kg)
    setProtein(String(suggestion.protein))
    setCarbs(String(suggestion.carbs))
    setFat(String(suggestion.fat))
  }

  return (
    <Card title="Daily targets" className="lg:self-start">
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault()
          void handleSave()
        }}
      >
        {energy ? (
          <div className="rounded-xl bg-chalk p-4">
            <p className="text-sm text-brand-500">You burn about</p>
            <p className="font-display text-4xl font-bold tabular-nums">
              {energy.maintenance_calories.toLocaleString('en-GB')} <span className="text-xl font-semibold">kcal a day</span>
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Resting {energy.bmr.toLocaleString('en-GB')} kcal (BMR), plus your activity.
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {GOAL_PRESETS.map((preset) => {
                const value = Math.round((energy.maintenance_calories + preset.offset) / 50) * 50
                const isSelected = Number(calories) === value
                return (
                  <button
                    key={preset.label}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setCalories(String(value))}
                    className={`rounded-lg border px-2 py-2 text-left ${
                      isSelected ? 'border-brand-600 bg-brand-600 text-white' : 'border-brand-100 bg-white hover:border-brand-500/40'
                    }`}
                  >
                    <span className="block font-display text-lg leading-tight font-semibold">{preset.label}</span>
                    <span className={`block text-xs ${isSelected ? 'text-white/70' : 'text-slate-500'}`}>
                      {value.toLocaleString('en-GB')} kcal, {preset.hint}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <p className="rounded-xl bg-chalk p-4 text-sm text-brand-500">
            Save your body data and you'll get an estimate of your daily calorie needs here.
          </p>
        )}

        <Field
          label="Calorie goal (kcal per day)"
          type="number"
          required
          min={800}
          max={10000}
          step={50}
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
        />

        <div>
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <p className="text-xs font-medium text-slate-600">Macro targets in grams (optional)</p>
            {user.weight_kg && (
              <Button variant="ghost" size="sm" onClick={fillSuggestedMacros}>
                Suggest for me
              </Button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Protein" type="number" min={0} max={1000} placeholder="—" value={protein} onChange={(e) => setProtein(e.target.value)} />
            <Field label="Carbs" type="number" min={0} max={1000} placeholder="—" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
            <Field label="Fat" type="number" min={0} max={1000} placeholder="—" value={fat} onChange={(e) => setFat(e.target.value)} />
          </div>
          {user.weight_kg && (
            <p className="mt-1.5 text-xs text-slate-500">
              Suggestion: 2 g protein per kg bodyweight, 25% of calories from fat, carbs for the rest.
            </p>
          )}
        </div>

        <Alert message={error} />
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save targets'}
          </Button>
          {saved && <p className="text-sm text-plate-green">Saved</p>}
        </div>
      </form>
    </Card>
  )
}
