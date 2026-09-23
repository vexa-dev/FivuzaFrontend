import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createSaleReturn, fetchSaleReturns, type SaleReturnCreateInput } from '../api'

export function useSaleReturns(saleId: number | undefined) {
  return useQuery({
    queryKey: ['sales', 'sale-returns', saleId],
    queryFn: () => fetchSaleReturns(saleId as number),
    enabled: saleId !== undefined,
  })
}

export function useCreateSaleReturn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      data,
      authorizationToken,
    }: {
      data: SaleReturnCreateInput
      authorizationToken?: string
    }) => createSaleReturn(data, authorizationToken),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sales', 'sale-returns', variables.data.sale_id] })
      queryClient.invalidateQueries({ queryKey: ['sales', 'sales'] })
      queryClient.invalidateQueries({ queryKey: ['sales', 'cash-sessions'] })
      queryClient.invalidateQueries({ queryKey: ['sales', 'cash-movements'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['sales', 'pos-catalog'] })
    },
  })
}
