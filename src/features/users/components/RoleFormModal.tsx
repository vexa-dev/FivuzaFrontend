import { useState, type FormEvent } from 'react'
import { Modal } from '../../../shared/components/Modal'
import type { Role } from '../api'
import { useCreateRole, useUpdateRole } from '../hooks/useRoles'
import { toTwoDecimals } from '../../../shared/utils/decimals'

interface RoleFormModalProps {
  editingRole: Role | null
  onClose: () => void
  onCreated?: (role: Role) => void
}

export function RoleFormModal({ editingRole, onClose, onCreated }: RoleFormModalProps) {
  const [name, setName] = useState(editingRole?.name ?? '')
  const [description, setDescription] = useState(editingRole?.description ?? '')
  const [maxDiscount, setMaxDiscount] = useState(
    editingRole ? String(Number(editingRole.max_discount_percent)) : '0',
  )
  const [error, setError] = useState<string | null>(null)

  const createRole = useCreateRole()
  const updateRole = useUpdateRole()
  const isPending = createRole.isPending || updateRole.isPending

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError('El nombre del rol es requerido.')
      return
    }
    const discount = Number(maxDiscount.replace(',', '.'))
    if (maxDiscount.trim() === '' || !Number.isFinite(discount) || discount < 0 || discount > 100) {
      setError('El tope de descuento debe estar entre 0 y 100.')
      return
    }
    const max_discount_percent = discount.toFixed(2)

    if (editingRole) {
      updateRole
        .mutateAsync({ id: editingRole.id, data: { name, description, max_discount_percent } })
        .then(onClose)
        .catch(() => setError('No se pudo guardar el rol.'))
    } else {
      createRole
        .mutateAsync({ name, description, max_discount_percent })
        .then((role) => {
          onCreated?.(role)
          onClose()
        })
        .catch(() => setError('No se pudo crear el rol.'))
    }
  }

  return (
    <Modal title={editingRole ? 'Editar rol' : 'Nuevo rol'} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <label htmlFor="role-name">Nombre del rol</label>
          <input
            id="role-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ej. Cajero, Reponedor, Limpieza..."
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="role-description">Descripción (opcional)</label>
          <input
            id="role-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Ej. Atiende el mostrador y cobra las ventas"
          />
        </div>

        <div>
          <label htmlFor="role-max-discount">Descuento manual sin autorización (%)</label>
          <input
            id="role-max-discount"
            value={maxDiscount}
            onChange={(event) => setMaxDiscount(toTwoDecimals(event.target.value))}
            inputMode="decimal"
            style={{ maxWidth: 120 }}
          />
          <p className="core-page-subtitle" style={{ margin: '4px 0 0' }}>
            Por producto. Por encima de este tope, un supervisor autoriza con su clave. 0 = todo
            descuento se autoriza; 100 = sin tope.
          </p>
        </div>

        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn btn-primary" disabled={isPending}>
          {isPending ? 'Guardando...' : 'Guardar'}
        </button>
      </form>
    </Modal>
  )
}
