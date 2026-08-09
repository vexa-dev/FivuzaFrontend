import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
  return useMutation({
    mutationFn: (id: number) => deleteMembershipPlan(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gimnasio', 'membership-plans'] }),
  })
}
