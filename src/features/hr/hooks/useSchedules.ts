import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createEmployeeSchedule,
  deleteEmployeeSchedule,
  fetchEmployeeSchedules,
  updateEmployeeSchedule,
  type EmployeeSchedule,
} from '../api'

export function useEmployeeSchedules(employeeId?: number) {
  return useQuery({
    queryKey: ['hr', 'employee-schedules', employeeId ?? 'all'],
    queryFn: () => fetchEmployeeSchedules(employeeId),
  })
}

export function useCreateEmployeeSchedule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createEmployeeSchedule,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['hr', 'employee-schedules'] }),
  })
}

export function useUpdateEmployeeSchedule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<EmployeeSchedule> }) =>
      updateEmployeeSchedule(id, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['hr', 'employee-schedules'] }),
  })
}

export function useDeleteEmployeeSchedule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteEmployeeSchedule(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['hr', 'employee-schedules'] }),
  })
}
