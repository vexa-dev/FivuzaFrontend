import { Construction } from 'lucide-react'
import '../../features/core/CorePage.css'
import { EmptyState } from './EmptyState'

export function PlaceholderPage({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h1 className="core-page-title">{title}</h1>
      <p className="core-page-subtitle">{subtitle}</p>
      <div className="card core-table-card">
        <EmptyState
          icon={<Construction />}
          title="Este módulo llega en un sprint posterior"
          subtitle="Todavía no hay nada que ver aquí."
        />
      </div>
    </div>
  )
}
