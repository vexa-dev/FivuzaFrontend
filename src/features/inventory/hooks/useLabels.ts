import { useMutation } from '@tanstack/react-query'
import { printLabels } from '../api'

export function usePrintLabels() {
  return useMutation({ mutationFn: printLabels })
}
