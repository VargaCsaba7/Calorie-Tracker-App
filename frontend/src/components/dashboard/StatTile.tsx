import type { ReactNode } from 'react'

interface StatTileProps {
  label: string
  value: string
  unit?: string
  hint?: string
}

export function StatTile({ label, value, unit, hint }: StatTileProps) {
  return (
    <div className="bg-white p-4 sm:p-5">
      <p className="text-sm text-brand-500">{label}</p>
      <p className="mt-1 font-display leading-none">
        <span className="text-4xl font-bold tabular-nums">{value}</span>
        {unit && <span className="ml-1 text-lg text-brand-500">{unit}</span>}
      </p>
      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

/** Tiles share one panel, separated by hairlines rather than floating as cards. */
export function StatRow({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-black/5 bg-black/5 lg:grid-cols-4">
      {children}
    </div>
  )
}
