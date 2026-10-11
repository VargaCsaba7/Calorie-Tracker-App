import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { axisTick, gridStroke, tooltipStyle } from './chartStyles'

export interface DailyCalories {
  label: string
  calories: number
}

interface CaloriesChartProps {
  data: DailyCalories[]
  goal: number
}

export function CaloriesChart({ data, goal }: CaloriesChartProps) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 16, right: 8, bottom: 0, left: -8 }}>
        <CartesianGrid vertical={false} stroke={gridStroke} />
        <XAxis dataKey="label" interval={0} tickLine={false} axisLine={false} tick={axisTick} />
        <YAxis tickLine={false} axisLine={false} tick={axisTick} width={48} />
        <Tooltip
          cursor={{ fill: '#f1f5f9' }}
          formatter={(value) => [`${Number(value).toLocaleString('en-GB')} kcal`, 'Calories']}
          {...tooltipStyle}
        />
        <ReferenceLine
          y={goal}
          stroke="#64748b"
          strokeDasharray="4 4"
          // Grow the y-axis so the goal line is visible even on light days
          ifOverflow="extendDomain"
          label={{ value: `Goal ${goal.toLocaleString('en-GB')}`, position: 'insideTopRight', fontSize: 11, fill: '#475569' }}
        />
        <Bar dataKey="calories" fill="var(--color-brand-500)" radius={[4, 4, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ResponsiveContainer>
  )
}
