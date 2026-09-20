import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchTenantSettings, updateTenantSettings } from '../api'

const QUERY_KEY = ['settings', 'tenant'] as const

export function useTenantSettings(enabled = true) {
  return useQuery({ queryKey: QUERY_KEY, queryFn: fetchTenantSettings, enabled })
}

export function useUpdateTenantSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateTenantSettings,
    onSuccess: (settings) => {
      queryClient.setQueryData(QUERY_KEY, settings)
      // Los interruptores conceden permisos de caja: lo que el usuario puede
      // hacer cambia con ellos, así que las cajas y sesiones se revalidan.
      queryClient.invalidateQueries({ queryKey: ['sales', 'cash-sessions'] })
      queryClient.invalidateQueries({ queryKey: ['sales', 'cash-registers'] })
    },
  })
}
