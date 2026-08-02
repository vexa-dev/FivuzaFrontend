import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createTaxRate,
  deleteTaxRate,
  fetchTaxRates,
  updateTaxRate,
  type TaxRate,
} from '../api'

export function useTaxRates() {
  return useQuery({ queryKey: ['tax-rates'], queryFn: fetchTaxRates })
}

export function useCreateTaxRate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createTaxRate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tax-rates'] }),
  })
}

export function useUpdateTaxRate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TaxRate> }) =>
      updateTaxRate(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tax-rates'] }),
  })
}

export function useDeleteTaxRate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteTaxRate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tax-rates'] }),
  })
}
