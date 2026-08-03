import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { TenantSession } from './hooks/session'
import { useAuth } from './hooks/useAuth'

/**
 * Landing del flujo de impersonacion (Sprint 10): el panel core redirige el
 * navegador aqui con la sesion codificada en el fragmento de la URL (no en
 * query string, para que no quede en logs del servidor ni se reenvie en el
 * request). Se lee una sola vez, se guarda como sesion normal (sin refresh
 * token) y se limpia el fragmento antes de navegar al dashboard.
 */
export function ImpersonateLandingPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const hash = window.location.hash.replace(/^#/, '')
    const params = new URLSearchParams(hash)
    const payload = params.get('session')

    if (!payload) {
      setError('Enlace de soporte inválido o incompleto.')
      return
    }

    try {
      const session = JSON.parse(atob(payload)) as TenantSession
      login(session)
      history.replaceState(null, '', window.location.pathname)
      navigate('/dashboard', { replace: true })
    } catch {
      setError('No se pudo iniciar la sesión de soporte.')
    }
  }, [login, navigate])

  if (error) {
    return (
      <div className="login-page">
        <div className="login-card card">
          <p className="login-error" role="alert">
            {error}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="login-page">
      <div className="login-card card">
        <div className="loading-row">
          <span className="spinner" />
          Iniciando sesión de soporte...
        </div>
      </div>
    </div>
  )
}
