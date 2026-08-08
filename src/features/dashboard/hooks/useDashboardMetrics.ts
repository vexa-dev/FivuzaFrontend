import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect } from 'react'
import { fetchDashboardMetrics } from '../api'
import { useDashboardSocket } from './useDashboardSocket'

const METRICS_QUERY_KEY = ['dashboard', 'metrics']
const POLLING_INTERVAL_MS = 30_000

/** Métricas del dashboard, actualizadas por WebSocket cuando hay conexión
 * y degradadas a polling cada 30s cuando no (Sprint 24, TRD §2.5) -el
 * Definición de Hecho pide que una venta se refleje "sin recargar la
 * página" incluso si el WebSocket no está disponible. */
export function useDashboardMetrics(warehouseId?: number) {
  const queryClient = useQueryClient()
  const queryKey = [...METRICS_QUERY_KEY, warehouseId ?? 'all']

  const query = useQuery({
    queryKey,
    queryFn: () => fetchDashboardMetrics(warehouseId),
  })

  const handleSaleCompleted = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: METRICS_QUERY_KEY })
  }, [queryClient])

  const { isConnected } = useDashboardSocket(handleSaleCompleted)

  useEffect(() => {
    if (isConnected) return
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: METRICS_QUERY_KEY })
    }, POLLING_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [isConnected, queryClient])

  return { ...query, isConnected }
}
