import { getAccessToken } from '../../features/auth/hooks/session'
import { ApiError } from '../utils/apiClient'
import { tenantApiFetch } from '../utils/tenantApiClient'

/** Operaciones que un supervisor puede autorizar desde el equipo del cajero
 * (Bloque C.1). */
export type AuthorizablePermission = 'SALES_VOID' | 'SALES_RETURN' | 'SALES_DISCOUNT'

export interface SupervisorAuthorizationInput {
  email: string
  password: string
  permission: AuthorizablePermission
  /** Venta a anular o devolver: la autorización no sirve para otra. */
  target_id?: number
  /** Mayor descuento por línea que se autoriza, en %. */
  discount_percent?: string
}

export interface SupervisorAuthorization {
  token: string
  permission: AuthorizablePermission
  expires_at: string
  authorized_by: number
  authorized_by_email: string
}

export function requestSupervisorAuthorization(data: SupervisorAuthorizationInput) {
  return tenantApiFetch<SupervisorAuthorization>('/usuarios/authorizations/', {
    method: 'POST',
    body: data,
    token: getAccessToken(),
  })
}

export function supervisorAuthorizationHeaders(
  token: string | undefined,
): Record<string, string> | undefined {
  return token ? { 'X-Supervisor-Authorization': token } : undefined
}

/** Lo que el backend pide cuando la operación necesita un supervisor. */
export interface AuthorizationRequirement {
  permission: AuthorizablePermission
  message: string
  requestedDiscountPercent?: string
  maxDiscountPercent?: string
}

interface RequiredErrorBody {
  error?: {
    code?: string
    message?: string
    permission?: AuthorizablePermission
    requested_discount_percent?: string
    max_discount_percent?: string
  }
}

export function authorizationRequirementFrom(error: unknown): AuthorizationRequirement | null {
  if (!(error instanceof ApiError) || error.status !== 403) return null
  const body = (error.body as RequiredErrorBody | null)?.error
  if (body?.code !== 'SUPERVISOR_AUTHORIZATION_REQUIRED' || !body.permission) return null
  return {
    permission: body.permission,
    message: body.message ?? 'Esta operación necesita la autorización de un supervisor.',
    requestedDiscountPercent: body.requested_discount_percent,
    maxDiscountPercent: body.max_discount_percent,
  }
}

/** Se rechaza con esto cuando el cajero cierra el modal sin autorizar: el
 * llamador lo ignora en vez de mostrarlo como error. */
export class AuthorizationCancelledError extends Error {
  constructor() {
    super('Autorización cancelada.')
    this.name = 'AuthorizationCancelledError'
  }
}
