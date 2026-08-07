import { useEffect, useState } from 'react'

/** navigator.onLine detecta la interfaz de red, no si el backend realmente
 * responde -es una señal imperfecta (Convenciones §5.3), pero es la misma
 * que dispara los eventos 'online'/'offline' del navegador, y es lo que el
 * cajero necesita: "¿puedo intentar sincronizar ahora?", no una garantía. */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)

  useEffect(() => {
    const goOnline = () => setIsOnline(true)
    const goOffline = () => setIsOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  return isOnline
}
