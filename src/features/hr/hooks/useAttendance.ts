import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { clockIn, clockOut, fetchAttendance } from '../api'

export function useAttendance(employeeId?: number) {
  return useQuery({
    queryKey: ['hr', 'attendance', employeeId ?? 'all'],
    queryFn: () => fetchAttendance(employeeId),
  })
}

export function useClockIn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: clockIn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hr', 'attendance'] }),
  })
}

export function useClockOut() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => clockOut(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hr', 'attendance'] }),
  })
}
