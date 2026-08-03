import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createSubscriptionDiscount,
  createTenantNote,
  fetchSubscriptionDiscounts,
  fetchTenantConsumption,
  fetchTenantHealth,
  fetchTenantNotes,
  fetchTenantOnboarding,
  removeSubscriptionDiscount,
  type CreateDiscountPayload,
} from '../api'

export function useTenantNotes(tenantId: number) {
  return useQuery({
    queryKey: ['core', 'tenant-notes', tenantId],
    queryFn: () => fetchTenantNotes(tenantId),
  })
}

export function useCreateTenantNote(tenantId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (text: string) => createTenantNote(tenantId, text),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['core', 'tenant-notes', tenantId] }),
  })
}

export function useSubscriptionDiscounts(subscriptionId: number | undefined) {
  return useQuery({
    queryKey: ['core', 'subscription-discounts', subscriptionId],
    queryFn: () => fetchSubscriptionDiscounts(subscriptionId as number),
    enabled: subscriptionId !== undefined,
  })
}

export function useCreateSubscriptionDiscount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateDiscountPayload) => createSubscriptionDiscount(payload),
    onSuccess: (discount) =>
      queryClient.invalidateQueries({
        queryKey: ['core', 'subscription-discounts', discount.subscription_id],
      }),
  })
}

export function useRemoveSubscriptionDiscount(subscriptionId: number | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => removeSubscriptionDiscount(id),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['core', 'subscription-discounts', subscriptionId],
      }),
  })
}

export function useTenantOnboarding(tenantId: number) {
  return useQuery({
    queryKey: ['core', 'tenant-onboarding', tenantId],
    queryFn: () => fetchTenantOnboarding(tenantId),
  })
}

export function useTenantHealth(tenantId: number) {
  return useQuery({
    queryKey: ['core', 'tenant-health', tenantId],
    queryFn: () => fetchTenantHealth(tenantId),
  })
}

export function useTenantConsumption(tenantId: number) {
  return useQuery({
    queryKey: ['core', 'tenant-consumption', tenantId],
    queryFn: () => fetchTenantConsumption(tenantId),
  })
}
