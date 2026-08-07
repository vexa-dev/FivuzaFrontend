import { KeyRound, Pencil, Plus, Trash2, UsersRound } from 'lucide-react'
import { useState, type CSSProperties } from 'react'
import '../core/CorePage.css'
import { EmptyState } from '../../shared/components/EmptyState'
import { AnimatedTabs } from './components/AnimatedTabs'
import { RolesManager } from './components/RolesManager'
import { UserAvatar } from './components/UserAvatar'
import { UserFormModal } from './components/UserFormModal'
import { UserOverridesModal } from './components/UserOverridesModal'
import { UsersTableSkeleton } from './components/UsersTableSkeleton'
import type { TenantUserRecord } from './api'
import { useRoles } from './hooks/useRoles'
import { useDeleteUser, useUsers } from './hooks/useUsers'
import './UsersPage.css'

type Tab = 'usuarios' | 'roles'

const TAB_OPTIONS: [Tab, string][] = [
  ['usuarios', 'Usuarios'],
  ['roles', 'Roles y permisos'],
]

export function UsersPage() {
  const [tab, setTab] = useState<Tab>('usuarios')
  const { data: users, isLoading, error } = useUsers()
  const { data: roles } = useRoles()
  const deleteUser = useDeleteUser()

  const [editingUser, setEditingUser] = useState<TenantUserRecord | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [overridesFor, setOverridesFor] = useState<TenantUserRecord | null>(null)

  const roleName = (roleId: number) => roles?.find((role) => role.id === roleId)?.name ?? '—'

  const formatDate = (value: string | null) =>
    value
      ? new Date(value).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })
      : 'Nunca'

  return (
    <div>
      <div className="page-header">
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
            <Plus size={15} strokeWidth={2.5} />
            Nuevo usuario
          </button>
        )}
      </div>

      <AnimatedTabs value={tab} onChange={setTab} options={TAB_OPTIONS} />

      {tab === 'usuarios' && (
        <div className="card core-table-card">
          {isLoading && <UsersTableSkeleton />}
          {error && (
            <p className="core-state-message" role="alert">
              No se pudieron cargar los usuarios.
            </p>
          )}
          {users && users.length === 0 && (
            <EmptyState icon={<UsersRound />} title="Todavía no hay usuarios" />
          )}
          {users && users.length > 0 && (
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
                {users.map((user, index) => (
                  <tr
                    key={user.id}
                    className="user-row"
                    style={{ '--row-index': index } as CSSProperties}
                  >
                    <td>
                      <div className="user-row-cell">
                        <UserAvatar email={user.email} seed={user.id} />
                        <span className="core-table-strong">{user.email}</span>
                      </div>
                    </td>
                    <td>{roleName(user.role)}</td>
                    <td>
                      <span className={`badge ${user.is_active ? 'badge-success' : 'badge-neutral'}`}>
                        <span className="dot" />
                        {user.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>{formatDate(user.last_login)}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm btn-icon"
                          aria-label={`Editar ${user.email}`}
                          onClick={() => {
                            setEditingUser(user)
                            setShowForm(true)
                          }}
                        >
                          <Pencil />
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm btn-icon"
                          aria-label={`Permisos de ${user.email}`}
                          onClick={() => setOverridesFor(user)}
                        >
                          <KeyRound />
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger-ghost btn-sm btn-icon"
                          aria-label={`Eliminar ${user.email}`}
                          onClick={() => {
                            if (confirm(`¿Dar de baja a ${user.email}?`)) {
                              deleteUser.mutate(user.id)
                            }
                          }}
                        >
                          <Trash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'roles' && <RolesManager roles={roles ?? []} />}

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
