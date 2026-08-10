import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createPurchaseOrder, fetchPurchaseOrders, receivePurchaseOrder } from '../api'

export function usePurchaseOrders(params?: {
  status?: string
  supplier?: number
  enabled?: boolean
}) {
  return useQuery({
    queryKey: ['purchase-orders', params?.status ?? '', params?.supplier ?? ''],
    queryFn: () => fetchPurchaseOrders(params),
    enabled: params?.enabled ?? true,
  })
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createPurchaseOrder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['purchase-orders'] }),
  })
}

export function useReceivePurchaseOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => receivePurchaseOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['stock'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] })
      queryClient.invalidateQueries({ queryKey: ['low-stock-variants'] })
    },
  })
}
