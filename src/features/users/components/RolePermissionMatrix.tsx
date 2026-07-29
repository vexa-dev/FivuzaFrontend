import type { Role } from '../api'
import { usePermissions, useRolePermissions, useToggleRolePermission } from '../hooks/usePermissions'

export function RolePermissionMatrix({ roles }: { roles: Role[] }) {
  const { data: permissions } = usePermissions()
  const { data: rolePermissions } = useRolePermissions()
  const { grant, revoke } = useToggleRolePermission()

  const toggle = (roleId: number, permissionId: number) => {
    const existing = rolePermissions?.find(
      (item) => item.role === roleId && item.permission === permissionId,
    )
    if (existing) {
      revoke.mutate(existing.id)
    } else {
      grant.mutate({ role: roleId, permission: permissionId })
    }
  }

  if (!permissions || permissions.length === 0) {
    return <p className="core-state-message">Todavía no hay permisos en el catálogo.</p>
  }

  return (
    <div className="core-table-card card">
      <table className="core-table">
        <thead>
          <tr>
            <th>Permiso</th>
            {roles.map((role) => (
              <th key={role.id}>{role.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {permissions.map((permission) => (
            <tr key={permission.id}>
              <td className="core-table-strong">{permission.code}</td>
              {roles.map((role) => {
                const isGranted = rolePermissions?.some(
                  (item) => item.role === role.id && item.permission === permission.id,
                )
                return (
                  <td key={role.id}>
                    <input
                      type="checkbox"
                      checked={Boolean(isGranted)}
                      onChange={() => toggle(role.id, permission.id)}
                      style={{ width: 'auto' }}
                      aria-label={`${permission.code} para ${role.name}`}
                    />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
