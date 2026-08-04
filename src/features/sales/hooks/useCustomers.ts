import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createCustomer,
  deleteCustomer,
  fetchCustomers,
  updateCustomer,
  type Customer,
} from '../api'

export function useCustomers(search?: string) {
  return useQuery({
    queryKey: ['sales', 'customers', search ?? ''],
    queryFn: () => fetchCustomers(search),
  })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createCustomer,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sales', 'customers'] }),
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Customer> }) =>
      updateCustomer(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sales', 'customers'] }),
  })
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteCustomer(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sales', 'customers'] }),
  })
}
