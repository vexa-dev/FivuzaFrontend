import { useState, type FormEvent } from 'react'
import { Modal } from '../../../shared/components/Modal'
import type { Role, TenantUserRecord } from '../api'
import type { Warehouse } from '../../inventory/api'
import { useCreateUser, useUpdateUser } from '../hooks/useUsers'

interface UserFormModalProps {
  roles: Role[]
  editingUser: TenantUserRecord | null
  onClose: () => void
  warehouses: Warehouse[]
}

export function UserFormModal({ roles, editingUser, onClose, warehouses }: UserFormModalProps) {
  const [email, setEmail] = useState(editingUser?.email ?? '')
  const [roleId, setRoleId] = useState<number | ''>(editingUser?.role ?? roles[0]?.id ?? '')
  const [password, setPassword] = useState('')
  const [warehouseIds, setWarehouseIds] = useState<number[]>(editingUser?.warehouse_ids ?? [])
  const [error, setError] = useState<string | null>(null)

  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const isPending = createUser.isPending || updateUser.isPending
  const selectedRole = roles.find((role) => role.id === roleId)
  const isAdmin = Boolean(
    selectedRole?.is_system_default && selectedRole.name.toLowerCase() === 'admin',
  )
  const wasAdmin = Boolean(
    editingUser &&
      roles.find((role) => role.id === editingUser.role)?.is_system_default &&
      roles.find((role) => role.id === editingUser.role)?.name.toLowerCase() === 'admin',
  )

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!email || !roleId) {
      setError('Correo y rol son requeridos.')
      return
    }
    if (!editingUser && !password) {
      setError('La contraseña es requerida para un usuario nuevo.')
      return
    }
    if (editingUser && wasAdmin && !isAdmin && warehouseIds.length === 0) {
      setError('Asigna al menos un almacén al cambiar el rol administrador.')
      return
    }

    const action = editingUser
      ? updateUser.mutateAsync({
          id: editingUser.id,
          data: {
            email,
            role: roleId,
            warehouse_ids: isAdmin ? [] : warehouseIds,
            ...(password ? { password } : {}),
          },
        })
      : createUser.mutateAsync({
          email,
          role: roleId,
          password,
          warehouse_ids: isAdmin ? [] : warehouseIds,
        })

    action.then(onClose).catch(() => setError('No se pudo guardar el usuario.'))
  }

  return (
    <Modal title={editingUser ? 'Editar usuario' : 'Nuevo usuario'} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <label htmlFor="user-email">Correo</label>
          <input
            id="user-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="off"
          />
        </div>

        <fieldset className="user-warehouse-fieldset">
          <legend>Acceso por almacén</legend>
          {isAdmin ? (
            <p className="user-warehouse-admin">Acceso a todos los almacenes</p>
          ) : (
            <>
              <div className="user-warehouse-options">
                {warehouses.map((warehouse) => (
                  <label key={warehouse.id} className="user-warehouse-option">
                    <input
                      type="checkbox"
                      checked={warehouseIds.includes(warehouse.id)}
                      onChange={(event) =>
                        setWarehouseIds((current) =>
                          event.target.checked
                            ? [...current, warehouse.id]
                            : current.filter((id) => id !== warehouse.id),
                        )
                      }
                    />
                    <span>{warehouse.name}</span>
                  </label>
                ))}
              </div>
              {warehouseIds.length === 0 && (
                <p className="user-warehouse-warning">
                  Sin almacenes asignados, este usuario no podrá operar inventario, caja ni ventas.
                </p>
              )}
            </>
          )}
        </fieldset>

        <div>
          <label htmlFor="user-role">Rol</label>
          <select
            id="user-role"
            value={roleId}
            onChange={(event) => setRoleId(Number(event.target.value))}
          >
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="user-password">
            Contraseña {editingUser && '(dejar vacío para no cambiarla)'}
          </label>
          <input
            id="user-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
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
