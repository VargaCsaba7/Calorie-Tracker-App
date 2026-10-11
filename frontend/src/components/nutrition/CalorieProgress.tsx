interface CalorieProgressProps {
  consumed: number
  goal: number
}

export function CalorieProgress({ consumed, goal }: CalorieProgressProps) {
  const percent = goal > 0 ? Math.min(consumed / goal, 1) * 100 : 0
  const remaining = goal - consumed
  const isOver = remaining < 0

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p>
          <span className="text-3xl font-bold tabular-nums">{consumed.toLocaleString('en-GB')}</span>
          <span className="text-slate-500"> / {goal.toLocaleString('en-GB')} kcal</span>
        </p>
        <p className={`text-sm font-medium ${isOver ? 'text-red-600' : 'text-slate-600'}`}>
          {isOver
            ? `${Math.abs(remaining).toLocaleString('en-GB')} kcal over goal`
            : `${remaining.toLocaleString('en-GB')} kcal left`}
        </p>
      </div>
      <div
        className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-label="Calories eaten"
        aria-valuemin={0}
        aria-valuemax={goal}
        aria-valuenow={consumed}
      >
        <div
          className={`h-full rounded-full transition-[width] ${isOver ? 'bg-red-500' : 'bg-brand-500'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
