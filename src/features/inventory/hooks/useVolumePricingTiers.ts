import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createVolumePricingTier,
  deleteVolumePricingTier,
  fetchVolumePricingTiers,
} from '../api'

export function useVolumePricingTiers(variantId: number) {
  return useQuery({
    queryKey: ['volume-pricing-tiers', variantId],
    queryFn: () => fetchVolumePricingTiers(variantId),
    enabled: Boolean(variantId),
  })
}

export function useCreateVolumePricingTier(variantId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createVolumePricingTier,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['volume-pricing-tiers', variantId] }),
  })
}

export function useDeleteVolumePricingTier(variantId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteVolumePricingTier,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['volume-pricing-tiers', variantId] }),
  })
}
