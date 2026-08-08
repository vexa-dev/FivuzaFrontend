import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchPayroll, generatePayroll, markPayrollPaid } from '../api'

export function usePayroll(employeeId?: number) {
  return useQuery({
    queryKey: ['hr', 'payroll', employeeId ?? 'all'],
    queryFn: () => fetchPayroll(employeeId),
  })
}

export function useGeneratePayroll() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: generatePayroll,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hr', 'payroll'] }),
  })
}

export function useMarkPayrollPaid() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, paymentDate }: { id: number; paymentDate?: string }) =>
      markPayrollPaid(id, paymentDate),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hr', 'payroll'] }),
  })
}
