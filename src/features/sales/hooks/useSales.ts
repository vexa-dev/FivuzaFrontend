import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createSale, fetchSale, fetchSaleReceipt, fetchSales, type SaleCreateInput } from '../api'

export function useSales(filters?: Parameters<typeof fetchSales>[0]) {
  return useQuery({
    queryKey: ['sales', 'sales', filters ?? {}],
    queryFn: () => fetchSales(filters),
  })
}

export function useSale(id: number | undefined) {
  return useQuery({
    queryKey: ['sales', 'sales', 'detail', id],
    queryFn: () => fetchSale(id as number),
    enabled: id !== undefined,
  })
}

export function useSaleReceipt(id: number | undefined, widthMm: 58 | 80 = 58) {
  return useQuery({
    queryKey: ['sales', 'sales', 'receipt', id, widthMm],
    queryFn: () => fetchSaleReceipt(id as number, widthMm),
    enabled: id !== undefined,
    // El ticket no cambia una vez emitido -evita reimprimir un round-trip
    // innecesario si el cajero vuelve a abrir el mismo comprobante.
    staleTime: Infinity,
  })
}

export function useCreateSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SaleCreateInput) => createSale(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales', 'sales'] })
      // Una venta descuenta stock y puede alimentar el arqueo de la sesion
      // de caja abierta -invalida los tres caches relacionados (incluido
      // el catalogo del POS, que trae su propio stock/promocion por
      // variante) en vez de esperar a que expire staleTime solo.
      queryClient.invalidateQueries({ queryKey: ['sales', 'cash-sessions'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['sales', 'pos-catalog'] })
    },
  })
}
