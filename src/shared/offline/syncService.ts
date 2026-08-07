import { syncSales, type SaleSyncConflict, type SaleSyncItemInput } from '../../features/sales/api'
import { offlineDB } from './db'

export interface SyncSummary {
  created: number
  duplicates: number
  failed: number
  conflicts: SaleSyncConflict[]
}

const EMPTY_SUMMARY: SyncSummary = { created: 0, duplicates: 0, failed: 0, conflicts: [] }

/** Sincroniza la cola de ventas offline (Sprint 20, API Spec §4.2). Idempotente
 * del lado del backend por client_side_uuid -si esta llamada se corta a
 * mitad de camino (se pierde la conexión de nuevo) y se reintenta despues,
 * las ventas ya creadas vuelven como DUPLICATE_IGNORED, nunca se duplican. */
export async function syncPendingSales(): Promise<SyncSummary> {
  const pending = await offlineDB.pendingSales.where('status').equals('PENDING').toArray()
  if (pending.length === 0) return EMPTY_SUMMARY

  const items: SaleSyncItemInput[] = pending.map((sale) => ({
    client_side_uuid: sale.clientSideUuid,
    customer_id: sale.customerId,
    cash_session_id: sale.cashSessionId,
    lines: sale.lines,
    payments: sale.payments,
  }))

  const response = await syncSales(items)

  let created = 0
  let duplicates = 0
  let failed = 0

  for (const result of response.synced) {
    if (result.status === 'CREATED') {
      created += 1
      await offlineDB.pendingSales.delete(result.client_side_uuid)
    } else if (result.status === 'DUPLICATE_IGNORED') {
      duplicates += 1
      await offlineDB.pendingSales.delete(result.client_side_uuid)
    } else {
      failed += 1
      await offlineDB.pendingSales.update(result.client_side_uuid, {
        status: 'FAILED',
        error: typeof result.error === 'string' ? result.error : JSON.stringify(result.error),
      })
    }
  }

  return { created, duplicates, failed, conflicts: response.conflicts }
}
