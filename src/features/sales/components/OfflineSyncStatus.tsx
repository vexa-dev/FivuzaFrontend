import { Cloud, CloudOff, RefreshCw } from 'lucide-react'
import { useOfflineSync } from '../hooks/useOfflineSync'
import './OfflineSyncStatus.css'

/** Indicador de conexión y cola pendiente (Sprint 20): el cajero necesita
 * confiar en que una venta cobrada sin conexión no se perdió -este badge
 * es la única señal visible de que sigue en cola o ya se sincronizó. La
 * pantalla dedicada con detalle por venta y motivo de falla es del
 * Sprint 21; esto cubre lo mínimo de este sprint. */
export function OfflineSyncStatus() {
  const { isOnline, pendingCount, failedCount, isSyncing, syncNow } = useOfflineSync()

  if (isOnline && pendingCount === 0 && failedCount === 0) {
    return (
      <span className="offline-sync-badge offline-sync-badge-ok">
        <Cloud size={13} strokeWidth={2} />
        En línea
      </span>
    )
  }

  return (
    <div className="offline-sync-status">
      <span className={`offline-sync-badge ${isOnline ? 'offline-sync-badge-warning' : 'offline-sync-badge-offline'}`}>
        {isOnline ? <Cloud size={13} strokeWidth={2} /> : <CloudOff size={13} strokeWidth={2} />}
        {isOnline ? 'En línea' : 'Sin conexión'}
      </span>
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
  )
}
