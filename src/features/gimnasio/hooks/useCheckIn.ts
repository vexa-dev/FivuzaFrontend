import { useMutation } from '@tanstack/react-query'
import { checkIn } from '../api'

export function useCheckIn() {
  return useMutation({ mutationFn: checkIn })
}
