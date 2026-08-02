import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  confirmPayment,
  fetchPayments,
  fetchPlans,
  fetchSubscriptions,
  fetchTenantAuditLogs,
  fetchTenantSettings,
  updateTenantSettings,
  type TenantSettingsRecord,
} from '../api'

export function usePlans() {
  return useQuery({ queryKey: ['core', 'plans'], queryFn: fetchPlans })
}

export function useTenantSubscriptions(tenantId: number) {
  return useQuery({
    queryKey: ['core', 'subscriptions', tenantId],
    queryFn: () => fetchSubscriptions(tenantId),
  })
}

export function useSubscriptionPayments(subscriptionId: number | undefined) {
  return useQuery({
    queryKey: ['core', 'payments', subscriptionId],
    queryFn: () => fetchPayments(subscriptionId as number),
    enabled: subscriptionId !== undefined,
  })
}

export function useConfirmPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => confirmPayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['core', 'payments'] })
      queryClient.invalidateQueries({ queryKey: ['core', 'subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['core', 'dashboard-summary'] })
    },
  })
}

export function useTenantSettings(tenantId: number) {
  return useQuery({
    queryKey: ['core', 'tenant-settings', tenantId],
    queryFn: () => fetchTenantSettings(tenantId),
  })
}

export function useUpdateTenantSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: Parameters<typeof updateTenantSettings>[1]
    }) => updateTenantSettings(id, data),
    onSuccess: (updated: TenantSettingsRecord) => {
      queryClient.invalidateQueries({ queryKey: ['core', 'tenant-settings', updated.tenant] })
    },
  })
}

export function useTenantAuditLogs(tenantId: number) {
  return useQuery({
    queryKey: ['core', 'audit-logs', tenantId],
    queryFn: () => fetchTenantAuditLogs(tenantId),
  })
}
