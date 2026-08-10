import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { EmptyState } from '../../../shared/components/EmptyState'
import { BarChart3 } from 'lucide-react'

interface SalesByDayChartProps {
  data: { date: string; total: string }[]
}

export function SalesByDayChart({ data }: SalesByDayChartProps) {
  if (data.length === 0) {
    return <EmptyState icon={<BarChart3 />} title="Sin ventas en este periodo" />
  }

  const chartData = data.map((row) => ({ date: row.date.slice(5), total: Number(row.total) }))
  const totalPeriod = chartData.reduce((sum, row) => sum + row.total, 0)
  const bestDay = chartData.reduce((best, row) => (row.total > best.total ? row : best), chartData[0])

  return (
    <div>
      <div className="sales-chart-summary">
        <div>
          <span className="sales-chart-summary-label">Total del periodo</span>
          <span className="sales-chart-summary-value">S/ {totalPeriod.toFixed(2)}</span>
        </div>
        <div>
          <span className="sales-chart-summary-label">Promedio diario</span>
          <span className="sales-chart-summary-value">
            S/ {(totalPeriod / chartData.length).toFixed(2)}
          </span>
        </div>
        <div>
          <span className="sales-chart-summary-label">Mejor día</span>
          <span className="sales-chart-summary-value">{bestDay.date}</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
          <XAxis dataKey="date" fontSize={11} stroke="var(--text-secondary)" tickLine={false} />
          <YAxis fontSize={11} stroke="var(--text-secondary)" tickLine={false} axisLine={false} />
          <Tooltip
            formatter={(value) => [`S/ ${Number(value).toFixed(2)}`, 'Ventas']}
            cursor={{ fill: 'var(--bg-surface-secondary)' }}
            contentStyle={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 8,
            }}
          />
          <Bar dataKey="total" radius={[4, 4, 0, 0]}>
            {chartData.map((row) => (
              <Cell
                key={row.date}
                fill={row.date === bestDay.date ? 'var(--color-accent-500)' : 'var(--color-accent-700)'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
