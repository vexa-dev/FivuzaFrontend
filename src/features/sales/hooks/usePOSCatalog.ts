import { useQuery } from '@tanstack/react-query'
import { fetchPOSCatalog } from '../api'

/** Catálogo completo del POS para un almacén, pensado para cachearse en el
 * cliente (Sprint 16, Esquema Backend §6.2) -staleTime alto porque el
 * cajero lo consulta constantemente durante todo su turno; se invalida
 * solo cuando una venta descuenta stock (useCreateSale) o el catálogo de
 * Inventario cambia. */
export function usePOSCatalog(warehouseId: number | undefined) {
  return useQuery({
    queryKey: ['sales', 'pos-catalog', warehouseId],
    queryFn: () => fetchPOSCatalog(warehouseId as number),
    enabled: warehouseId !== undefined,
    staleTime: 60_000,
  })
}
