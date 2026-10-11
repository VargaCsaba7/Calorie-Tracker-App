import type { ReactNode } from 'react'
import { formatGrams, MACROS, type MacroValues } from '../../lib/macros'

const KCAL_PER_PLATE = 100

// SVG geometry (viewBox units). The sleeve holds exactly one goal's worth of plates.
const VIEW_W = 640
const VIEW_H = 140
const SLEEVE_START = 74
const SLEEVE_END = 618
const PLATE_TOP = 12
const PLATE_HEIGHT = 116

interface BarbellMeterProps extends MacroValues {
  calories: number
  goal: number
  title?: string
  action?: ReactNode
}

/**
 * Splits `count` plates between the macros by their share of the calories,
 * using largest remainders so the counts always add up to `count`.
 */
function platesPerMacro(count: number, macros: MacroValues): (MacroValues & { other: number }) {
  const kcal = MACROS.map((m) => macros[m.key] * m.kcalPerGram)
  const total = kcal.reduce((a, b) => a + b, 0)
  if (total === 0) return { protein: 0, carbs: 0, fat: 0, other: count }

  const exact = kcal.map((k) => (k / total) * count)
  const result = exact.map(Math.floor)
  let left = count - result.reduce((a, b) => a + b, 0)
  const byRemainder = exact.map((e, i) => [e - Math.floor(e), i] as const).sort((a, b) => b[0] - a[0])
  for (const [, i] of byRemainder) {
    if (left-- <= 0) break
    result[i]++
  }
  return { protein: result[0], carbs: result[1], fat: result[2], other: 0 }
}

export function BarbellMeter({ calories, goal, protein, carbs, fat, title, action }: BarbellMeterProps) {
  const slots = Math.max(1, Math.ceil(goal / KCAL_PER_PLATE))
  const loaded = Math.min(slots, Math.round(calories / KCAL_PER_PLATE))
  const counts = platesPerMacro(loaded, { protein, carbs, fat })

  // Inner to outer: protein, carbs, fat, then calories without macro data
  const plateColors = [
    ...Array<string>(counts.protein).fill('var(--color-protein)'),
    ...Array<string>(counts.carbs).fill('var(--color-carbs)'),
    ...Array<string>(counts.fat).fill('var(--color-fat)'),
    ...Array<string>(counts.other).fill('var(--color-steel)'),
  ]

  const slotWidth = (SLEEVE_END - SLEEVE_START) / slots
  const plateWidth = Math.max(slotWidth - 2, 1)
  const remaining = goal - calories
  const isOver = remaining < 0
  const isFull = !isOver && loaded === slots

  const status = isOver
    ? `${Math.abs(remaining).toLocaleString('en-GB')} kcal over your goal`
    : isFull
      ? 'Goal reached'
      : `${remaining.toLocaleString('en-GB')} kcal to go`

  return (
    <section className="overflow-hidden rounded-3xl bg-rubber p-5 text-white sm:p-7">
      {title && <h2 className="text-lg text-steel">{title}</h2>}

      <div className="mt-1 flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
        <p className="font-display leading-none">
          <span className="text-6xl font-bold tabular-nums sm:text-7xl">{calories.toLocaleString('en-GB')}</span>
          <span className="ml-2 text-2xl text-steel">/ {goal.toLocaleString('en-GB')} kcal</span>
        </p>
        <p
          className={`font-display text-xl font-semibold ${
            isOver ? 'text-plate-red' : isFull ? 'text-plate-green' : 'text-white/80'
          }`}
        >
          {status}
        </p>
      </div>

      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="mt-5 w-full"
        role="img"
        aria-label={`${calories} of ${goal} kcal eaten: ${formatGrams(protein)} g protein, ${formatGrams(carbs)} g carbs, ${formatGrams(fat)} g fat`}
      >
        {/* grip, inner collar, sleeve, end cap */}
        <rect x={0} y={66} width={62} height={8} rx={2} fill="#7d8691" />
        <rect x={60} y={46} width={12} height={48} rx={2} fill="#b8c0c9" />
        <rect x={72} y={62} width={SLEEVE_END - 70} height={16} rx={2} fill="#59616c" />
        <rect
          x={SLEEVE_END + 2}
          y={56}
          width={12}
          height={28}
          rx={2}
          fill={isOver ? 'var(--color-plate-red)' : '#b8c0c9'}
        />

        {plateColors.map((color, i) => (
          <rect
            // Remount on a new total so the plates slide on again
            key={`${loaded}-${i}`}
            x={SLEEVE_START + i * slotWidth + 1}
            y={PLATE_TOP}
            width={plateWidth}
            height={PLATE_HEIGHT}
            rx={Math.min(3, plateWidth / 3)}
            fill={color}
            className="animate-plate-on"
            style={{ animationDelay: `${i * 22}ms` }}
          />
        ))}
      </svg>

      <ul className="mt-5 grid grid-cols-3 gap-3">
        {MACROS.map((macro) => (
          <li key={macro.key} className="flex items-center gap-2.5">
            <span className="h-8 w-2 shrink-0 rounded-sm" style={{ backgroundColor: macro.color }} />
            <div>
              <p className="font-display text-2xl leading-none font-semibold tabular-nums">
                {formatGrams({ protein, carbs, fat }[macro.key])} g
              </p>
              <p className="text-sm text-steel">{macro.label}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-steel">Each plate is {KCAL_PER_PLATE} kcal.</p>
        {action}
      </div>
    </section>
  )
}
