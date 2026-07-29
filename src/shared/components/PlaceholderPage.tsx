import '../../features/core/CorePage.css'

export function PlaceholderPage({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h1 className="core-page-title">{title}</h1>
      <p className="core-page-subtitle">{subtitle}</p>
      <div className="card core-table-card">
        <p className="core-state-message">Este módulo llega en un sprint posterior.</p>
      </div>
    </div>
  )
}
