import { tenantApiFetch } from '../../shared/utils/tenantApiClient'
import { getAccessToken } from '../auth/hooks/session'
import type { SalePaymentMethod } from '../sales/api'

/** Interruptores operativos que el propio negocio edita (Bloque A.0). Los
 * de plan y facturación siguen siendo del panel interno de Fivuza y no se
 * exponen por este endpoint. */
export interface TenantOperationalSettings {
  cashier_can_open_session: boolean
  cashier_can_close_session: boolean
  // Bloque D.3: método preseleccionado al abrir el cobro en el POS.
  default_payment_method: SalePaymentMethod
  updated_at: string
}

export function fetchTenantSettings() {
  return tenantApiFetch<TenantOperationalSettings>('/usuarios/settings/', {
    token: getAccessToken(),
  })
}

export function updateTenantSettings(data: Partial<Omit<TenantOperationalSettings, 'updated_at'>>) {
  return tenantApiFetch<TenantOperationalSettings>('/usuarios/settings/', {
    method: 'PATCH',
    body: data,
    token: getAccessToken(),
  })
}
