import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { axisTick, gridStroke, tooltipStyle } from '../dashboard/chartStyles'

export interface ChartPoint {
  label: string
  value: number | null
}

interface WeeklyChartProps {
  title: string
  data: ChartPoint[]
  unit: string
  kind: 'bar' | 'line'
  /** Optional dashed target line, e.g. the calorie goal */
  target?: { value: number; label: string }
  /** For a line: fit the y-axis to the data instead of starting at 0 (body weight) */
  zoomY?: boolean
}

/** One measure per chart, one y-axis. Empty weeks are gaps, not zeros. */
export function WeeklyChart({ title, data, unit, kind, target, zoomY = false }: WeeklyChartProps) {
  const hasData = data.some((point) => point.value !== null && point.value !== 0)
  const format = (value: unknown) => [`${Number(value).toLocaleString('en-GB')} ${unit}`, title]

  return (
    <figure className="rounded-xl border border-black/5 p-4">
      <figcaption className="font-display text-lg font-semibold">{title}</figcaption>
      {hasData ? (
        <ResponsiveContainer width="100%" height={200}>
          {kind === 'bar' ? (
            <BarChart data={data} margin={{ top: 16, right: 8, bottom: 0, left: -12 }}>
              <CartesianGrid vertical={false} stroke={gridStroke} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisTick} interval="preserveStartEnd" />
              <YAxis tickLine={false} axisLine={false} tick={axisTick} width={48} allowDecimals={false} />
              <Tooltip cursor={{ fill: '#f1f5f9' }} formatter={format} {...tooltipStyle} />
              {target && (
                <ReferenceLine
                  y={target.value}
                  stroke="#64748b"
                  strokeDasharray="4 4"
                  ifOverflow="extendDomain"
                  label={{ value: target.label, position: 'insideTopRight', fontSize: 11, fill: '#475569' }}
                />
              )}
              <Bar dataKey="value" fill="var(--color-brand-500)" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          ) : (
            <LineChart data={data} margin={{ top: 16, right: 12, bottom: 0, left: -12 }}>
              <CartesianGrid vertical={false} stroke={gridStroke} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisTick} interval="preserveStartEnd" />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={axisTick}
                width={48}
                // Body weight changes slowly; starting the axis at 0 would flatten the line
                domain={
                  zoomY
                    ? [(min: number) => Math.floor(min - 1), (max: number) => Math.ceil(max + 1)]
                    : [0, 'auto']
                }
                allowDecimals={false}
              />
              <Tooltip cursor={{ stroke: '#94a3b8', strokeDasharray: '3 3' }} formatter={format} {...tooltipStyle} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-brand-600)"
                strokeWidth={2}
                connectNulls
                dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      ) : (
        <p className="flex h-[200px] items-center justify-center text-center text-sm text-slate-500">
          No data for these weeks yet.
        </p>
      )}
    </figure>
  )
}
