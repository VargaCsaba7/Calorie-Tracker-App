import type { User } from '../../api/types'
import { activityLabel } from '../../lib/profile'
import { ButtonLink } from '../ui/Button'

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div>
      <dt className="text-sm text-brand-500">{label}</dt>
      <dd className="font-display text-3xl leading-tight font-bold tabular-nums">
        {value}
        {unit && <span className="ml-1 text-base font-semibold text-brand-500">{unit}</span>}
      </dd>
    </div>
  )
}

/** Body data and calorie needs, or a prompt to fill them in. */
export function BodyPanel({ user }: { user: User }) {
  const energy = user.energy

  if (!energy) {
    return (
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-dashed border-brand-100 bg-white p-5">
        <div className="max-w-md">
          <h2 className="text-2xl font-bold">How much should you eat?</h2>
          <p className="mt-1 text-brand-500">
            Add your height, weight, age and activity level, and the app will calculate how many calories you burn
            in a day.
          </p>
        </div>
        <ButtonLink to="/profile">Complete your profile</ButtonLink>
      </section>
    )
  }

  const difference = user.daily_calorie_goal - energy.maintenance_calories
  const goalNote =
    difference === 0
      ? 'Same as maintenance'
      : `${Math.abs(difference).toLocaleString('en-GB')} kcal ${difference < 0 ? 'below' : 'above'} maintenance`

  return (
    <section className="rounded-2xl border border-black/5 bg-white p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-semibold">Your body</h2>
        <ButtonLink to="/profile" variant="secondary" size="sm">
          Edit profile
        </ButtonLink>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Weight" value={String(user.weight_kg)} unit="kg" />
        <Stat label="Height" value={String(user.height_cm)} unit="cm" />
        <Stat label="Age" value={String(energy.age)} />
        <Stat label="Resting burn (BMR)" value={energy.bmr.toLocaleString('en-GB')} unit="kcal" />
        <Stat label="Maintenance" value={energy.maintenance_calories.toLocaleString('en-GB')} unit="kcal" />
        <Stat label="Your goal" value={user.daily_calorie_goal.toLocaleString('en-GB')} unit="kcal" />
      </dl>
      <p className="mt-3 text-sm text-slate-500">
        {activityLabel(user.activity_level)}. Your goal is {goalNote.toLowerCase()}.
      </p>
    </section>
  )
}
