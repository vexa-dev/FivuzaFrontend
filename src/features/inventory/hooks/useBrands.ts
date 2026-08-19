import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../../../shared/components/ToastProvider'
import { getErrorMessage } from '../../../shared/utils/errorMessage'
import { createBrand, deleteBrand, fetchBrands, updateBrand, type Brand } from '../api'

export function useBrands(search?: string) {
  return useQuery({
    queryKey: ['brands', search ?? ''],
    queryFn: () => fetchBrands(search),
  })
}

export function useCreateBrand() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createBrand,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['brands'] }),
  })
}

export function useUpdateBrand() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Brand> }) => updateBrand(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['brands'] }),
  })
}

export function useDeleteBrand() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  return useMutation({
    mutationFn: (id: number) => deleteBrand(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['brands'] }),
    onError: (error) =>
      showToast('error', getErrorMessage(error, 'No se pudo eliminar la marca.')),
  })
}
