import { CreditCard } from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
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

// Paleta categorica derivada de los tokens de marca (nunca un hex nuevo
// suelto): metodos de pago son categorias, no estados, asi que no se usa
// el semaforo success/warning/danger aca -serian ilegibles como "estado".
const COLORS = [
  'var(--color-accent-600)',
  'var(--color-accent-400)',
  'var(--color-neutral-400)',
  'var(--color-accent-900)',
  'var(--color-neutral-600)',
]

export function PaymentMethodChart({ data }: PaymentMethodChartProps) {
  if (data.length === 0) {
    return <EmptyState icon={<CreditCard />} title="Sin pagos en este periodo" />
  }

  const total = data.reduce((sum, row) => sum + Number(row.total), 0)
  const chartData = data
    .map((row, index) => ({
      name: METHOD_LABELS[row.method] ?? row.method,
      value: Number(row.total),
      color: COLORS[index % COLORS.length],
    }))
    .sort((a, b) => b.value - a.value)

  return (
    <div className="payment-method-layout">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={2}>
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.color} stroke="var(--bg-surface)" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `S/ ${Number(value).toFixed(2)}`} />
        </PieChart>
      </ResponsiveContainer>

      <ul className="payment-method-breakdown">
        {chartData.map((entry) => (
          <li key={entry.name}>
            <span className="payment-method-dot" style={{ background: entry.color }} />
            <span className="payment-method-name">{entry.name}</span>
            <span className="payment-method-amount">S/ {entry.value.toFixed(2)}</span>
            <span className="payment-method-pct">
              {total > 0 ? Math.round((entry.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
