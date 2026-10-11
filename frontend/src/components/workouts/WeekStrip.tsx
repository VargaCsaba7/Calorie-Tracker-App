import type { Workout } from '../../api/types'
import { addDays, formatDate, today } from '../../lib/date'
import { formatWeight, textOnPlate, workoutColor, workoutVolume } from '../../lib/workout'

/** The last 7 days as a row of plates: filled on days you trained. */
export function WeekStrip({ workouts }: { workouts: Workout[] }) {
  const end = today()
  const start = addDays(end, -6)
  const thisWeek = workouts.filter((w) => w.date >= start && w.date <= end)
  const volume = thisWeek.reduce((sum, w) => sum + workoutVolume(w), 0)

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(start, i)
    return { date, workouts: thisWeek.filter((w) => w.date === date) }
  })

  return (
    <section className="rounded-3xl bg-rubber p-5 text-white sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div>
          <h2 className="text-lg text-steel">Last 7 days</h2>
          <p className="font-display leading-none">
            <span className="text-6xl font-bold tabular-nums">{thisWeek.length}</span>
            <span className="ml-2 text-2xl text-steel">{thisWeek.length === 1 ? 'workout' : 'workouts'}</span>
          </p>
          <p className="mt-1 font-display text-xl text-white/80">{formatWeight(volume)} kg lifted</p>
        </div>

        <ol className="flex gap-1.5 sm:gap-2">
          {days.map((day) => {
            const trained = day.workouts.length > 0
            return (
              <li key={day.date} className="flex flex-col items-center gap-1.5">
                <span
                  className={`flex h-14 w-8 items-end justify-center rounded-md sm:w-10 ${trained ? '' : 'border border-dashed border-white/30'}`}
                  style={trained ? { backgroundColor: workoutColor(day.workouts[0].name) } : undefined}
                  title={trained ? day.workouts.map((w) => w.name).join(', ') : 'Rest day'}
                >
                  {trained && (
                    <span
                      className={`mb-1 max-w-full truncate px-0.5 font-display text-[10px] leading-none font-semibold ${textOnPlate(
                        workoutColor(day.workouts[0].name),
                      )}`}
                    >
                      {day.workouts[0].name}
                    </span>
                  )}
                </span>
                <span className={`text-xs ${day.date === end ? 'font-semibold text-white' : 'text-steel'}`}>
                  {formatDate(day.date, { weekday: 'short' })}
                </span>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
