import { useMutation, useQueryClient } from '@tanstack/react-query'
import { importCatalog } from '../api'

export function useImportCatalog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: importCatalog,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })
}
