import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchTenantFeatureOverrides,
  removeTenantFeatureOverride,
  setTenantFeatureOverride,
  type PlanFeatureCode,
} from '../api'

export function useTenantFeatureOverrides(tenantId: number) {
  return useQuery({
    queryKey: ['core', 'feature-overrides', tenantId],
    queryFn: () => fetchTenantFeatureOverrides(tenantId),
  })
}

export function useSetFeatureOverride(tenantId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      featureCode,
      isEnabled,
    }: {
      featureCode: PlanFeatureCode
      isEnabled: boolean
    }) => setTenantFeatureOverride(tenantId, featureCode, isEnabled),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['core', 'feature-overrides', tenantId] }),
  })
}

export function useRemoveFeatureOverride(tenantId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (featureCode: PlanFeatureCode) =>
      removeTenantFeatureOverride(tenantId, featureCode),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['core', 'feature-overrides', tenantId] }),
  })
}
