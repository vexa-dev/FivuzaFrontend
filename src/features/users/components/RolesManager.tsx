import {
  BarChart3,
  Briefcase,
  Package,
  Pencil,
  Plus,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  UsersRound,
  Wallet,
} from 'lucide-react'
import { useEffect, useState, type ComponentType } from 'react'
import { ApiError } from '../../../shared/utils/apiClient'
import type { Permission, Role } from '../api'
import { usePermissions, useRolePermissions, useToggleRolePermission } from '../hooks/usePermissions'
import { useDeleteRole } from '../hooks/useRoles'
import { permissionLabel } from '../permissionLabels'
import { PermissionToggle } from './PermissionToggle'
import { RoleFormModal } from './RoleFormModal'
import './RolesManager.css'

const MODULE_LABELS: Record<string, string> = {
  USERS: 'Usuarios',
  INVENTORY: 'Inventario',
  PURCHASES: 'Compras',
  SALES: 'Ventas',
  CASH: 'Caja',
  HR: 'Recursos humanos',
  REPORTS: 'Reportes',
  GYM: 'Gimnasio',
  COMPLIANCE: 'Cumplimiento y datos',
}

const MODULE_ICONS: Record<string, ComponentType<{ size?: number }>> = {
  USERS: UsersRound,
  INVENTORY: Package,
  PURCHASES: ShoppingBag,
  SALES: ShoppingCart,
  CASH: Wallet,
  HR: Briefcase,
  REPORTS: BarChart3,
}

function groupByModule(permissions: Permission[]): [string, Permission[]][] {
  const groups = new Map<string, Permission[]>()
  for (const permission of permissions) {
    const list = groups.get(permission.module) ?? []
    list.push(permission)
    groups.set(permission.module, list)
  }
  return [...groups.entries()]
}

export function RolesManager({ roles }: { roles: Role[] }) {
  const { data: permissions } = usePermissions()
  const { data: rolePermissions } = useRolePermissions()
  const { grant, revoke } = useToggleRolePermission()
  const deleteRole = useDeleteRole()

  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
  const [showRoleForm, setShowRoleForm] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    if (selectedRoleId === null && roles.length > 0) {
      setSelectedRoleId(roles[0].id)
    }
  }, [roles, selectedRoleId])

  const selectedRole = roles.find((role) => role.id === selectedRoleId) ?? null

  const permissionCount = (roleId: number) =>
    rolePermissions?.filter((item) => item.role === roleId).length ?? 0

  const toggle = (permissionId: number) => {
    if (!selectedRole) return
    const existing = rolePermissions?.find(
      (item) => item.role === selectedRole.id && item.permission === permissionId,
    )
    if (existing) {
      revoke.mutate(existing.id)
    } else {
      grant.mutate({ role: selectedRole.id, permission: permissionId })
    }
  }

  const handleDelete = (role: Role) => {
    if (!confirm(`¿Eliminar el rol "${role.name}"? Los usuarios con este rol deben reasignarse antes.`)) {
      return
    }
    setDeleteError(null)
    deleteRole.mutate(role.id, {
      onSuccess: () => {
        if (selectedRoleId === role.id) setSelectedRoleId(null)
      },
      onError: (err: unknown) => {
        const body = err instanceof ApiError ? (err.body as { error?: { message?: string } }) : null
        setDeleteError(body?.error?.message ?? 'No se pudo eliminar el rol.')
      },
    })
  }

  const groups = permissions ? groupByModule(permissions) : []

  return (
    <div className="roles-manager">
      <div className="card roles-list-panel">
        <div className="roles-list-header">
          <span className="permission-group-title">Roles</span>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              setEditingRole(null)
              setShowRoleForm(true)
            }}
          >
            <Plus size={14} strokeWidth={2.5} />
            Nuevo rol
          </button>
        </div>

        {deleteError && (
          <p className="login-error" role="alert" style={{ padding: '0 16px' }}>
            {deleteError}
          </p>
        )}

        <div className="roles-list">
          {roles.map((role) => (
            <button
              key={role.id}
              type="button"
              className={`role-list-item ${selectedRoleId === role.id ? 'role-list-item-active' : ''}`}
              onClick={() => setSelectedRoleId(role.id)}
            >
              <div className="role-list-item-main">
                <span className="role-list-item-name">{role.name}</span>
                {role.is_system_default && (
                  <span className="badge badge-neutral role-list-item-badge">
                    <ShieldCheck size={11} strokeWidth={2.5} />
                    Predeterminado
                  </span>
                )}
              </div>
              <span className="role-list-item-desc">
                {role.description || `${permissionCount(role.id)} permisos activos`}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="card roles-detail-panel">
        {!selectedRole && (
          <p className="core-state-message">Selecciona un rol para ver y editar sus permisos.</p>
        )}

        {selectedRole && (
          <>
            <div className="roles-detail-header">
              <div>
                <h2 className="permission-group-title" style={{ fontSize: '1rem' }}>
                  {selectedRole.name}
                </h2>
                <p className="core-state-message" style={{ margin: '2px 0 0', padding: 0 }}>
                  {selectedRole.description || 'Sin descripción'}
                </p>
              </div>
              <div className="row-actions">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm btn-icon"
                  aria-label={`Editar ${selectedRole.name}`}
                  onClick={() => {
                    setEditingRole(selectedRole)
                    setShowRoleForm(true)
                  }}
                >
                  <Pencil />
                </button>
                {!selectedRole.is_system_default && (
                  <button
                    type="button"
                    className="btn btn-danger-ghost btn-sm btn-icon"
                    aria-label={`Eliminar ${selectedRole.name}`}
                    onClick={() => handleDelete(selectedRole)}
                  >
                    <Trash2 />
                  </button>
                )}
              </div>
            </div>

            <p className="roles-detail-hint">
              Activa lo que <strong>{selectedRole.name}</strong> puede hacer en el sistema.
            </p>

            <div className="roles-permission-list">
              {groups.map(([module, modulePermissions]) => {
                const Icon = MODULE_ICONS[module] ?? Package
                return (
                  <div className="permission-simple-group" key={module}>
                    <div className="permission-simple-group-header">
                      <Icon size={15} />
                      <span>{MODULE_LABELS[module] ?? module}</span>
                    </div>
                    {modulePermissions.map((permission) => {
                      const isGranted = rolePermissions?.some(
                        (item) => item.role === selectedRole.id && item.permission === permission.id,
                      )
                      return (
                        <label key={permission.id} className="permission-simple-row">
                          <span>{permissionLabel(permission.code)}</span>
                          <PermissionToggle
                            checked={Boolean(isGranted)}
                            onChange={() => toggle(permission.id)}
                            label={`${permissionLabel(permission.code)} para ${selectedRole.name}`}
                          />
                        </label>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {showRoleForm && (
        <RoleFormModal
          editingRole={editingRole}
          onClose={() => setShowRoleForm(false)}
          onCreated={(role) => setSelectedRoleId(role.id)}
        />
      )}
    </div>
  )
}
