import { useState, type FormEvent } from 'react'
import { Modal } from '../../../shared/components/Modal'
import type { Tenant } from '../api'
import { useSuspendTenant } from '../hooks/useTenantLifecycle'

interface SuspendTenantModalProps {
  tenant: Tenant
  onClose: () => void
}

export function SuspendTenantModal({ tenant, onClose }: SuspendTenantModalProps) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const suspendTenant = useSuspendTenant()

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!reason.trim()) {
      setError('El motivo es requerido.')
      return
    }
    suspendTenant
      .mutateAsync({ id: tenant.id, reason })
      .then(onClose)
      .catch(() => setError('No se pudo suspender el tenant.'))
  }

  return (
    <Modal title={`Suspender ${tenant.company_name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p className="core-state-message">
          El negocio perderá acceso a todos sus endpoints hasta que se reactive. No se borra
          ningún dato.
        </p>
        <div>
          <label htmlFor="suspend-reason">Motivo</label>
          <textarea
            id="suspend-reason"
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
        <button type="submit" className="btn btn-danger" disabled={suspendTenant.isPending}>
          {suspendTenant.isPending ? 'Suspendiendo...' : 'Suspender tenant'}
        </button>
      </form>
    </Modal>
  )
}
