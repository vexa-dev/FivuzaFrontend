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

export function useInventoryMovements(params?: {
  variant?: number
  warehouse?: number
  date_from?: string
  date_to?: string
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
