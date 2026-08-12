import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../../../shared/components/ToastProvider'
import { getErrorMessage } from '../../../shared/utils/errorMessage'
import {
  addPromotionTarget,
  createPromotion,
  deletePromotion,
  fetchPromotion,
  fetchPromotions,
  removePromotionTarget,
  updatePromotion,
  type Promotion,
} from '../api'

export function usePromotions(search?: string) {
  return useQuery({
    queryKey: ['sales', 'promotions', search ?? ''],
    queryFn: () => fetchPromotions(search),
  })
}

export function usePromotion(id: number | undefined) {
  return useQuery({
    queryKey: ['sales', 'promotions', 'detail', id],
    queryFn: () => fetchPromotion(id as number),
    enabled: id !== undefined,
  })
}

export function useCreatePromotion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createPromotion,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sales', 'promotions'] }),
  })
}

export function useUpdatePromotion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Promotion> }) =>
      updatePromotion(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sales', 'promotions'] }),
  })
}

export function useDeletePromotion() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  return useMutation({
    mutationFn: (id: number) => deletePromotion(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sales', 'promotions'] }),
    onError: (error) =>
      showToast('error', getErrorMessage(error, 'No se pudo eliminar la promoción.')),
  })
}

export function useAddPromotionTarget(promotionId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (target: { variant?: number; category?: number }) =>
      addPromotionTarget({ promotion: promotionId, ...target }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['sales', 'promotions', 'detail', promotionId],
      }),
  })
}

export function useRemovePromotionTarget(promotionId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (targetId: number) => removePromotionTarget(targetId),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['sales', 'promotions', 'detail', promotionId],
      }),
  })
}
