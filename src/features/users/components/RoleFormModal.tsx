import { useState, type FormEvent } from 'react'
import { Modal } from '../../../shared/components/Modal'
import type { Role } from '../api'
import { useCreateRole, useUpdateRole } from '../hooks/useRoles'

interface RoleFormModalProps {
  editingRole: Role | null
  onClose: () => void
  onCreated?: (role: Role) => void
}

export function RoleFormModal({ editingRole, onClose, onCreated }: RoleFormModalProps) {
  const [name, setName] = useState(editingRole?.name ?? '')
  const [description, setDescription] = useState(editingRole?.description ?? '')
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

    if (editingRole) {
      updateRole
        .mutateAsync({ id: editingRole.id, data: { name, description } })
        .then(onClose)
        .catch(() => setError('No se pudo guardar el rol.'))
    } else {
      createRole
        .mutateAsync({ name, description })
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
