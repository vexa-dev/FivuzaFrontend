import { useState } from 'react'
import '../core/CorePage.css'
import { RolePermissionMatrix } from './components/RolePermissionMatrix'
import { UserFormModal } from './components/UserFormModal'
import { UserOverridesModal } from './components/UserOverridesModal'
import type { TenantUserRecord } from './api'
import { useRoles } from './hooks/useRoles'
import { useDeleteUser, useUsers } from './hooks/useUsers'

type Tab = 'usuarios' | 'roles'

export function UsersPage() {
  const [tab, setTab] = useState<Tab>('usuarios')
  const { data: users, isLoading, error } = useUsers()
  const { data: roles } = useRoles()
  const deleteUser = useDeleteUser()

  const [editingUser, setEditingUser] = useState<TenantUserRecord | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [overridesFor, setOverridesFor] = useState<TenantUserRecord | null>(null)

  const roleName = (roleId: number) => roles?.find((role) => role.id === roleId)?.name ?? '—'

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="core-page-title">Usuarios y roles</h1>
          <p className="core-page-subtitle">Gestiona quién accede al sistema y qué puede hacer</p>
        </div>
        {tab === 'usuarios' && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setEditingUser(null)
              setShowForm(true)
            }}
          >
            + Nuevo usuario
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button
          type="button"
          className={tab === 'usuarios' ? 'btn btn-primary' : 'btn btn-ghost'}
          onClick={() => setTab('usuarios')}
        >
          Usuarios
        </button>
        <button
          type="button"
          className={tab === 'roles' ? 'btn btn-primary' : 'btn btn-ghost'}
          onClick={() => setTab('roles')}
        >
          Roles y permisos
        </button>
      </div>

      {tab === 'usuarios' && (
        <div className="card core-table-card">
          {isLoading && <p className="core-state-message">Cargando...</p>}
          {error && (
            <p className="core-state-message" role="alert">
              No se pudieron cargar los usuarios.
            </p>
          )}
          {users && (
            <table className="core-table">
              <thead>
                <tr>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Último ingreso</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="core-table-strong">{user.email}</td>
                    <td>{roleName(user.role)}</td>
                    <td>
                      <span className={`badge ${user.is_active ? 'badge-success' : 'badge-neutral'}`}>
                        <span className="dot" />
                        {user.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>{user.last_login ?? 'Nunca'}</td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => {
                          setEditingUser(user)
                          setShowForm(true)
                        }}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => setOverridesFor(user)}
                      >
                        Permisos
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => {
                          if (confirm(`¿Dar de baja a ${user.email}?`)) {
                            deleteUser.mutate(user.id)
                          }
                        }}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'roles' && <RolePermissionMatrix roles={roles ?? []} />}

      {showForm && (
        <UserFormModal
          roles={roles ?? []}
          editingUser={editingUser}
          onClose={() => setShowForm(false)}
        />
      )}

      {overridesFor && (
        <UserOverridesModal user={overridesFor} onClose={() => setOverridesFor(null)} />
      )}
    </div>
  )
}
