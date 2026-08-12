import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../../../shared/components/ToastProvider'
import { getErrorMessage } from '../../../shared/utils/errorMessage'
import { createUser, deleteUser, fetchUsers, updateUser, type TenantUserRecord } from '../api'

export function useUsers() {
  return useQuery({ queryKey: ['users'], queryFn: fetchUsers })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateUser>[1] }) =>
      updateUser(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  return useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
    onError: (error) =>
      showToast('error', getErrorMessage(error, 'No se pudo eliminar el usuario.')),
  })
}

export type { TenantUserRecord }
