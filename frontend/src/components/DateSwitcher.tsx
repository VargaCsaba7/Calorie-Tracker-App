import { addDays, today } from '../lib/date'
import { Button } from './ui/Button'

interface DateSwitcherProps {
  value: string
  onChange: (date: string) => void
}

export function DateSwitcher({ value, onChange }: DateSwitcherProps) {
  const isToday = value === today()
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Button variant="secondary" size="sm" onClick={() => onChange(addDays(value, -1))} aria-label="Previous day">
        ←
      </Button>
      <input
        type="date"
        aria-label="Selected day"
        className="h-8 rounded-lg border border-brand-100 bg-white px-2 text-sm"
        value={value}
        onChange={(e) => e.target.value && onChange(e.target.value)}
      />
      <Button variant="secondary" size="sm" onClick={() => onChange(addDays(value, 1))} aria-label="Next day">
        →
      </Button>
      <Button variant="secondary" size="sm" disabled={isToday} onClick={() => onChange(today())}>
        Go to today
      </Button>
    </div>
  )
}
