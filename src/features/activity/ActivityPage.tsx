import { useQuery } from '@tanstack/react-query'
import { History, ChevronDown, ChevronRight } from 'lucide-react'
import { Fragment, useState } from 'react'
import { EmptyState } from '../../shared/components/EmptyState'
import { ExportButtons } from '../../shared/components/ExportButtons'
import { useAuth } from '../auth/hooks/useAuth'
import { AnimatedTabs } from '../users/components/AnimatedTabs'
import { fetchUsers } from '../users/api'
import { downloadTenantAuditLogs, type TenantAuditLogFilters } from './api'
import { AuditDetails } from './components/AuditDetails'
import { LoginAttemptsPanel } from './components/LoginAttemptsPanel'
import { useTenantAuditLog } from './hooks/useTenantAuditLog'
import {
  ACTION_FILTER_OPTIONS,
  ENTITY_FILTER_OPTIONS,
  actionLabel,
  entityLabel,
} from './labels'
import '../core/CorePage.css'
import './ActivityPage.css'

function formatDate(value: string) {
  return new Date(value).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })
}

// Mismo tope que el backend (usuarios.views._AUDIT_EXPORT_MAX_DAYS): la
// exportación se arma en memoria en el mismo request, así que se pide un
// rango acotado en vez de toda la historia.
const EXPORT_MAX_DAYS = 366
const DAY_MS = 24 * 60 * 60 * 1000

function exportRangeProblem(dateFrom?: string, dateTo?: string): string | null {
  if (!dateFrom || !dateTo) return 'Elige Desde y Hasta para exportar'
  const days = (Date.parse(dateTo) - Date.parse(dateFrom)) / DAY_MS
  if (days < 0) return '"Desde" debe ser anterior a "Hasta"'
  if (days >= EXPORT_MAX_DAYS) return `Exporta como máximo ${EXPORT_MAX_DAYS} días`
  return null
}

/** Bitácora del negocio (Bloque B.3): quién hizo qué y cuándo, con filtros
 * y exportación sobre el mismo filtro. Mismo patrón visual que la Actividad
 * del panel de Fivuza (features/core/ActivityPage). */
type ActivityTab = 'bitacora' | 'intentos'

const TAB_OPTIONS: [ActivityTab, string][] = [
  ['bitacora', 'Bitácora'],
  ['intentos', 'Intentos de acceso'],
]

export function ActivityPage() {
  const [tab, setTab] = useState<ActivityTab>('bitacora')

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="core-page-title">Actividad</h1>
          <p className="core-page-subtitle">
            Quién creó, editó o eliminó algo en el negocio, y cuándo
          </p>
        </div>
      </div>

      <AnimatedTabs value={tab} onChange={setTab} options={TAB_OPTIONS} />

      {tab === 'bitacora' ? <AuditLogPanel /> : <LoginAttemptsPanel />}
    </div>
  )
}

function AuditLogPanel() {
  const [filters, setFilters] = useState<TenantAuditLogFilters>({})
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const { hasPermission } = useAuth()
  // La lista de personas sale de /usuarios/users/, que exige USERS_MANAGE:
  // quien solo puede ver la bitácora filtra por lo demás.
  const canListUsers = hasPermission('USERS_MANAGE')
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    enabled: canListUsers,
  })
  const { data, isLoading, isError } = useTenantAuditLog(filters, page)

  const exportBlockedReason = exportRangeProblem(filters.date_from, filters.date_to)

  const updateFilter = <K extends keyof TenantAuditLogFilters>(
    key: K,
    value: TenantAuditLogFilters[K],
  ) => {
    setPage(1)
    setExpandedId(null)
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="card core-table-card">
      <div className="table-toolbar activity-toolbar">
        {canListUsers && (
          <select
            aria-label="Persona"
            value={filters.user ?? ''}
            onChange={(event) =>
              updateFilter('user', event.target.value ? Number(event.target.value) : undefined)
            }
          >
            <option value="">Todas las personas</option>
            {users?.map((member) => (
              <option key={member.id} value={member.id}>
                {member.email}
              </option>
            ))}
          </select>
        )}
        <select
          aria-label="Acción"
          value={filters.action ?? ''}
          onChange={(event) => updateFilter('action', event.target.value || undefined)}
        >
          <option value="">Toda acción</option>
          {ACTION_FILTER_OPTIONS.map((code) => (
            <option key={code} value={code}>
              {actionLabel(code)}
            </option>
          ))}
        </select>
        <select
          aria-label="Entidad"
          value={filters.entity ?? ''}
          onChange={(event) => updateFilter('entity', event.target.value || undefined)}
        >
          <option value="">Toda entidad</option>
          {ENTITY_FILTER_OPTIONS.map((code) => (
            <option key={code} value={code}>
              {entityLabel(code)}
            </option>
          ))}
        </select>
        <input
          type="date"
          aria-label="Desde"
          value={filters.date_from ?? ''}
          onChange={(event) => updateFilter('date_from', event.target.value || undefined)}
        />
        <input
          type="date"
          aria-label="Hasta"
          value={filters.date_to ?? ''}
          onChange={(event) => updateFilter('date_to', event.target.value || undefined)}
        />
        <div className="activity-export">
          {exportBlockedReason && (
            <span className="activity-export-hint">{exportBlockedReason}</span>
          )}
          <ExportButtons
            disabled={Boolean(exportBlockedReason) || !data || data.count === 0}
            filename={`bitacora_${filters.date_from}_a_${filters.date_to}`}
            onDownload={(format) => downloadTenantAuditLogs(filters, format)}
          />
        </div>
      </div>

      {isLoading && (
        <div className="loading-row">
          <span className="spinner" />
          Cargando...
        </div>
      )}
      {isError && <p className="core-state-message">No se pudo cargar la actividad.</p>}
      {data && data.results.length === 0 && (
        <EmptyState icon={<History />} title="Sin actividad para estos filtros" />
      )}
      {data && data.results.length > 0 && (
        <div className="activity-table-scroll">
          <table className="core-table">
            <thead>
              <tr>
                <th aria-label="Detalle"></th>
                <th>Fecha</th>
                <th>Persona</th>
                <th>Acción</th>
                <th>Sobre</th>
              </tr>
            </thead>
            <tbody>
              {data.results.map((log) => {
                const expandable = Boolean(log.details)
                const expanded = expandedId === log.id
                return (
                  <Fragment key={log.id}>
                    <tr
                      className={expandable ? 'activity-row-expandable' : undefined}
                      onClick={() => expandable && setExpandedId(expanded ? null : log.id)}
                    >
                      <td>
                        {expandable && (
                          <button
                            type="button"
                            className="activity-expand"
                            aria-expanded={expanded}
                            aria-label={expanded ? 'Ocultar detalle' : 'Ver detalle'}
                            onClick={(event) => {
                              event.stopPropagation()
                              setExpandedId(expanded ? null : log.id)
                            }}
                          >
                            {expanded ? (
                              <ChevronDown size={14} strokeWidth={2} />
                            ) : (
                              <ChevronRight size={14} strokeWidth={2} />
                            )}
                          </button>
                        )}
                      </td>
                      <td className="activity-nowrap">{formatDate(log.created_at)}</td>
                      <td>{log.user_email}</td>
                      <td className="core-table-strong">{actionLabel(log.action)}</td>
                      <td>
                        {entityLabel(log.entity)}
                        {log.entity_id ? ` #${log.entity_id}` : ''}
                      </td>
                    </tr>
                    {expanded && (
                      <tr>
                        <td></td>
                        <td colSpan={4}>
                          <AuditDetails details={log.details} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {data && (data.next || data.previous) && (
        <div className="table-toolbar activity-pager">
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
  )
}
