import { formatGrams, MACROS, type MacroValues } from '../../lib/macros'

/** Grams per macro, plus a bar showing each macro's share of the calories. */
export function MacroBreakdown(values: MacroValues) {
  const items = MACROS.map((macro) => ({
    ...macro,
    grams: values[macro.key],
    kcal: values[macro.key] * macro.kcalPerGram,
  }))
  const totalKcal = items.reduce((sum, item) => sum + item.kcal, 0)

  return (
    <div>
      <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
        {totalKcal > 0 &&
          items.map((item) => (
            <div
              key={item.key}
              className="h-full"
              style={{ width: `${(item.kcal / totalKcal) * 100}%`, backgroundColor: item.color }}
            />
          ))}
      </div>
      <ul className="mt-3 grid grid-cols-3 gap-2">
        {items.map((item) => (
          <li key={item.key}>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              {item.label}
            </div>
            <p className="mt-0.5 font-semibold tabular-nums">{formatGrams(item.grams)} g</p>
            <p className="text-xs text-slate-400 tabular-nums">
              {totalKcal > 0 ? Math.round((item.kcal / totalKcal) * 100) : 0}% of kcal
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
