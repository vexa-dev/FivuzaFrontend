import {
  Bar,
  BarChart,
  CartesianGrid,
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

  const chartData = data.map((row) => ({
    date: row.date.slice(5),
    total: Number(row.total),
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
        <XAxis dataKey="date" fontSize={11} stroke="var(--text-secondary)" />
        <YAxis fontSize={11} stroke="var(--text-secondary)" />
        <Tooltip
          formatter={(value) => [`S/ ${Number(value).toFixed(2)}`, 'Ventas']}
          contentStyle={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 8,
          }}
        />
        <Bar dataKey="total" fill="var(--primary)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
