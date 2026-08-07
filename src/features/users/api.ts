import { getAccessToken } from '../auth/hooks/session'
import { tenantApiFetch } from '../../shared/utils/tenantApiClient'

export interface Role {
  id: number
  name: string
  is_system_default: boolean
  description: string
}

export interface Permission {
  id: number
  code: string
  module: string
  description: string
}

export interface RolePermission {
  id: number
  role: number
  permission: number
}

export interface TenantUserRecord {
  id: number
  email: string
  role: number
  is_active: boolean
  last_login: string | null
  created_at: string
}

export interface UserPermissionOverride {
  id: number
  user: number
  permission: number
  is_granted: boolean
}

function authed<T>(path: string, init: Parameters<typeof tenantApiFetch>[1] = {}) {
  return tenantApiFetch<T>(path, { ...init, token: getAccessToken() })
}

export const fetchUsers = () => authed<TenantUserRecord[]>('/usuarios/users/')

export const createUser = (data: { email: string; role: number; password: string }) =>
  authed<TenantUserRecord>('/usuarios/users/', { method: 'POST', body: data })

export const updateUser = (
  id: number,
  data: Partial<{ email: string; role: number; is_active: boolean; password: string }>,
) => authed<TenantUserRecord>(`/usuarios/users/${id}/`, { method: 'PATCH', body: data })

export const deleteUser = (id: number) =>
  authed<void>(`/usuarios/users/${id}/`, { method: 'DELETE' })

export const fetchRoles = () => authed<Role[]>('/usuarios/roles/')

export const createRole = (data: { name: string; description?: string }) =>
  authed<Role>('/usuarios/roles/', { method: 'POST', body: data })

export const updateRole = (id: number, data: Partial<{ name: string; description: string }>) =>
  authed<Role>(`/usuarios/roles/${id}/`, { method: 'PATCH', body: data })

export const deleteRole = (id: number) =>
  authed<void>(`/usuarios/roles/${id}/`, { method: 'DELETE' })

export const fetchPermissions = () => authed<Permission[]>('/usuarios/permissions/')

export const fetchRolePermissions = () =>
  authed<RolePermission[]>('/usuarios/role-permissions/')

export const grantRolePermission = (role: number, permission: number) =>
  authed<RolePermission>('/usuarios/role-permissions/', {
    method: 'POST',
    body: { role, permission },
  })

export const revokeRolePermission = (rolePermissionId: number) =>
  authed<void>(`/usuarios/role-permissions/${rolePermissionId}/`, { method: 'DELETE' })

export const fetchUserPermissionOverrides = () =>
  authed<UserPermissionOverride[]>('/usuarios/user-permissions/')

export const setUserPermissionOverride = (
  user: number,
  permission: number,
  isGranted: boolean,
) =>
  authed<UserPermissionOverride>('/usuarios/user-permissions/', {
    method: 'POST',
    body: { user, permission, is_granted: isGranted },
  })

export const removeUserPermissionOverride = (overrideId: number) =>
  authed<void>(`/usuarios/user-permissions/${overrideId}/`, { method: 'DELETE' })
