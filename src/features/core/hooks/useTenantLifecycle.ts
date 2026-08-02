import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  cancelTenant,
  fetchTenant,
  reactivateTenant,
  registerTenant,
  suspendTenant,
  type RegisterTenantPayload,
} from '../api'

export function useTenant(id: number) {
  return useQuery({
    queryKey: ['core', 'tenants', id],
    queryFn: () => fetchTenant(id),
  })
}

function invalidateTenants(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['core', 'tenants'] })
  queryClient.invalidateQueries({ queryKey: ['core', 'dashboard-summary'] })
}

export function useRegisterTenant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: RegisterTenantPayload) => registerTenant(payload),
    onSuccess: () => invalidateTenants(queryClient),
  })
}

export function useSuspendTenant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => suspendTenant(id, reason),
    onSuccess: () => invalidateTenants(queryClient),
  })
}

export function useReactivateTenant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => reactivateTenant(id),
    onSuccess: () => invalidateTenants(queryClient),
  })
}

export function useCancelTenant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => cancelTenant(id, reason),
    onSuccess: () => invalidateTenants(queryClient),
  })
}
