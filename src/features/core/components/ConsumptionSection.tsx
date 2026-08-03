import { useQueries } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchTenantConsumption, type Tenant } from '../api'

type SortKey = 'sales_count_last_30_days' | 'active_users_count' | 'catalog_size'

const COLUMNS: [SortKey, string][] = [
  ['sales_count_last_30_days', 'Ventas (30 días)'],
  ['active_users_count', 'Usuarios activos'],
  ['catalog_size', 'Catálogo'],
]

// Un tenant piloto/MVP tiene pocos negocios activos -una consulta por
// tenant en paralelo (useQueries) es simple y suficiente a esta escala; no
// amerita todavia un endpoint de agregado masivo en el backend.
export function ConsumptionSection({ tenants }: { tenants: Tenant[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('sales_count_last_30_days')
  const activeTenants = tenants.filter((t) => t.status !== 'canceled')

  const results = useQueries({
    queries: activeTenants.map((tenant) => ({
      queryKey: ['core', 'tenant-consumption', tenant.id],
      queryFn: () => fetchTenantConsumption(tenant.id),
    })),
  })

  const rows = activeTenants
    .map((tenant, index) => ({ tenant, consumption: results[index]?.data }))
    .filter((row) => row.consumption !== undefined)
    .sort((a, b) => (b.consumption![sortKey] ?? 0) - (a.consumption![sortKey] ?? 0))

  const isLoading = results.some((r) => r.isLoading)

  return (
    <div className="card core-table-card" style={{ marginTop: 20 }}>
      <div className="table-toolbar">
        <span className="summary-section-title" style={{ margin: 0 }}>
          Consumo por tenant
        </span>
      </div>
      {isLoading && rows.length === 0 && (
        <div className="loading-row">
          <span className="spinner" />
          Cargando...
        </div>
      )}
      {!isLoading && rows.length === 0 && (
        <p className="core-state-message">Sin datos de consumo todavía.</p>
      )}
      {rows.length > 0 && (
        <table className="core-table">
          <thead>
            <tr>
              <th>Negocio</th>
              {COLUMNS.map(([key, label]) => (
                <th key={key}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setSortKey(key)}
                    style={{ fontWeight: sortKey === key ? 700 : 400 }}
                  >
                    {label}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ tenant, consumption }) => (
              <tr key={tenant.id}>
                <td className="core-table-strong">
                  <Link to={`/admin/tenants/${tenant.id}`}>{tenant.company_name}</Link>
                </td>
                <td>{consumption!.sales_count_last_30_days}</td>
                <td>{consumption!.active_users_count}</td>
                <td>{consumption!.catalog_size}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
