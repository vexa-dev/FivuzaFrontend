import { CreditCard } from 'lucide-react'
import { PAYMENT_METHODS } from '../../sales/cart/paymentMethods'
import type { SalePaymentMethod } from '../../sales/api'
import { getErrorMessage } from '../../../shared/utils/errorMessage'
import { useTenantSettings, useUpdateTenantSettings } from '../hooks/useTenantSettings'

/** Bloque D.3: método preseleccionado al abrir el cobro en el POS -mismo
 * patrón de auto-guardado por campo que CashPolicySection. */
export function PaymentPolicySection() {
  const { data: settings, isLoading, error } = useTenantSettings()
  const updateSettings = useUpdateTenantSettings()

  return (
    <div className="card settings-section">
      <h2 className="settings-section-title">
        <CreditCard size={15} strokeWidth={2} style={{ verticalAlign: -2, marginRight: 6 }} />
        Cobro
      </h2>
      <p className="settings-section-desc">
        El método que viene preseleccionado al abrir el cobro en el punto de venta.
      </p>

      {isLoading && (
        <div className="loading-row">
          <span className="spinner" />
          Cargando...
        </div>
      )}

      {error && (
        <p className="login-error" role="alert">
          {getErrorMessage(error, 'No se pudo cargar la configuración.')}
        </p>
      )}

      {settings && (
        <>
          <div className="settings-toggle-row">
            <div>
              <p className="settings-toggle-label">Método de cobro por defecto</p>
              <p className="settings-toggle-desc">
                El cajero puede cambiarlo en cada venta; esto solo define con qué arranca.
              </p>
            </div>
            <select
              aria-label="Método de cobro por defecto"
              value={settings.default_payment_method}
              disabled={updateSettings.isPending}
              onChange={(event) =>
                updateSettings.mutate({
                  default_payment_method: event.target.value as SalePaymentMethod,
                })
              }
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          {updateSettings.isError && (
            <p className="login-error" role="alert">
              {getErrorMessage(updateSettings.error, 'No se pudo guardar el cambio.')}
            </p>
          )}
        </>
      )}
    </div>
  )
}
