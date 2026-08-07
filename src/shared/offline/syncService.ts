import {
  syncSales,
  type SaleSyncConflict,
  type SaleSyncedResult,
  type SaleSyncItemInput,
} from '../../features/sales/api'
import { ApiError } from '../utils/apiClient'
import { offlineDB, type PendingSale } from './db'

export interface SyncSummary {
  created: number
  duplicates: number
  failed: number
  conflicts: SaleSyncConflict[]
}

const EMPTY_SUMMARY: SyncSummary = { created: 0, duplicates: 0, failed: 0, conflicts: [] }

const LAST_SYNCED_AT_KEY = 'fivuza-last-synced-at'

/** Momento del último POST a /ventas/sales/sync/ que el servidor respondió
 * (Sprint 21): no es "última venta creada" -un lote de puros
 * DUPLICATE_IGNORED también cuenta como sincronización exitosa, porque
 * confirma que el servidor está al día con lo que el dispositivo tiene. */
export function getLastSyncedAt(): string | null {
  return localStorage.getItem(LAST_SYNCED_AT_KEY)
}

function markSyncedNow() {
  localStorage.setItem(LAST_SYNCED_AT_KEY, new Date().toISOString())
}

function toSyncItem(sale: PendingSale): SaleSyncItemInput {
  return {
    client_side_uuid: sale.clientSideUuid,
    customer_id: sale.customerId,
    cash_session_id: sale.cashSessionId,
    lines: sale.lines,
    payments: sale.payments,
  }
}

async function applyResult(result: SaleSyncedResult) {
  if (result.status === 'CREATED' || result.status === 'DUPLICATE_IGNORED') {
    await offlineDB.pendingSales.delete(result.client_side_uuid)
  } else {
    await offlineDB.pendingSales.update(result.client_side_uuid, {
      status: 'FAILED',
      error: typeof result.error === 'string' ? result.error : JSON.stringify(result.error),
    })
  }
}

/** SaleSyncItemSerializer(many=True) rechaza el lote entero con 400 si un
 * solo item no pasa la validación de forma de DRF (ej. customer_id ya no
 * existe) -eso ocurre ANTES de que SaleSyncService.sync_batch() vea nada,
 * así que nunca llega un "FAILED" por item para ese caso. Sin este manejo,
 * la venta se quedaría "en cola" para siempre sin que el cajero se entere
 * de que jamás va a sincronizar sola (Sprint 21: "el cajero debe poder
 * confiar en que su venta no se perdió" incluye enterarse cuando sí se
 * perdió el intento). DRF devuelve los errores como un array paralelo al
 * de items enviados -índices sin error vuelven como {}. */
function extractPerItemErrors(body: unknown, itemCount: number): (string | null)[] {
  if (Array.isArray(body) && body.length === itemCount) {
    return body.map((item) => (item && Object.keys(item).length > 0 ? JSON.stringify(item) : null))
  }
  return new Array(itemCount).fill(JSON.stringify(body))
}

/** Sincroniza toda la cola pendiente (Sprint 20, API Spec §4.2). Idempotente
 * del lado del backend por client_side_uuid -si esta llamada se corta a
 * mitad de camino (se pierde la conexión de nuevo) y se reintenta despues,
 * las ventas ya creadas vuelven como DUPLICATE_IGNORED, nunca se duplican.
 * No incluye las que ya están FAILED -esas se reintentan una por una desde
 * la pantalla de estado de sincronización (retrySale), para que el cajero
 * decida cuándo, en vez de que un reintento automático masivo repita el
 * mismo error 100 veces seguidas. */
export async function syncPendingSales(): Promise<SyncSummary> {
  const pending = await offlineDB.pendingSales.where('status').equals('PENDING').toArray()
  if (pending.length === 0) return EMPTY_SUMMARY

  let response
  try {
    response = await syncSales(pending.map(toSyncItem))
  } catch (err) {
    if (!(err instanceof ApiError)) throw err
    // Rechazo a nivel de request (400 de DRF), no un status por venta -sin
    // esto las ventas afectadas quedarían "en cola" indefinidamente.
    markSyncedNow()
    const errors = extractPerItemErrors(err.body, pending.length)
    let failed = 0
    for (let i = 0; i < pending.length; i += 1) {
      if (errors[i] === null) continue
      failed += 1
      await offlineDB.pendingSales.update(pending[i].clientSideUuid, {
        status: 'FAILED',
        error: errors[i] as string,
      })
    }
    return { created: 0, duplicates: 0, failed, conflicts: [] }
  }
  markSyncedNow()

  let created = 0
  let duplicates = 0
  let failed = 0

  for (const result of response.synced) {
    if (result.status === 'CREATED') created += 1
    else if (result.status === 'DUPLICATE_IGNORED') duplicates += 1
    else failed += 1
    await applyResult(result)
  }

  return { created, duplicates, failed, conflicts: response.conflicts }
}

/** Reintento de una sola venta encolada (Sprint 21, Definición de Hecho:
 * "visibilidad de las que fallaron con su motivo" + reintento). Se sincroniza
 * sola, no arrastra al resto de la cola -si esta venta en particular tiene
 * un problema real (ej. el cliente fue eliminado), el cajero puede seguir
 * viendo y reintentando las demás sin que una se trabe con las otras. */
export async function retryFailedSale(clientSideUuid: string): Promise<SaleSyncedResult | null> {
  const sale = await offlineDB.pendingSales.get(clientSideUuid)
  if (!sale) return null

  let response
  try {
    response = await syncSales([toSyncItem(sale)])
  } catch (err) {
    if (!(err instanceof ApiError)) throw err
    markSyncedNow()
    const error = extractPerItemErrors(err.body, 1)[0] ?? JSON.stringify(err.body)
    await offlineDB.pendingSales.update(clientSideUuid, { status: 'FAILED', error })
    return { client_side_uuid: clientSideUuid, status: 'FAILED', error }
  }
  markSyncedNow()
  const result = response.synced[0]
  await applyResult(result)
  return result
}
