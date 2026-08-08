import { useEffect, useRef, useState } from 'react'
import { getAccessToken } from '../../auth/hooks/session'
import { getTenantWebSocketUrl } from '../../../shared/utils/tenantApiClient'

/** Conexión WebSocket al dashboard con reconexión automática (Sprint 24,
 * TRD §2.5): backoff exponencial acotado a 30s entre reintentos. El
 * consumidor de este hook decide qué hacer cuando isConnected es false
 * -normalmente, degradar a polling (ver useDashboardMetrics). */
export function useDashboardSocket(onSaleCompleted: () => void) {
  const [isConnected, setIsConnected] = useState(false)
  const onSaleCompletedRef = useRef(onSaleCompleted)
  onSaleCompletedRef.current = onSaleCompleted

  useEffect(() => {
    let socket: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let retryCount = 0
    let cancelled = false

    const connect = () => {
      const token = getAccessToken()
      if (!token || cancelled) return

      socket = new WebSocket(getTenantWebSocketUrl(`/ws/dashboard/?token=${token}`))

      socket.onopen = () => {
        retryCount = 0
        setIsConnected(true)
      }

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as { event?: string }
          if (data.event === 'sale_completed') onSaleCompletedRef.current()
        } catch {
          // Mensaje no-JSON o inesperado -se ignora, no es motivo para
          // cerrar la conexion.
        }
      }

      socket.onclose = () => {
        setIsConnected(false)
        if (cancelled) return
        const delay = Math.min(1000 * 2 ** retryCount, 30000)
        retryCount += 1
        reconnectTimer = setTimeout(connect, delay)
      }

      socket.onerror = () => socket?.close()
    }

    connect()

    return () => {
      cancelled = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      socket?.close()
    }
  }, [])

  return { isConnected }
}
