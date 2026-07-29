import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchPermissions,
  fetchRolePermissions,
  grantRolePermission,
  revokeRolePermission,
} from '../api'

export function usePermissions() {
  return useQuery({ queryKey: ['permissions'], queryFn: fetchPermissions })
}

export function useRolePermissions() {
  return useQuery({ queryKey: ['role-permissions'], queryFn: fetchRolePermissions })
}

export function useToggleRolePermission() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['role-permissions'] })

  const grant = useMutation({
    mutationFn: ({ role, permission }: { role: number; permission: number }) =>
      grantRolePermission(role, permission),
    onSuccess: invalidate,
  })

  const revoke = useMutation({
    mutationFn: (rolePermissionId: number) => revokeRolePermission(rolePermissionId),
    onSuccess: invalidate,
  })

  return { grant, revoke }
}
