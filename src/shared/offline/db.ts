import Dexie, { type Table } from 'dexie'
import type { POSCatalogItem, SaleLineInput, SalePaymentInput } from '../../features/sales/api'

/** Cache local del catálogo del POS (Sprint 20, Convenciones §5.2):
 * espejo de GET /ventas/pos/catalog/ para el almacén activo, para que la
 * pantalla de Vender siga funcionando sin conexión. warehouseId separa el
 * cache por almacén -un dispositivo solo suele operar contra uno a la vez
 * (la caja abierta determina el almacén), pero nada impide que use más de
 * uno en distintos turnos. */
export interface CachedCatalogItem extends POSCatalogItem {
  warehouseId: number
}

/** Una venta armada sin conexión, en cola para /ventas/sales/sync/
 * (Sprint 20, API Spec §4.2). client_side_uuid se genera en el cliente
 * apenas se encola -es la clave de idempotencia que el backend usa para
 * nunca duplicarla, sin importar cuántas veces se reintente el envío. */
export interface PendingSale {
  clientSideUuid: string
  customerId: number
  cashSessionId: number
  lines: SaleLineInput[]
  payments: SalePaymentInput[]
  total: string
  createdAt: string
  status: 'PENDING' | 'FAILED'
  error?: string
}

class FivuzaOfflineDB extends Dexie {
  catalog!: Table<CachedCatalogItem, number>
  pendingSales!: Table<PendingSale, string>

  constructor() {
    super('fivuza-offline')
    this.version(1).stores({
      catalog: 'id, warehouseId',
      pendingSales: 'clientSideUuid, status, createdAt',
    })
  }
}

export const offlineDB = new FivuzaOfflineDB()

export async function replaceCachedCatalog(warehouseId: number, items: POSCatalogItem[]) {
  const rows: CachedCatalogItem[] = items.map((item) => ({ ...item, warehouseId }))
  await offlineDB.transaction('rw', offlineDB.catalog, async () => {
    await offlineDB.catalog.where('warehouseId').equals(warehouseId).delete()
    await offlineDB.catalog.bulkPut(rows)
  })
}

export function getCachedCatalog(warehouseId: number): Promise<CachedCatalogItem[]> {
  return offlineDB.catalog.where('warehouseId').equals(warehouseId).toArray()
}
