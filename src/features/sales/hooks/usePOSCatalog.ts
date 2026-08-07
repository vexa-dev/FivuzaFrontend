import { useQuery } from '@tanstack/react-query'
import { getCachedCatalog, replaceCachedCatalog } from '../../../shared/offline/db'
import { fetchPOSCatalog, type POSCatalogItem } from '../api'

/** Catálogo completo del POS para un almacén, pensado para cachearse en el
 * cliente (Sprint 16, Esquema Backend §6.2) -staleTime alto porque el
 * cajero lo consulta constantemente durante todo su turno; se invalida
 * solo cuando una venta descuenta stock (useCreateSale) o el catálogo de
 * Inventario cambia.
 *
 * Sprint 20: cada fetch exitoso escribe el resultado en IndexedDB
 * (write-through). Si el fetch falla por falta de conexión, se sirve el
 * último catálogo cacheado en vez de dejar la pantalla de Vender en
 * blanco -ligeramente desactualizado es mucho mejor que inutilizable. */
async function fetchWithOfflineFallback(warehouseId: number): Promise<POSCatalogItem[]> {
  try {
    const items = await fetchPOSCatalog(warehouseId)
    await replaceCachedCatalog(warehouseId, items)
    return items
  } catch (error) {
    const cached = await getCachedCatalog(warehouseId)
    if (cached.length > 0) return cached
    throw error
  }
}

export function usePOSCatalog(warehouseId: number | undefined) {
  return useQuery({
    queryKey: ['sales', 'pos-catalog', warehouseId],
    queryFn: () => fetchWithOfflineFallback(warehouseId as number),
    enabled: warehouseId !== undefined,
    staleTime: 60_000,
    // Sin reintentos automaticos offline: si no hay red, fallar rapido y
    // caer al cache es mejor que 3 reintentos con backoff que el cajero
    // ve como la pantalla colgada.
    retry: false,
    // 'always': con el default ('online'), React Query directamente NO
    // llama a queryFn cuando navigator.onLine es false -el fallback a
    // Dexie de fetchWithOfflineFallback nunca se ejecutaria, justo el caso
    // que este sprint necesita cubrir (ver mismo fix en useCreateSale).
    networkMode: 'always',
  })
}
