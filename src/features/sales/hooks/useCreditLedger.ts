import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchCustomerBalanceLedger, fetchCustomerDebtLedger, registerDebtPayment } from '../api'

export function useCustomerDebtLedger(customerId: number | undefined) {
  return useQuery({
    queryKey: ['sales', 'customer-debt-ledger', customerId],
    queryFn: () => fetchCustomerDebtLedger(customerId as number),
    enabled: customerId !== undefined,
  })
}

export function useCustomerBalanceLedger(customerId: number | undefined) {
  return useQuery({
    queryKey: ['sales', 'customer-balance-ledger', customerId],
    queryFn: () => fetchCustomerBalanceLedger(customerId as number),
    enabled: customerId !== undefined,
  })
}

export function useRegisterDebtPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: registerDebtPayment,
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['sales', 'customer-debt-ledger', variables.customer_id],
      })
      // current_debt/current_balance viven en el propio Customer serializado.
      queryClient.invalidateQueries({ queryKey: ['sales', 'customers'] })
    },
  })
}
