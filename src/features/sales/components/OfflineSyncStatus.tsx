import { Cloud, CloudOff, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { useOfflineSync } from '../hooks/useOfflineSync'
import { SyncStatusModal } from './SyncStatusModal'
import './OfflineSyncStatus.css'

/** Indicador de conexión y cola pendiente (Sprint 20): el cajero necesita
 * confiar en que una venta cobrada sin conexión no se perdió -este badge
 * es la señal siempre visible; al hacer clic (Sprint 21) se abre el
 * detalle por venta con motivo de falla y reintento individual, sin
 * importar qué variante del badge esté mostrando en ese momento. */
export function OfflineSyncStatus() {
  const { isOnline, pendingCount, failedCount, isSyncing, syncNow } = useOfflineSync()
  const [showDetail, setShowDetail] = useState(false)

  const allSynced = isOnline && pendingCount === 0 && failedCount === 0

  return (
    <>
      {allSynced ? (
        <button
          type="button"
          className="offline-sync-badge offline-sync-badge-ok offline-sync-badge-btn"
          onClick={() => setShowDetail(true)}
        >
          <Cloud size={13} strokeWidth={2} />
          En línea
        </button>
      ) : (
        <div className="offline-sync-status">
          <button
            type="button"
            className={`offline-sync-badge offline-sync-badge-btn ${isOnline ? 'offline-sync-badge-warning' : 'offline-sync-badge-offline'}`}
            onClick={() => setShowDetail(true)}
          >
            {isOnline ? <Cloud size={13} strokeWidth={2} /> : <CloudOff size={13} strokeWidth={2} />}
            {isOnline ? 'En línea' : 'Sin conexión'}
          </button>
          {pendingCount > 0 && (
            <span className="offline-sync-pending">
              {pendingCount} {pendingCount === 1 ? 'venta pendiente' : 'ventas pendientes'}
            </span>
          )}
          {failedCount > 0 && (
            <span className="offline-sync-pending offline-sync-failed">
              {failedCount} con error
            </span>
          )}
          {isOnline && (pendingCount > 0 || failedCount > 0) && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={isSyncing}
              onClick={syncNow}
            >
              <RefreshCw size={13} strokeWidth={2} className={isSyncing ? 'offline-sync-spin' : ''} />
              {isSyncing ? 'Sincronizando...' : 'Sincronizar ahora'}
            </button>
          )}
        </div>
      )}
      {showDetail && <SyncStatusModal onClose={() => setShowDetail(false)} />}
    </>
  )
}
