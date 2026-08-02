import { useState } from 'react'
import { Modal } from '../../../shared/components/Modal'
import type { Tenant } from '../api'
import { useReactivateTenant } from '../hooks/useTenantLifecycle'

interface ReactivateTenantModalProps {
  tenant: Tenant
  onClose: () => void
}

export function ReactivateTenantModal({ tenant, onClose }: ReactivateTenantModalProps) {
  const [error, setError] = useState<string | null>(null)
  const reactivateTenant = useReactivateTenant()

  const handleConfirm = () => {
    setError(null)
    reactivateTenant
      .mutateAsync(tenant.id)
      .then(onClose)
      .catch(() => setError('No se pudo reactivar el tenant.'))
  }

  return (
    <Modal title={`Reactivar ${tenant.company_name}`} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p className="core-state-message">
          El negocio recuperará acceso a exactamente lo mismo que tenía antes de suspenderse.
        </p>
        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleConfirm}
          disabled={reactivateTenant.isPending}
        >
          {reactivateTenant.isPending ? 'Reactivando...' : 'Reactivar tenant'}
        </button>
      </div>
    </Modal>
  )
}
