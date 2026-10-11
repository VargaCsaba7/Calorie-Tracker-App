import { useState } from 'react'
import { authApi } from '../../api/auth'
import { getErrorMessage } from '../../api/errors'
import { useAuth } from '../../auth/useAuth'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'

export function GoalEditor({ onSaved }: { onSaved: () => void }) {
  const { user, setUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  if (!user) return null

  if (!isEditing) {
    return (
      <p className="text-sm text-slate-500">
        Daily goal:{' '}
        <span className="font-medium text-slate-700">{user.daily_calorie_goal.toLocaleString('en-GB')} kcal</span>{' '}
        <button
          type="button"
          className="font-medium text-brand-700 hover:underline"
          onClick={() => {
            setValue(String(user.daily_calorie_goal))
            setIsEditing(true)
          }}
        >
          Edit
        </button>
      </p>
    )
  }

  async function handleSave() {
    setError(null)
    setIsSaving(true)
    try {
      setUser(await authApi.updateMe({ daily_calorie_goal: Number(value) }))
      setIsEditing(false)
      onSaved()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault()
        void handleSave()
      }}
    >
      <div className="flex items-center gap-2">
        <Field
          label="Daily calorie goal (kcal)"
          hideLabel
          type="number"
          min={800}
          max={10000}
          step={50}
          required
          autoFocus
          className="w-32"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <Button type="submit" size="sm" disabled={isSaving}>
          Save
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
          Cancel
        </Button>
      </div>
      <Alert message={error} />
    </form>
  )
}
