import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createEmployee,
  deleteEmployee,
  fetchEmployees,
  updateEmployee,
  type Employee,
} from '../api'

export function useEmployees(params?: { search?: string; warehouse?: number }) {
  return useQuery({
    queryKey: ['hr', 'employees', params ?? {}],
    queryFn: () => fetchEmployees(params),
  })
}

export function useCreateEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createEmployee,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hr', 'employees'] }),
  })
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Employee> }) =>
      updateEmployee(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hr', 'employees'] }),
  })
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteEmployee(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hr', 'employees'] }),
  })
}
