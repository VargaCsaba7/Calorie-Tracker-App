import { addDays, today } from '../lib/date'
import { Button } from './ui/Button'

interface DateSwitcherProps {
  value: string
  onChange: (date: string) => void
}

export function DateSwitcher({ value, onChange }: DateSwitcherProps) {
  return (
    <div className="flex items-center gap-1">
      <Button variant="secondary" size="sm" onClick={() => onChange(addDays(value, -1))} aria-label="Previous day">
        ←
      </Button>
      <input
        type="date"
        aria-label="Selected day"
        className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm"
        value={value}
        onChange={(e) => e.target.value && onChange(e.target.value)}
      />
      <Button variant="secondary" size="sm" onClick={() => onChange(addDays(value, 1))} aria-label="Next day">
        →
      </Button>
      {value !== today() && (
        <Button variant="ghost" size="sm" onClick={() => onChange(today())}>
          Today
        </Button>
      )}
    </div>
  )
}
