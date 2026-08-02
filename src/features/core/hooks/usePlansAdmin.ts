import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createPlan,
  createPlanFeature,
  fetchPlanFeatures,
  fetchPlans,
  updatePlan,
  updatePlanFeature,
  type PlanFeatureCode,
  type PlanPayload,
} from '../api'

export function useAllPlans() {
  return useQuery({ queryKey: ['core', 'plans'], queryFn: fetchPlans })
}

export function usePlanFeatures(planId: number | undefined) {
  return useQuery({
    queryKey: ['core', 'plan-features', planId],
    queryFn: () => fetchPlanFeatures(planId as number),
    enabled: planId !== undefined,
  })
}

export function useCreatePlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: PlanPayload) => createPlan(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['core', 'plans'] }),
  })
}

export function useUpdatePlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<PlanPayload> }) => updatePlan(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['core', 'plans'] }),
  })
}

// Como no hay un endpoint de "set" masivo, togglear un feature crea la fila
// si todavia no existe (plan sin esa feature = tratado como is_enabled=false
// por FeatureFlagService) o la actualiza si ya existe.
export function useTogglePlanFeature() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      planId,
      featureId,
      featureCode,
      isEnabled,
    }: {
      planId: number
      featureId: number | null
      featureCode: PlanFeatureCode
      isEnabled: boolean
    }) => {
      if (featureId === null) {
        return createPlanFeature(planId, featureCode, isEnabled)
      }
      return updatePlanFeature(featureId, isEnabled)
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['core', 'plan-features', variables.planId] })
    },
  })
}
