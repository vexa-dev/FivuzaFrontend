import Dexie, { type EntityTable } from 'dexie'

/**
 * Persistencia offline del POS sobre IndexedDB (Convenciones §5.2).
 * Independiente de TanStack Query: Query cachea lo que YA se sincronizó
 * con el servidor; esta base guarda lo que TODAVÍA no se ha sincronizado.
 *
 * El POS real llega en Fase 3 (Plan de Implementación) -por ahora solo se
 * deja la base configurada y lista, sin lógica de sincronización todavía.
 */
export interface PendingSale {
  clientSideUuid: string
  payload: unknown
  createdAt: string
}

export const offlineDb = new Dexie('fivuza_offline') as Dexie & {
  sales_pending: EntityTable<PendingSale, 'clientSideUuid'>
}

offlineDb.version(1).stores({
  sales_pending: 'clientSideUuid, createdAt',
})
