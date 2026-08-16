import type { ReactNode } from 'react'

// Misma logica que PaymentMethodChart: paleta categorica derivada de
// --primary via color-mix, nunca un hex nuevo suelto -sigue al color de
// marca que el tenant eligio en Configuracion en vez de un azul fijo.
export const CATEGORICAL_COLORS = [
  'var(--primary)',
  'color-mix(in srgb, var(--primary) 55%, var(--bg-surface))',
  'color-mix(in srgb, var(--primary) 75%, black)',
  'var(--text-muted)',
  'color-mix(in srgb, var(--primary) 30%, var(--bg-surface))',
]

const RING_RADIUS = 26
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

/** Anillo de progreso (referencia: cards "85% / 223" del dashboard de
 * inspiracion) -reemplaza el numero suelto de MiniStat cuando el dato ES
 * un porcentaje/ratio (ocupacion, conversion), donde ver "cuanto le falta
 * al circulo completo" comunica mas rapido que solo el numero. */
export function RadialStat({
  icon,
  label,
  pct,
  caption,
  color = 'var(--primary)',
}: {
  icon: ReactNode
  label: string
  pct: number | null
  caption?: string
  color?: string
}) {
  const clamped = pct === null ? 0 : Math.max(0, Math.min(100, pct))
  const offset = RING_CIRCUMFERENCE * (1 - clamped / 100)

  return (
    <div className="card dashboard-radial-stat">
      <div className="dashboard-radial-ring">
        <svg viewBox="0 0 64 64" width="64" height="64">
          <circle cx="32" cy="32" r={RING_RADIUS} className="dashboard-radial-track" />
          {pct !== null && (
            <circle
              cx="32"
              cy="32"
              r={RING_RADIUS}
              className="dashboard-radial-fill"
              stroke={color}
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={offset}
            />
          )}
        </svg>
        <span className="dashboard-radial-value">{pct !== null ? `${Math.round(clamped)}%` : '—'}</span>
      </div>
      <div className="dashboard-radial-stat-body">
        <span className="dashboard-mini-stat-label">
          {icon}
          {label}
        </span>
        {caption && <span className="dashboard-mini-stat-caption">{caption}</span>}
      </div>
    </div>
  )
}

interface RankingItem {
  key: string | number
  label: string
  value: number
  sublabel?: string
}

/** Barras capsula horizontales (referencia: "Top vendedores" / listas de
 * ranking del dashboard de inspiracion) -reemplaza una tabla de 2 columnas
 * cuando lo que importa es comparar magnitudes entre filas de un vistazo,
 * no leer cifras exactas fila por fila. */
export function RankingBars({
  items,
  valueFormatter = (n: number) => String(n),
  colorFor,
}: {
  items: RankingItem[]
  valueFormatter?: (value: number) => string
  colorFor?: (item: RankingItem, index: number) => string
}) {
  const max = Math.max(...items.map((item) => item.value), 1)

  return (
    <div className="dashboard-ranking-bars">
      {items.map((item, index) => (
        <div className="dashboard-ranking-row" key={item.key}>
          <div className="dashboard-ranking-row-top">
            <span className="dashboard-ranking-label">{item.label}</span>
            <span className="dashboard-ranking-value">{valueFormatter(item.value)}</span>
          </div>
          <div className="dashboard-ranking-track">
            <div
              className="dashboard-ranking-fill"
              style={{
                width: `${Math.max((item.value / max) * 100, 4)}%`,
                background: colorFor ? colorFor(item, index) : CATEGORICAL_COLORS[index % CATEGORICAL_COLORS.length],
              }}
            />
          </div>
          {item.sublabel && <span className="dashboard-ranking-sublabel">{item.sublabel}</span>}
        </div>
      ))}
    </div>
  )
}

interface CapsuleColumn {
  key: string | number
  label: string
  value: number
  color?: string
}

/** Columnas capsula verticales (referencia: card "PRODUCT" del dashboard
 * de inspiracion, puntas redondeadas de alto variable) -para desgloses
 * cortos (3-5 categorias) donde una barra vertical compacta cabe mejor
 * junto a los MiniStat que un grafico de barras completo con ejes. */
export function CapsuleColumns({ items }: { items: CapsuleColumn[] }) {
  const max = Math.max(...items.map((item) => item.value), 1)

  return (
    <div className="dashboard-capsule-chart">
      {items.map((item, index) => (
        <div className="dashboard-capsule-col" key={item.key}>
          <span className="dashboard-capsule-value">{item.value}</span>
          <div
            className="dashboard-capsule-bar"
            style={{
              height: `${Math.max((item.value / max) * 100, 10)}%`,
              background: item.color ?? CATEGORICAL_COLORS[index % CATEGORICAL_COLORS.length],
            }}
          />
          <span className="dashboard-capsule-label">{item.label}</span>
        </div>
      ))}
    </div>
  )
}
