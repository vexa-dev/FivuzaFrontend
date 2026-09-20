import { Wallet } from 'lucide-react'
import { getErrorMessage } from '../../../shared/utils/errorMessage'
import { useTenantSettings, useUpdateTenantSettings } from '../hooks/useTenantSettings'

/** Bloque A.0: el dueño decide desde el ERP si su cajero abre y cierra su
 * propia caja. Antes estos interruptores solo se tocaban desde el panel
 * interno de Fivuza. */
export function CashPolicySection() {
  const { data: settings, isLoading, error } = useTenantSettings()
  const updateSettings = useUpdateTenantSettings()

  const toggle = (field: 'cashier_can_open_session' | 'cashier_can_close_session') => {
    if (!settings) return
    updateSettings.mutate({ [field]: !settings[field] })
  }

  return (
    <div className="card settings-section">
      <h2 className="settings-section-title">
        <Wallet size={15} strokeWidth={2} style={{ verticalAlign: -2, marginRight: 6 }} />
        Caja
      </h2>
      <p className="settings-section-desc">
        Define qué puede hacer tu cajero con su caja. Si los dejas apagados, solo tú y tus
        supervisores abren y cierran caja.
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
              <p className="settings-toggle-label">El cajero puede abrir su caja</p>
              <p className="settings-toggle-desc">
                Permite que quien vende abra el turno sin esperar a un supervisor.
              </p>
            </div>
            <button
              type="button"
              className="theme-switch"
              aria-pressed={settings.cashier_can_open_session}
              aria-label="El cajero puede abrir su caja"
              disabled={updateSettings.isPending}
              onClick={() => toggle('cashier_can_open_session')}
            >
              <span className="theme-switch-thumb" />
            </button>
          </div>

          <div className="settings-toggle-row">
            <div>
              <p className="settings-toggle-label">El cajero puede cerrar su caja</p>
              <p className="settings-toggle-desc">
                Cuenta el efectivo y cierra su turno. No verá el monto esperado ni la diferencia:
                eso queda para quien controla la caja.
              </p>
            </div>
            <button
              type="button"
              className="theme-switch"
              aria-pressed={settings.cashier_can_close_session}
              aria-label="El cajero puede cerrar su caja"
              disabled={updateSettings.isPending}
              onClick={() => toggle('cashier_can_close_session')}
            >
              <span className="theme-switch-thumb" />
            </button>
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
