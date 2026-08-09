import { useState } from 'react'
import { ExportButtons } from '../../../shared/components/ExportButtons'
import { Modal } from '../../../shared/components/Modal'
import { formatCurrency } from '../../../shared/utils/format'
import {
  downloadCashMovementReport,
  downloadCashSessionReport,
  type CashRegister,
  type CashSessionFilters,
} from '../api'
import { useCashSessionDetail, useCashSessionHistory } from '../hooks/useCashSessions'

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })
}

function differenceBadge(difference: string | null) {
  if (difference === null) return null
  const value = Number(difference)
  const variant = value === 0 ? 'badge-success' : value > 0 ? 'badge-warning' : 'badge-danger'
  return (
    <span className={`badge ${variant}`}>
      <span className="dot" />
      {value > 0 ? '+' : ''}
      {value.toFixed(2)}
    </span>
  )
}

export function CashSessionHistory({ registers }: { registers: CashRegister[] }) {
  const [filters, setFilters] = useState<CashSessionFilters>({})
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)
  const { data: sessions, isLoading } = useCashSessionHistory(filters)

  const registerName = (id: number) => registers.find((r) => r.id === id)?.name ?? `Caja #${id}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label htmlFor="history-filter-register">Caja</label>
            <select
              id="history-filter-register"
              value={filters.cash_register ?? ''}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  cash_register: event.target.value ? Number(event.target.value) : undefined,
                }))
              }
            >
              <option value="">Todas</option>
              {registers.map((register) => (
                <option key={register.id} value={register.id}>
                  {register.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="history-filter-status">Estado</label>
            <select
              id="history-filter-status"
              value={filters.status ?? ''}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  status: (event.target.value || undefined) as 'OPEN' | 'CLOSED' | undefined,
                }))
              }
            >
              <option value="">Todos</option>
              <option value="OPEN">Abierta</option>
              <option value="CLOSED">Cerrada</option>
            </select>
          </div>
          <div>
            <label htmlFor="history-filter-from">Desde</label>
            <input
              id="history-filter-from"
              type="date"
              value={filters.opening_from ?? ''}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, opening_from: event.target.value || undefined }))
              }
            />
          </div>
          <div>
            <label htmlFor="history-filter-to">Hasta</label>
            <input
              id="history-filter-to"
              type="date"
              value={filters.opening_to ?? ''}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, opening_to: event.target.value || undefined }))
              }
            />
          </div>
          {filters.opening_from && filters.opening_to && (
            <>
              <span className="core-page-subtitle" style={{ margin: 0 }}>
                Sesiones:
              </span>
              <ExportButtons
                filename={`sesiones_caja_${filters.opening_from}_a_${filters.opening_to}`}
                onDownload={(format) =>
                  downloadCashSessionReport(
                    { date_from: filters.opening_from!, date_to: filters.opening_to! },
                    format,
                  )
                }
              />
              <span className="core-page-subtitle" style={{ margin: 0 }}>
                Movimientos:
              </span>
              <ExportButtons
                filename={`movimientos_caja_${filters.opening_from}_a_${filters.opening_to}`}
                onDownload={(format) =>
                  downloadCashMovementReport(
                    { date_from: filters.opening_from!, date_to: filters.opening_to! },
                    format,
                  )
                }
              />
            </>
          )}
        </div>
      </div>

      <div className="card core-table-card">
        {isLoading && (
          <div className="loading-row">
            <span className="spinner" />
            Cargando...
          </div>
        )}
        {sessions && sessions.length === 0 && (
          <p className="core-state-message">No hay sesiones de caja para estos filtros.</p>
        )}
        {sessions && sessions.length > 0 && (
          <table className="core-table">
            <thead>
              <tr>
                <th>Caja</th>
                <th>Apertura</th>
                <th>Cierre</th>
                <th>Estado</th>
                <th>Diferencia</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr
                  key={session.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedSessionId(session.id)}
                >
                  <td>{registerName(session.cash_register)}</td>
                  <td>{formatDate(session.opening_at)}</td>
                  <td>{formatDate(session.closing_at)}</td>
                  <td>
                    <span
                      className={`badge ${session.status === 'OPEN' ? 'badge-success' : 'badge-ghost'}`}
                    >
                      <span className="dot" />
                      {session.status === 'OPEN' ? 'Abierta' : 'Cerrada'}
                    </span>
                  </td>
                  <td>{differenceBadge(session.difference) ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedSessionId !== null && (
        <CashSessionDetailModal
          sessionId={selectedSessionId}
          registerName={registerName}
          onClose={() => setSelectedSessionId(null)}
        />
      )}
    </div>
  )
}

function CashSessionDetailModal({
  sessionId,
  registerName,
  onClose,
}: {
  sessionId: number
  registerName: (id: number) => string
  onClose: () => void
}) {
  const { data: session, isLoading } = useCashSessionDetail(sessionId)

  return (
    <Modal title="Detalle de sesión de caja" onClose={onClose}>
      {isLoading && (
        <div className="loading-row">
          <span className="spinner" />
          Cargando...
        </div>
      )}
      {session && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <dl className="detail-grid">
            <dt>Caja</dt>
            <dd>{registerName(session.cash_register)}</dd>
            <dt>Apertura</dt>
            <dd>
              {formatDate(session.opening_at)} · {formatCurrency(session.opening_amount)}
            </dd>
            <dt>Cierre</dt>
            <dd>{formatDate(session.closing_at)}</dd>
            <dt>Esperado</dt>
            <dd>
              {session.expected_closing_amount !== null
                ? formatCurrency(session.expected_closing_amount)
                : '—'}
            </dd>
            <dt>Contado</dt>
            <dd>
              {session.counted_closing_amount !== null
                ? formatCurrency(session.counted_closing_amount)
                : '—'}
            </dd>
            <dt>Diferencia</dt>
            <dd>{differenceBadge(session.difference) ?? '—'}</dd>
            {session.notes && (
              <>
                <dt>Observaciones</dt>
                <dd>{session.notes}</dd>
              </>
            )}
          </dl>

          <div>
            <span className="summary-section-title">Movimientos</span>
            {session.movements.length === 0 && (
              <p className="core-state-message">Sin movimientos registrados.</p>
            )}
            {session.movements.length > 0 && (
              <table className="core-table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Concepto</th>
                    <th>Monto</th>
                    <th>Motivo</th>
                    <th>Comprobante</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {session.movements.map((movement) => (
                    <tr key={movement.id}>
                      <td>
                        <span
                          className={`badge ${movement.type === 'IN' ? 'badge-success' : 'badge-danger'}`}
                        >
                          <span className="dot" />
                          {movement.type === 'IN' ? 'Ingreso' : 'Egreso'}
                        </span>
                      </td>
                      <td>{movement.concept}</td>
                      <td className="core-table-strong">{formatCurrency(movement.amount)}</td>
                      <td>{movement.reason || '—'}</td>
                      <td>
                        {movement.receipt_url ? (
                          <a href={movement.receipt_url} target="_blank" rel="noreferrer">
                            Ver
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>{formatDate(movement.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
