import { Area, AreaChart, ResponsiveContainer } from 'recharts'

interface InlineSparklineProps {
  data: { date: string; total: string }[]
}

/** Mini-tendencia pegada al numero de una fila de KPI (patron Stripe: el
 * sparkline vive DENTRO de la fila, no como grafico aparte) -solo se usa
 * donde hay una serie diaria real detras del numero (ventas), nunca
 * inventada para filas que no tienen historial (margen, cajas, asistencia
 * no tienen desglose diario en la API). */
export function InlineSparkline({ data }: InlineSparklineProps) {
  if (data.length < 2) return null
  const chartData = data.map((row) => ({ total: Number(row.total) }))

  return (
    <div className="inline-sparkline">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
          <defs>
            <linearGradient id="inline-sparkline-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="total"
            stroke="var(--primary)"
            strokeWidth={1.5}
            fill="url(#inline-sparkline-fill)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
