import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../../../shared/components/ToastProvider'
import { getErrorMessage } from '../../../shared/utils/errorMessage'
import {
  createMembershipPlan,
  deleteMembershipPlan,
  fetchMembershipPlans,
  updateMembershipPlan,
  type MembershipPlan,
} from '../api'

export function useMembershipPlans() {
  return useQuery({ queryKey: ['gimnasio', 'membership-plans'], queryFn: fetchMembershipPlans })
}

export function useCreateMembershipPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createMembershipPlan,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gimnasio', 'membership-plans'] }),
  })
}

export function useUpdateMembershipPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<MembershipPlan> }) =>
      updateMembershipPlan(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gimnasio', 'membership-plans'] }),
  })
}

export function useDeleteMembershipPlan() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  return useMutation({
    mutationFn: (id: number) => deleteMembershipPlan(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gimnasio', 'membership-plans'] }),
    onError: (error) =>
      showToast('error', getErrorMessage(error, 'No se pudo eliminar el plan.')),
  })
}
