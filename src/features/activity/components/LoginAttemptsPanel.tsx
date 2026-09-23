import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ShieldAlert } from 'lucide-react'
import { useState } from 'react'
import { EmptyState } from '../../../shared/components/EmptyState'
import { fetchLoginAttempts, type LoginAttempt, type LoginAttemptFilters } from '../api'

const SOURCE_LABELS: Record<LoginAttempt['source'], string> = {
  LOGIN: 'Inicio de sesión',
  SUPERVISOR_AUTHORIZATION: 'Autorización de supervisor',
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })
}

/** Intentos de acceso con correos que no son de nadie del negocio (Bloque
 * C.4). Los fallidos de alguien que sí existe están en la bitácora; estos
 * no, porque no hay a quién atribuirlos. */
export function LoginAttemptsPanel() {
  const [filters, setFilters] = useState<LoginAttemptFilters>({})
  const [page, setPage] = useState(1)
  const { data, isLoading, isError } = useQuery({
    queryKey: ['login-attempts', filters, page],
    queryFn: () => fetchLoginAttempts(filters, page),
    placeholderData: keepPreviousData,
  })

  const updateFilter = <K extends keyof LoginAttemptFilters>(
    key: K,
    value: LoginAttemptFilters[K],
  ) => {
    setPage(1)
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="card core-table-card">
      <div className="table-toolbar activity-toolbar">
        <input
          type="search"
          aria-label="Correo"
          placeholder="Buscar correo..."
          value={filters.email ?? ''}
          onChange={(event) => updateFilter('email', event.target.value || undefined)}
        />
        <select
          aria-label="Origen"
          value={filters.source ?? ''}
          onChange={(event) =>
            updateFilter('source', (event.target.value || undefined) as LoginAttempt['source'])
          }
        >
          <option value="">Todo origen</option>
          {Object.entries(SOURCE_LABELS).map(([code, label]) => (
            <option key={code} value={code}>
              {label}
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
        <span className="activity-export-hint activity-export">Se guardan 30 días</span>
      </div>

      {isLoading && (
        <div className="loading-row">
          <span className="spinner" />
          Cargando...
        </div>
      )}
      {isError && <p className="core-state-message">No se pudieron cargar los intentos.</p>}
      {data && data.results.length === 0 && (
        <EmptyState
          icon={<ShieldAlert />}
          title="Sin intentos con correos desconocidos"
          subtitle="Aquí aparece quien intenta entrar con un correo que no es de nadie del negocio."
        />
      )}
      {data && data.results.length > 0 && (
        <div className="activity-table-scroll">
          <table className="core-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Correo</th>
                <th>Dónde</th>
                <th>IP</th>
                <th>Navegador</th>
              </tr>
            </thead>
            <tbody>
              {data.results.map((attempt) => (
                <tr key={attempt.id}>
                  <td className="activity-nowrap">{formatDate(attempt.created_at)}</td>
                  <td className="core-table-strong">{attempt.email}</td>
                  <td>{SOURCE_LABELS[attempt.source] ?? attempt.source}</td>
                  <td className="activity-nowrap">{attempt.ip ?? '—'}</td>
                  <td className="activity-user-agent" title={attempt.user_agent}>
                    {attempt.user_agent || '—'}
                  </td>
                </tr>
              ))}
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
