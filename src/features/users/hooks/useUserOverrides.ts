import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchUserPermissionOverrides,
  removeUserPermissionOverride,
  setUserPermissionOverride,
} from '../api'

export function useUserPermissionOverrides() {
  return useQuery({ queryKey: ['user-permission-overrides'], queryFn: fetchUserPermissionOverrides })
}

export function useSetUserOverride() {
  const queryClient = useQueryClient()
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['user-permission-overrides'] })

  const set = useMutation({
    mutationFn: ({
      user,
      permission,
      isGranted,
    }: {
      user: number
      permission: number
      isGranted: boolean
    }) => setUserPermissionOverride(user, permission, isGranted),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (overrideId: number) => removeUserPermissionOverride(overrideId),
    onSuccess: invalidate,
  })

  return { set, remove }
}
