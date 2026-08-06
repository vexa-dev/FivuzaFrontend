import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createSale, fetchSale, fetchSales, type SaleCreateInput } from '../api'

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

export function useCreateSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SaleCreateInput) => createSale(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales', 'sales'] })
      // Una venta descuenta stock y puede alimentar el arqueo de la sesion
      // de caja abierta -invalida ambos caches para que el Sprint 16 (POS)
      // no tenga que acordarse de hacerlo el mismo dia que arme la pantalla.
      queryClient.invalidateQueries({ queryKey: ['sales', 'cash-sessions'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
