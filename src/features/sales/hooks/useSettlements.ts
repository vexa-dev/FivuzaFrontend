import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { importSettlement, fetchSettlementReconciliation } from '../api'

export function useImportSettlement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: importSettlement,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['sales', 'settlement-reconciliation'] }),
  })
}

export function useSettlementReconciliation(provider?: string) {
  return useQuery({
    queryKey: ['sales', 'settlement-reconciliation', provider ?? ''],
    queryFn: () => fetchSettlementReconciliation(provider),
  })
}
