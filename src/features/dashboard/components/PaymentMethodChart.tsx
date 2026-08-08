import { CreditCard } from 'lucide-react'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { EmptyState } from '../../../shared/components/EmptyState'

interface PaymentMethodChartProps {
  data: { method: string; total: string }[]
}

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  YAPE: 'Yape',
  CREDIT_LEDGER: 'Crédito',
  BALANCE: 'Saldo a favor',
}

const COLORS = ['#4f46e5', '#0ea5e9', '#22c55e', '#f59e0b', '#ef4444']

export function PaymentMethodChart({ data }: PaymentMethodChartProps) {
  if (data.length === 0) {
    return <EmptyState icon={<CreditCard />} title="Sin pagos en este periodo" />
  }

  const chartData = data.map((row) => ({
    name: METHOD_LABELS[row.method] ?? row.method,
    value: Number(row.total),
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={80} label>
          {chartData.map((entry, index) => (
            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => `S/ ${Number(value).toFixed(2)}`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
