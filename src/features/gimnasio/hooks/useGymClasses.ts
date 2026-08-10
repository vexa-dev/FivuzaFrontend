import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createClassSchedule,
  createGymClass,
  deleteClassSchedule,
  deleteGymClass,
  fetchClassSchedules,
  fetchGymClasses,
  updateGymClass,
} from '../api'

export function useGymClasses(params?: { active_only?: boolean }) {
  return useQuery({
    queryKey: ['gimnasio', 'classes', params?.active_only ?? false],
    queryFn: () => fetchGymClasses(params),
  })
}

export function useCreateGymClass() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createGymClass,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gimnasio', 'classes'] }),
  })
}

export function useUpdateGymClass() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateGymClass>[1] }) =>
      updateGymClass(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gimnasio', 'classes'] }),
  })
}

export function useDeleteGymClass() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteGymClass,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gimnasio', 'classes'] }),
  })
}

export function useClassSchedules(params?: { gym_class?: number }) {
  return useQuery({
    queryKey: ['gimnasio', 'class-schedules', params?.gym_class ?? ''],
    queryFn: () => fetchClassSchedules(params),
  })
}

export function useCreateClassSchedule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createClassSchedule,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['gimnasio', 'class-schedules'] }),
  })
}

export function useDeleteClassSchedule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteClassSchedule,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['gimnasio', 'class-schedules'] }),
  })
}
