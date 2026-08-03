import { LogOut, ShieldAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { useEndImpersonation } from '../../features/auth/hooks/useEndImpersonation'
import './ImpersonationBanner.css'

function formatRemaining(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now()
  if (ms <= 0) return '0:00'
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function ImpersonationBanner() {
  const { impersonation } = useAuth()
  const endImpersonation = useEndImpersonation()
  const [, forceTick] = useState(0)

  // Recalcula el tiempo restante cada segundo, y termina la sesion sola en
  // el navegador apenas expira -sin esto, el usuario seguiria viendo el
  // banner (y el ERP) hasta que la proxima llamada a la API le devolviera
  // un 401 sin previo aviso.
  useEffect(() => {
    if (!impersonation) return
    const interval = setInterval(() => {
      if (new Date(impersonation.expiresAt).getTime() <= Date.now()) {
        endImpersonation()
        return
      }
      forceTick((tick) => tick + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [impersonation, endImpersonation])

  if (!impersonation) return null

  return (
    <div className="impersonation-banner">
      <ShieldAlert size={16} strokeWidth={2} />
      <span>
        Estás viendo esto como soporte de Fivuza -sesión expira en{' '}
        {formatRemaining(impersonation.expiresAt)}
      </span>
      <button type="button" className="impersonation-banner-exit" onClick={endImpersonation}>
        <LogOut size={14} strokeWidth={2} />
        Salir
      </button>
    </div>
  )
}
