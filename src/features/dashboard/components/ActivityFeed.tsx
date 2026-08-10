import { Activity } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { EmptyState } from '../../../shared/components/EmptyState'

export interface ActivityItem {
  id: string
  timestamp: string
  icon: ReactNode
  tone: 'success' | 'warning' | 'danger' | 'neutral'
  primary: string
  secondary: string
  amount: string
}

interface ActivityFeedProps {
  items: ActivityItem[]
}

/** Feed cronologico multi-fuente -combina eventos de mas de un modulo
 * (ventas + movimientos de inventario por ahora) en un solo lenguaje
 * visual. No incluye altas de usuario ni cambios de permisos: el backend
 * no guarda un historial de esos eventos a nivel de negocio (el unico
 * audit log que existe es el de staff de plataforma, para otro proposito),
 * asi que mostrarlos aca implicaria inventar datos. */
export function ActivityFeed({ items }: ActivityFeedProps) {
  if (items.length === 0) {
    return <EmptyState icon={<Activity />} title="Sin actividad reciente" />
  }

  return (
    <ul className="recent-sales-feed">
      {items.map((item, index) => (
        <li
          key={item.id}
          className="recent-sales-feed-row"
          style={{ '--kpi-index': index } as CSSProperties}
        >
          <span className="activity-feed-icon" data-tone={item.tone}>
            {item.icon}
          </span>
          <div className="recent-sales-feed-main">
            <span className="recent-sales-feed-customer">{item.primary}</span>
            <span className="recent-sales-feed-meta">{item.secondary}</span>
          </div>
          <span className="recent-sales-feed-amount">{item.amount}</span>
        </li>
      ))}
    </ul>
  )
}
