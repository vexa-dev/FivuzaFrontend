import type { ReactNode } from 'react'

interface KpiCardProps {
  icon: ReactNode
  label: string
  value: string
  subtitle?: string
}

export function KpiCard({ icon, label, value, subtitle }: KpiCardProps) {
  return (
    <div className="card" style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div
        style={{
          color: 'var(--primary)',
          background: 'var(--primary-subtle-bg)',
          borderRadius: 8,
          padding: 8,
          display: 'flex',
        }}
      >
        {icon}
      </div>
      <div>
        <p className="core-page-subtitle" style={{ margin: 0 }}>
          {label}
        </p>
        <p className="core-table-strong" style={{ fontSize: '1.4rem', margin: '2px 0' }}>
          {value}
        </p>
        {subtitle && (
          <p className="core-page-subtitle" style={{ margin: 0, fontSize: '0.75rem' }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}
