import { liveQuery } from 'dexie'
import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { offlineDB } from '../../../shared/offline/db'
import { syncPendingSales, type SyncSummary } from '../../../shared/offline/syncService'
import { useOnlineStatus } from '../../../shared/offline/useOnlineStatus'

/** Cuenta en vivo de ventas encoladas (Sprint 20) -liveQuery de Dexie en
 * vez de una tabla de React Query: la cola vive en IndexedDB, no en el
 * servidor, asi que no hay nada que "fetchear" -solo suscribirse a los
 * cambios locales. */
function usePendingSalesCount() {
  const [pending, setPending] = useState(0)
  const [failed, setFailed] = useState(0)

  useEffect(() => {
    const pendingSub = liveQuery(() =>
      offlineDB.pendingSales.where('status').equals('PENDING').count(),
    ).subscribe({ next: setPending, error: () => {} })
    const failedSub = liveQuery(() =>
      offlineDB.pendingSales.where('status').equals('FAILED').count(),
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
 * conexión las sincroniza"). El indicador de estado y el reintento manual
 * quedan disponibles para cuando la sincronización automática falle. */
export function useOfflineSync() {
  const isOnline = useOnlineStatus()
  const { pending, failed } = usePendingSalesCount()
  const queryClient = useQueryClient()
  const wasOffline = useRef(!isOnline)

  const sync = useMutation<SyncSummary, unknown, void>({
    mutationFn: syncPendingSales,
    onSuccess: (summary) => {
      if (summary.created > 0 || summary.duplicates > 0) {
        queryClient.invalidateQueries({ queryKey: ['sales', 'sales'] })
        queryClient.invalidateQueries({ queryKey: ['sales', 'cash-sessions'] })
        queryClient.invalidateQueries({ queryKey: ['sales', 'pos-catalog'] })
        queryClient.invalidateQueries({ queryKey: ['products'] })
      }
    },
  })

  const { mutate: triggerSync } = sync

  useEffect(() => {
    if (isOnline && wasOffline.current && pending > 0) {
      triggerSync()
    }
    wasOffline.current = !isOnline
  }, [isOnline, pending, triggerSync])

  return {
    isOnline,
    pendingCount: pending,
    failedCount: failed,
    isSyncing: sync.isPending,
    lastSummary: sync.data,
    syncNow: () => sync.mutate(),
  }
}
