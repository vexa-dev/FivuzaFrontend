import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchDataExportDownloadUrl,
  fetchDataExports,
  requestDataExport,
  type DataExportFormat,
} from '../api'

export function useDataExports() {
  return useQuery({
    queryKey: ['data-exports'],
    queryFn: fetchDataExports,
    refetchInterval: (query) =>
      query.state.data?.some((item) => item.status === 'PENDING' || item.status === 'PROCESSING')
        ? 5000
        : false,
  })
}

export function useRequestDataExport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (format: DataExportFormat) => requestDataExport(format),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['data-exports'] }),
  })
}

export function useDataExportDownloadUrl() {
  return useMutation({
    mutationFn: (id: number) => fetchDataExportDownloadUrl(id),
  })
}
