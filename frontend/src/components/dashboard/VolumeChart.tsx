import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { axisTick, gridStroke, tooltipStyle } from './chartStyles'

export interface WorkoutVolumePoint {
  label: string
  name: string
  volume: number
}

export function VolumeChart({ data }: { data: WorkoutVolumePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 16, right: 16, bottom: 0, left: -8 }}>
        <CartesianGrid vertical={false} stroke={gridStroke} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisTick} />
        <YAxis tickLine={false} axisLine={false} tick={axisTick} width={56} />
        <Tooltip
          cursor={{ stroke: '#94a3b8', strokeDasharray: '3 3' }}
          labelFormatter={(label, payload) => {
            const point = payload?.[0]?.payload as WorkoutVolumePoint | undefined
            return point ? `${point.name} · ${label}` : label
          }}
          formatter={(value) => [`${Number(value).toLocaleString('en-GB')} kg`, 'Volume']}
          {...tooltipStyle}
        />
        <Line
          type="monotone"
          dataKey="volume"
          stroke="var(--color-brand-600)"
          strokeWidth={2}
          dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
