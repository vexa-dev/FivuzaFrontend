import type { OnboardingChecklist } from '../api'
import { useTenantOnboarding } from '../hooks/useTenantExtras'

const ITEMS: [keyof OnboardingChecklist, string][] = [
  ['has_catalog', 'Catálogo'],
  ['has_first_sale', 'Primera venta'],
  ['has_users_created', 'Usuarios'],
]

export function OnboardingBadges({ tenantId }: { tenantId: number }) {
  const { data, isLoading } = useTenantOnboarding(tenantId)

  if (isLoading || !data) {
    return <span className="core-state-message">Cargando checklist...</span>
  }

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {ITEMS.map(([key, label]) => (
        <span
          key={key}
          className={`badge ${data[key] ? 'badge-success' : 'badge-neutral'}`}
          title={label}
        >
          <span className="dot" />
          {label} {data[key] ? '✓' : '—'}
        </span>
      ))}
    </div>
  )
}
