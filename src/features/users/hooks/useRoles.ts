import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createRole, fetchRoles } from '../api'

export function useRoles() {
  return useQuery({ queryKey: ['roles'], queryFn: fetchRoles })
}

export function useCreateRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createRole,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }),
  })
}
