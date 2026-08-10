import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createMembershipGroup, fetchMembershipGroups } from '../api'

export function useMembershipGroups() {
  return useQuery({
    queryKey: ['gimnasio', 'membership-groups'],
    queryFn: fetchMembershipGroups,
  })
}

export function useCreateMembershipGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createMembershipGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gimnasio', 'membership-groups'] })
      queryClient.invalidateQueries({ queryKey: ['gimnasio', 'memberships'] })
    },
  })
}
