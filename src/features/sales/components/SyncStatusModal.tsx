import { AlertTriangle, Clock, RefreshCw } from 'lucide-react'
import { EmptyState } from '../../../shared/components/EmptyState'
import { Modal } from '../../../shared/components/Modal'
import { formatCurrency } from '../../../shared/utils/format'
import { useOfflineSync } from '../hooks/useOfflineSync'

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })
}

/** Pantalla de estado de sincronización (Sprint 21, Convenciones §5.3): el
 * cajero debe poder confiar en que su venta no se perdió -aquí ve cuántas
 * quedan pendientes, cuándo fue la última sincronización exitosa, y para
 * las que fallaron, el motivo exacto y un reintento por venta individual
 * en vez de esperar a que el reintento automático masivo las arrastre. */
export function SyncStatusModal({ onClose }: { onClose: () => void }) {
  const {
    isOnline,
    pendingSales,
    failedSales,
    lastSyncedAt,
    isSyncing,
    syncNow,
    retryingUuid,
    retrySale,
  } = useOfflineSync()

  return (
    <Modal title="Estado de sincronización" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="detail-grid">
          <dt>Conexión</dt>
          <dd>{isOnline ? 'En línea' : 'Sin conexión'}</dd>
          <dt>Última sincronización exitosa</dt>
          <dd>{lastSyncedAt ? formatDateTime(lastSyncedAt) : 'Todavía no ocurre en este dispositivo'}</dd>
        </div>

        {pendingSales.length === 0 && failedSales.length === 0 && (
          <EmptyState
            icon={<Clock />}
            title="No hay ventas en cola"
            subtitle="Todo lo cobrado en este dispositivo ya está sincronizado."
          />
        )}

        {pendingSales.length > 0 && (
          <div>
            <h3 style={{ fontSize: '0.85rem', margin: '0 0 8px' }}>
              Pendientes ({pendingSales.length})
            </h3>
            <table className="core-table">
              <thead>
                <tr>
                  <th>Cobrada</th>
                  <th>Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {pendingSales.map((sale) => (
                  <tr key={sale.clientSideUuid}>
                    <td>{formatDateTime(sale.createdAt)}</td>
                    <td>{formatCurrency(sale.total)}</td>
                    <td>
                      <span className="badge badge-neutral">
                        <span className="dot" />
                        {isOnline ? (isSyncing ? 'Sincronizando…' : 'En cola') : 'Esperando conexión'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {isOnline && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ marginTop: 8 }}
                disabled={isSyncing}
                onClick={syncNow}
              >
                <RefreshCw size={13} strokeWidth={2} className={isSyncing ? 'offline-sync-spin' : ''} />
                {isSyncing ? 'Sincronizando...' : 'Sincronizar pendientes ahora'}
              </button>
            )}
          </div>
        )}

        {failedSales.length > 0 && (
          <div>
            <h3 style={{ fontSize: '0.85rem', margin: '0 0 8px', color: 'var(--danger)' }}>
              Con error ({failedSales.length})
            </h3>
            <table className="core-table">
              <thead>
                <tr>
                  <th>Cobrada</th>
                  <th>Total</th>
                  <th>Motivo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {failedSales.map((sale) => (
                  <tr key={sale.clientSideUuid}>
                    <td>{formatDateTime(sale.createdAt)}</td>
                    <td>{formatCurrency(sale.total)}</td>
                    <td>
                      <span
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--danger)' }}
                      >
                        <AlertTriangle size={13} strokeWidth={2} />
                        {sale.error ?? 'No se pudo registrar la venta.'}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        disabled={!isOnline || retryingUuid === sale.clientSideUuid}
                        onClick={() => retrySale(sale.clientSideUuid)}
                      >
                        <RefreshCw
                          size={13}
                          strokeWidth={2}
                          className={retryingUuid === sale.clientSideUuid ? 'offline-sync-spin' : ''}
                        />
                        Reintentar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  )
}
