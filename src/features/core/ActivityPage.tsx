import { Activity as ActivityIcon, ChevronDown, ChevronRight } from 'lucide-react'
import { Fragment, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../../shared/components/EmptyState'
import { useAuditLog } from './hooks/useAuditLog'
import { useStaff } from './hooks/useStaff'

function formatDate(value: string) {
  return new Date(value).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })
}

export function ActivityPage() {
  const [staffFilter, setStaffFilter] = useState<number | 'all'>('all')
  const [entityFilter, setEntityFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const { data: staffList } = useStaff()
  const { data, isLoading } = useAuditLog({
    platform_staff: staffFilter === 'all' ? undefined : staffFilter,
    entity: entityFilter === 'all' ? undefined : entityFilter,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    page,
  })

  const entities = ['Tenant', 'Plan', 'PlanFeature', 'Subscription', 'SubscriptionPayment', 'PlatformStaff', 'TenantSettings']

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="core-page-title">Actividad</h1>
          <p className="core-page-subtitle">Bitácora de acciones del equipo Fivuza</p>
        </div>
      </div>

      <div className="card core-table-card">
        <div className="table-toolbar">
          <select
            value={staffFilter}
            onChange={(event) => {
              setPage(1)
              setStaffFilter(event.target.value === 'all' ? 'all' : Number(event.target.value))
            }}
          >
            <option value="all">Todo el equipo</option>
            {staffList?.map((member) => (
              <option key={member.id} value={member.id}>
                {member.full_name}
              </option>
            ))}
          </select>
          <select
            value={entityFilter}
            onChange={(event) => {
              setPage(1)
              setEntityFilter(event.target.value)
            }}
          >
            <option value="all">Toda entidad</option>
            {entities.map((entity) => (
              <option key={entity} value={entity}>
                {entity}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => {
              setPage(1)
              setDateFrom(event.target.value)
            }}
          />
          <input
            type="date"
            value={dateTo}
            onChange={(event) => {
              setPage(1)
              setDateTo(event.target.value)
            }}
          />
        </div>

        {isLoading && (
          <div className="loading-row">
            <span className="spinner" />
            Cargando...
          </div>
        )}
        {data && data.results.length === 0 && (
          <EmptyState icon={<ActivityIcon />} title="Sin actividad para estos filtros" />
        )}
        {data && data.results.length > 0 && (
          <table className="core-table">
            <thead>
              <tr>
                <th></th>
                <th>Acción</th>
                <th>Entidad</th>
                <th>Staff</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {data.results.map((log) => (
                <Fragment key={log.id}>
                  <tr
                    style={{ cursor: log.details ? 'pointer' : 'default' }}
                    onClick={() => log.details && setExpandedId(expandedId === log.id ? null : log.id)}
                  >
                    <td>
                      {log.details &&
                        (expandedId === log.id ? (
                          <ChevronDown size={14} strokeWidth={2} />
                        ) : (
                          <ChevronRight size={14} strokeWidth={2} />
                        ))}
                    </td>
                    <td className="core-table-strong">{log.action}</td>
                    <td>
                      {log.entity === 'Tenant' ? (
                        <Link
                          to={`/admin/tenants/${log.entity_id}`}
                          onClick={(event) => event.stopPropagation()}
                        >
                          {log.entity} #{log.entity_id}
                        </Link>
                      ) : (
                        `${log.entity} #${log.entity_id}`
                      )}
                    </td>
                    <td>{log.platform_staff_email}</td>
                    <td>{formatDate(log.created_at)}</td>
                  </tr>
                  {expandedId === log.id && log.details && (
                    <tr>
                      <td></td>
                      <td colSpan={4}>
                        <pre className="audit-log-details">{log.details}</pre>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}

        {data && (data.next || data.previous) && (
          <div className="table-toolbar" style={{ justifyContent: 'center', gap: 12 }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={!data.previous}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </button>
            <span className="core-state-message">Página {page}</span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={!data.next}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
