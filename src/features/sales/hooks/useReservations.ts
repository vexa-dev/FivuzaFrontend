import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  cancelReservation,
  convertReservation,
  createReservation,
  fetchReservations,
} from '../api'

export function useReservations(params?: { customer?: number; status?: string }) {
  return useQuery({
    queryKey: ['reservations', params?.customer ?? '', params?.status ?? ''],
    queryFn: () => fetchReservations(params),
  })
}

export function useCreateReservation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createReservation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservations'] }),
  })
}

export function useConvertReservation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof convertReservation>[1] }) =>
      convertReservation(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservations'] }),
  })
}

export function useCancelReservation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cancelReservation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservations'] }),
  })
}
