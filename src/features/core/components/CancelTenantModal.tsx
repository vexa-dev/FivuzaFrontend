import { AlertTriangle } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Modal } from '../../../shared/components/Modal'
import { ApiError } from '../../../shared/utils/apiClient'
import type { Tenant } from '../api'
import { useCancelTenant } from '../hooks/useTenantLifecycle'

interface CancelTenantModalProps {
  tenant: Tenant
  onClose: () => void
}

export function CancelTenantModal({ tenant, onClose }: CancelTenantModalProps) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const cancelTenant = useCancelTenant()

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!reason.trim()) {
      setError('El motivo es requerido.')
      return
    }
    cancelTenant
      .mutateAsync({ id: tenant.id, reason })
      .then(onClose)
      .catch((err: unknown) => {
        const body = err instanceof ApiError ? (err.body as { error?: { message?: string } }) : null
        setError(body?.error?.message ?? 'No se pudo cancelar el tenant.')
      })
  }

  return (
    <Modal title={`Cancelar ${tenant.company_name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="warning-banner">
          <AlertTriangle size={16} strokeWidth={2} />
          <span>
            Esta acción es <strong>irreversible</strong>. El tenant no podrá reactivarse -si el
            negocio desea volver, deberá registrarse de nuevo. Durante los 30 días siguientes solo
            podrá exportar su respaldo de datos.
          </span>
        </div>
        <div>
          <label htmlFor="cancel-reason">Motivo</label>
          <textarea
            id="cancel-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
          />
        </div>
        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-danger" disabled={cancelTenant.isPending}>
          {cancelTenant.isPending ? 'Cancelando...' : 'Cancelar tenant definitivamente'}
        </button>
      </form>
    </Modal>
  )
}
