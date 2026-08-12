import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../../../shared/components/ToastProvider'
import { getErrorMessage } from '../../../shared/utils/errorMessage'
import {
  cancelMembership,
  createMembership,
  fetchMemberships,
  freezeMembership,
  renewMembership,
  unfreezeMembership,
} from '../api'

export function useMemberships(params?: { customer?: number; status?: string }) {
  return useQuery({
    queryKey: ['gimnasio', 'memberships', params?.customer ?? '', params?.status ?? ''],
    queryFn: () => fetchMemberships(params),
    enabled: params?.customer !== undefined,
  })
}

export function useCreateMembership() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createMembership,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gimnasio', 'memberships'] }),
  })
}

export function useRenewMembership() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data?: Parameters<typeof renewMembership>[1] }) =>
      renewMembership(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gimnasio', 'memberships'] }),
  })
}

export function useFreezeMembership() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  return useMutation({
    mutationFn: freezeMembership,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gimnasio', 'memberships'] }),
    onError: (error) =>
      showToast('error', getErrorMessage(error, 'No se pudo congelar la membresía.')),
  })
}

export function useUnfreezeMembership() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  return useMutation({
    mutationFn: unfreezeMembership,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gimnasio', 'memberships'] }),
    onError: (error) =>
      showToast('error', getErrorMessage(error, 'No se pudo descongelar la membresía.')),
  })
}

export function useCancelMembership() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  return useMutation({
    mutationFn: cancelMembership,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gimnasio', 'memberships'] }),
    onError: (error) =>
      showToast('error', getErrorMessage(error, 'No se pudo cancelar la membresía.')),
  })
}
