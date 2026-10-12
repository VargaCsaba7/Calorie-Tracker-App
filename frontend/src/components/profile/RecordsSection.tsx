import { progressApi } from '../../api/progress'
import type { PersonalRecord } from '../../api/types'
import { useApi } from '../../hooks/useApi'
import { formatDate } from '../../lib/date'
import { formatWeight, workoutColor } from '../../lib/workout'
import { Alert } from '../ui/Alert'
import { Collapsible } from '../ui/Collapsible'

/** Collapsible: the best set of every exercise ever logged. */
export function RecordsSection() {
  return (
    <Collapsible title="Personal records" subtitle="Your best set on every exercise you’ve logged">
      <RecordsContent />
    </Collapsible>
  )
}

function bestSet(record: PersonalRecord) {
  return record.best_weight > 0
    ? `${formatWeight(record.best_weight)} kg × ${record.best_weight_reps}`
    : `${record.max_reps} reps`
}

function RecordsContent() {
  const records = useApi(() => progressApi.records(), [])

  if (records.error) return <Alert message={records.error} />
  if (!records.data) return <p className="text-sm text-slate-500">Loading...</p>
  if (records.data.length === 0) {
    return <p className="text-sm text-brand-500">Log a workout and your best sets will show up here.</p>
  }

  // The three strongest lifts get the spotlight, everything else goes in the table
  const top = records.data.filter((r) => r.estimated_1rm !== null).slice(0, 3)
  const rest = records.data.filter((r) => !top.includes(r))

  return (
    <div className="space-y-6">
      {top.length > 0 && (
        <ol className="grid gap-3 sm:grid-cols-3">
          {top.map((record) => (
            <li
              key={record.exercise}
              className="rounded-xl border-t-[6px] bg-rubber p-4 text-white"
              style={{ borderTopColor: workoutColor(record.exercise) }}
            >
              <p className="truncate font-display text-xl font-semibold">{record.exercise}</p>
              <p className="mt-2 font-display leading-none">
                <span className="text-5xl font-bold tabular-nums">{formatWeight(record.best_weight)}</span>
                <span className="ml-1 text-xl text-steel">kg × {record.best_weight_reps}</span>
              </p>
              <p className="mt-2 text-sm text-steel">
                Estimated max for one rep: <span className="font-semibold text-white">{formatWeight(record.estimated_1rm ?? 0)} kg</span>
              </p>
              <p className="text-xs text-steel">
                Set on {formatDate(record.best_weight_date, { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </li>
          ))}
        </ol>
      )}

      {rest.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-slate-500">
              <tr className="border-b border-black/5">
                <th scope="col" className="py-2 pr-3 font-medium">Exercise</th>
                <th scope="col" className="py-2 pr-3 font-medium">Best set</th>
                <th scope="col" className="py-2 pr-3 font-medium">Est. 1-rep max</th>
                <th scope="col" className="py-2 pr-3 font-medium">Most reps</th>
                <th scope="col" className="py-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {rest.map((record) => (
                <tr key={record.exercise}>
                  <th scope="row" className="py-2 pr-3 font-medium">{record.exercise}</th>
                  <td className="py-2 pr-3 font-display text-base font-semibold whitespace-nowrap tabular-nums">{bestSet(record)}</td>
                  <td className="py-2 pr-3 tabular-nums">{record.estimated_1rm ? `${formatWeight(record.estimated_1rm)} kg` : '–'}</td>
                  <td className="py-2 pr-3 tabular-nums">{record.max_reps}</td>
                  <td className="py-2 whitespace-nowrap text-slate-500">{formatDate(record.best_weight_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-slate-500">
        The one-rep max is estimated with the Epley formula (weight × (1 + reps ÷ 30)) from sets of 12 reps or fewer.
      </p>
    </div>
  )
}
