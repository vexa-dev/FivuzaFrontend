import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createStaff, fetchStaff, updateStaff, type StaffPayload } from '../api'

export function useStaff() {
  return useQuery({ queryKey: ['core', 'staff'], queryFn: fetchStaff })
}

export function useCreateStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: StaffPayload) => createStaff(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['core', 'staff'] }),
  })
}

export function useUpdateStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<StaffPayload> }) =>
      updateStaff(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['core', 'staff'] }),
  })
}
