import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  adjustStock,
  fetchInventoryMovements,
  fetchLowStockVariants,
  fetchStock,
  transferStock,
} from '../api'

export function useStock(params?: { variant?: number; warehouse?: number }) {
  return useQuery({
    queryKey: ['stock', params?.variant ?? '', params?.warehouse ?? ''],
    queryFn: () => fetchStock(params),
    enabled: Boolean(params?.variant && params?.warehouse),
  })
}

// Sin filtro -/inventario/stock/ ya devuelve todo el tenant si no se le pasa
// variant/warehouse. Usado por la tabla de Productos para mostrar stock
// total y por almacen sin pedir un endpoint agregado nuevo al backend.
export function useAllStock() {
  return useQuery({
    queryKey: ['stock', 'all'],
    queryFn: () => fetchStock(),
  })
}

export function useInventoryMovements(params?: {
  variant?: number
  warehouse?: number
  date_from?: string
  date_to?: string
  enabled?: boolean
}) {
  return useQuery({
    queryKey: [
      'inventory-movements',
      params?.variant ?? '',
      params?.warehouse ?? '',
      params?.date_from ?? '',
      params?.date_to ?? '',
    ],
    queryFn: () => fetchInventoryMovements(params),
    enabled: params?.enabled ?? true,
  })
}

export function useAdjustStock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: adjustStock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] })
      queryClient.invalidateQueries({ queryKey: ['low-stock-variants'] })
    },
  })
}

export function useTransferStock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: transferStock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] })
      queryClient.invalidateQueries({ queryKey: ['low-stock-variants'] })
    },
  })
}

export function useLowStockVariants(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['low-stock-variants'],
    queryFn: fetchLowStockVariants,
    refetchInterval: 60_000,
    enabled: options?.enabled ?? true,
  })
}
