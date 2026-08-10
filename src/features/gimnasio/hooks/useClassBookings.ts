import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  bookClass,
  cancelClassBooking,
  fetchClassBookings,
  markClassAttendance,
} from '../api'

export function useClassBookings(params?: {
  customer?: number
  gym_class?: number
  class_date?: string
}) {
  return useQuery({
    queryKey: [
      'gimnasio',
      'class-bookings',
      params?.customer ?? '',
      params?.gym_class ?? '',
      params?.class_date ?? '',
    ],
    queryFn: () => fetchClassBookings(params),
    enabled: params?.customer !== undefined || params?.gym_class !== undefined,
  })
}

export function useBookClass() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: bookClass,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['gimnasio', 'class-bookings'] }),
  })
}

export function useMarkClassAttendance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, attended }: { id: number; attended: boolean }) =>
      markClassAttendance(id, attended),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['gimnasio', 'class-bookings'] }),
  })
}

export function useCancelClassBooking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cancelClassBooking,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['gimnasio', 'class-bookings'] }),
  })
}
