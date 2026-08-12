import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../../../shared/components/ToastProvider'
import { getErrorMessage } from '../../../shared/utils/errorMessage'
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
  type Category,
} from '../api'

export function useCategories(search?: string) {
  return useQuery({
    queryKey: ['categories', search ?? ''],
    queryFn: () => fetchCategories(search),
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Category> }) =>
      updateCategory(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  return useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
    onError: (error) =>
      showToast('error', getErrorMessage(error, 'No se pudo eliminar la categoría.')),
  })
}
