/** YYYY-MM-DD in local time. (toISOString would use UTC and can shift the day.) */
export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function today(): string {
  return toISODate(new Date())
}

function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(iso: string, days: number): string {
  const date = parseISODate(iso)
  date.setDate(date.getDate() + days)
  return toISODate(date)
}

/** Monday of the week the day is in. */
export function mondayOf(iso: string): string {
  const weekday = (parseISODate(iso).getDay() + 6) % 7 // Monday = 0
  return addDays(iso, -weekday)
}

/** Month keys look like "2026-10". */
export function monthOf(iso: string): string {
  return iso.slice(0, 7)
}

export function addMonths(month: string, months: number): string {
  const [y, m] = month.split('-').map(Number)
  return toISODate(new Date(y, m - 1 + months, 1)).slice(0, 7)
}

export function lastDayOfMonth(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return toISODate(new Date(y, m, 0))
}

export function formatDate(
  iso: string,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' },
): string {
  return parseISODate(iso).toLocaleDateString('en-GB', options)
}
