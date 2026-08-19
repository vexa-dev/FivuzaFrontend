import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts'

interface MonthTrendSparklineProps {
  data: { date: string; total: string }[]
}

/** Mini-grafico de tendencia dentro del KPI hero (Sprint 26, feedback de
 * diseno): la card "Ventas del mes" se leia enorme y vacia a la derecha del
 * numero -reusa la misma serie de 30 dias que ya alimenta SalesByDayChart,
 * sin pedir nada nuevo al backend, solo para dar contexto visual inmediato
 * de la tendencia sin competir con la cifra grande. */
export function MonthTrendSparkline({ data }: MonthTrendSparklineProps) {
  if (data.length === 0) return null

  const chartData = data.map((row) => ({ date: row.date.slice(5), total: Number(row.total) }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
        <defs>
          <linearGradient id="hero-trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip
          formatter={(value) => [`S/ ${Number(value).toFixed(2)}`, 'Ventas']}
          labelFormatter={(label) => label}
          contentStyle={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 8,
            fontSize: '0.75rem',
          }}
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke="var(--primary)"
          strokeWidth={2}
          fill="url(#hero-trend-fill)"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
