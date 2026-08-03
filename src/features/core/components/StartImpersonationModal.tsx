import { useState, type FormEvent } from 'react'
import { Modal } from '../../../shared/components/Modal'
import { ApiError } from '../../../shared/utils/apiClient'
import type { Tenant } from '../api'
import { useStartImpersonation } from '../hooks/useImpersonation'

interface StartImpersonationModalProps {
  tenant: Tenant
  onClose: () => void
}

export function StartImpersonationModal({ tenant, onClose }: StartImpersonationModalProps) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const startImpersonation = useStartImpersonation()

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!reason.trim()) {
      setError('El motivo es requerido.')
      return
    }
    if (!tenant.domain) {
      setError('Este tenant no tiene un dominio configurado.')
      return
    }

    startImpersonation
      .mutateAsync({ tenantId: tenant.id, reason })
      .then((result) => {
        // Sin refresh token a proposito (Sprint 10): el acceso no puede
        // extenderse mas alla de los 60 minutos de la sesion de soporte.
        const session = {
          access: result.access_token,
          user: result.user,
          impersonation: { sessionId: result.session_id, expiresAt: result.expires_at },
        }
        const encoded = encodeURIComponent(btoa(JSON.stringify(session)))
        const { protocol, port } = window.location
        const target = `${protocol}//${tenant.domain}${port ? `:${port}` : ''}/impersonate#session=${encoded}`
        window.location.href = target
      })
      .catch((err: unknown) => {
        const body =
          err instanceof ApiError ? (err.body as { error?: { message?: string } }) : null
        setError(body?.error?.message ?? 'No se pudo iniciar la sesión de soporte.')
      })
  }

  return (
    <Modal title={`Ingresar como soporte a ${tenant.company_name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p className="core-state-message">
          Vas a entrar al sistema de este negocio como su usuario administrador, sin pedirle su
          contraseña. La sesión dura 60 minutos y queda registrada en ambas bitácoras.
        </p>
        <div>
          <label htmlFor="impersonation-reason">Motivo</label>
          <textarea
            id="impersonation-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            placeholder="Cliente reporta que no puede cerrar una sesión de caja, se revisa en vivo"
          />
        </div>
        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary" disabled={startImpersonation.isPending}>
          {startImpersonation.isPending ? 'Iniciando...' : 'Ingresar como soporte'}
        </button>
      </form>
    </Modal>
  )
}
