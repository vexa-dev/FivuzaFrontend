import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../../../shared/components/ToastProvider'
import { getErrorMessage } from '../../../shared/utils/errorMessage'
import {
  createProduct,
  createVariant,
  deleteProduct,
  deleteVariant,
  fetchProducts,
  updateProduct,
  updateVariant,
  type Product,
  type ProductVariant,
} from '../api'

export function useProducts(params?: { search?: string; category?: number; enabled?: boolean }) {
  return useQuery({
    queryKey: ['products', params?.search ?? '', params?.category ?? ''],
    queryFn: () => fetchProducts(params),
    enabled: params?.enabled ?? true,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Product> }) =>
      updateProduct(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  return useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
    onError: (error) =>
      showToast('error', getErrorMessage(error, 'No se pudo dar de baja el producto.')),
  })
}

export function useCreateVariant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      productId,
      data,
    }: {
      productId: number
      data: Parameters<typeof createVariant>[1]
    }) => createVariant(productId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })
}

export function useUpdateVariant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ProductVariant> }) =>
      updateVariant(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })
}

export function useDeleteVariant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteVariant(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })
}
