import type { ReactNode } from 'react'

/** Encabezado de cada familia de datos del dashboard (Inventario, Caja,
 * Clientes, Ventas, RRHH, Gimnasio) -icono + titulo, mismo dispositivo que
 * el header de pagina pero un escalon mas chico porque titula una seccion
 * interna, no la pantalla entera. */
export function SectionHeader({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="dashboard-section-header">
      <span className="dashboard-section-icon">{icon}</span>
      <h2 className="dashboard-section-title">{title}</h2>
    </div>
  )
}

/** Card de una sola cifra -para datos que no encajan en la pila compacta
 * (esa es para varias filas relacionadas dentro de UNA card) ni en un hero
 * (esa es LA cifra de la pantalla). Varias de estas en fila = un grupo de
 * numeros del mismo peso visual, del mismo modulo. */
export function MiniStat({
  icon,
  label,
  value,
  caption,
  title,
}: {
  icon: ReactNode
  label: string
  value: string
  caption?: string
  title?: string
}) {
  return (
    <div className="card dashboard-mini-stat" title={title}>
      <span className="dashboard-mini-stat-label">
        {icon}
        {label}
      </span>
      <span className="dashboard-mini-stat-value">{value}</span>
      {caption && <span className="dashboard-mini-stat-caption">{caption}</span>}
    </div>
  )
}
