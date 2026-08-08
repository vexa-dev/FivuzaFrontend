import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createDashboardWidget,
  fetchDashboardWidgets,
  updateDashboardWidget,
  type DashboardWidget,
} from '../api'

export function useDashboardWidgets() {
  return useQuery({
    queryKey: ['dashboard', 'widgets'],
    queryFn: fetchDashboardWidgets,
  })
}

export function useCreateDashboardWidget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createDashboardWidget,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard', 'widgets'] }),
  })
}

export function useUpdateDashboardWidget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<DashboardWidget> }) =>
      updateDashboardWidget(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard', 'widgets'] }),
  })
}
