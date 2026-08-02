import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  confirmPayment,
  createPayment,
  fetchPayments,
  type CreatePaymentPayload,
  type PaymentFilters,
} from '../api'

export function useAllPayments(filters: PaymentFilters = {}) {
  return useQuery({
    queryKey: ['core', 'payments', 'all', filters],
    queryFn: () => fetchPayments(filters),
  })
}

export function useCreatePayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreatePaymentPayload) => createPayment(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['core', 'payments'] }),
  })
}

export function useConfirmPaymentGlobal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => confirmPayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['core', 'payments'] })
      queryClient.invalidateQueries({ queryKey: ['core', 'subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['core', 'dashboard-summary'] })
    },
  })
}
