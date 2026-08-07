import { liveQuery } from 'dexie'
import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { offlineDB, type PendingSale } from '../../../shared/offline/db'
import {
  getLastSyncedAt,
  retryFailedSale,
  syncPendingSales,
  type SyncSummary,
} from '../../../shared/offline/syncService'
import { useOnlineStatus } from '../../../shared/offline/useOnlineStatus'

/** Cola en vivo de ventas encoladas (Sprint 20/21) -liveQuery de Dexie en
 * vez de una tabla de React Query: la cola vive en IndexedDB, no en el
 * servidor, asi que no hay nada que "fetchear" -solo suscribirse a los
 * cambios locales. */
function usePendingSalesQueue() {
  const [pending, setPending] = useState<PendingSale[]>([])
  const [failed, setFailed] = useState<PendingSale[]>([])

  useEffect(() => {
    const pendingSub = liveQuery(() =>
      offlineDB.pendingSales.where('status').equals('PENDING').toArray(),
    ).subscribe({ next: setPending, error: () => {} })
    const failedSub = liveQuery(() =>
      offlineDB.pendingSales.where('status').equals('FAILED').toArray(),
    ).subscribe({ next: setFailed, error: () => {} })
    return () => {
      pendingSub.unsubscribe()
      failedSub.unsubscribe()
    }
  }, [])

  return { pending, failed }
}

/** Detecta reconexión y dispara la sincronización sola, sin que el cajero
 * tenga que hacer nada (Sprint 20, Definición de Hecho: "al recuperar
 * conexión las sincroniza"). El indicador de estado, el detalle por venta y
 * el reintento individual (Sprint 21) quedan disponibles para cuando la
 * sincronización automática falle o el cajero quiera confirmar por su
 * cuenta que nada se perdió. */
export function useOfflineSync() {
  const isOnline = useOnlineStatus()
  const { pending, failed } = usePendingSalesQueue()
  const queryClient = useQueryClient()
  const wasOffline = useRef(!isOnline)
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() => getLastSyncedAt())

  const invalidateAfterSync = () => {
    queryClient.invalidateQueries({ queryKey: ['sales', 'sales'] })
    queryClient.invalidateQueries({ queryKey: ['sales', 'cash-sessions'] })
    queryClient.invalidateQueries({ queryKey: ['sales', 'pos-catalog'] })
    queryClient.invalidateQueries({ queryKey: ['products'] })
  }

  const sync = useMutation<SyncSummary, unknown, void>({
    mutationFn: syncPendingSales,
    onSuccess: (summary) => {
      setLastSyncedAt(getLastSyncedAt())
      if (summary.created > 0 || summary.duplicates > 0) invalidateAfterSync()
    },
  })

  const retry = useMutation<Awaited<ReturnType<typeof retryFailedSale>>, unknown, string>({
    mutationFn: retryFailedSale,
    onSuccess: (result) => {
      setLastSyncedAt(getLastSyncedAt())
      if (result?.status === 'CREATED' || result?.status === 'DUPLICATE_IGNORED') {
        invalidateAfterSync()
      }
    },
  })

  const { mutate: triggerSync } = sync

  useEffect(() => {
    if (isOnline && wasOffline.current && pending.length > 0) {
      triggerSync()
    }
    wasOffline.current = !isOnline
  }, [isOnline, pending.length, triggerSync])

  return {
    isOnline,
    pendingCount: pending.length,
    failedCount: failed.length,
    pendingSales: pending,
    failedSales: failed,
    lastSyncedAt,
    isSyncing: sync.isPending,
    lastSummary: sync.data,
    syncNow: () => sync.mutate(),
    retryingUuid: retry.isPending ? retry.variables : null,
    retrySale: (clientSideUuid: string) => retry.mutate(clientSideUuid),
  }
}
