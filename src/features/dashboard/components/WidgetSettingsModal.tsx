import { Modal } from '../../../shared/components/Modal'
import type { DashboardWidget } from '../api'
import {
  useCreateDashboardWidget,
  useDashboardWidgets,
  useUpdateDashboardWidget,
} from '../hooks/useDashboardWidgets'

const WIDGET_LABELS: Record<string, string> = {
  SALES_TODAY: 'Ventas de hoy',
  CASH_STATUS: 'Cajas abiertas',
  ATTENDANCE_TODAY: 'Asistencia de hoy',
}

// LOW_STOCK y TOP_PRODUCTS quedaron fuera -ahora se controlan desde el
// modal nuevo (DashboardCardsModal, boton junto a "En vivo") junto con el
// resto de las cards de la pagina; mantenerlos aca tambien duplicaria el
// control sobre la misma card en dos lugares distintos.
const WIDGET_CODES = Object.keys(WIDGET_LABELS) as DashboardWidget['widget_code'][]

interface WidgetSettingsModalProps {
  onClose: () => void
}

/** Personalización de widgets por usuario (Sprint 25, Convenciones §5.3):
 * si el usuario nunca tocó la configuración, todos los widgets se
 * consideran visibles por defecto -no existe una fila en la tabla hasta
 * que se oculta alguno por primera vez. */
export function WidgetSettingsModal({ onClose }: WidgetSettingsModalProps) {
  const { data: widgets } = useDashboardWidgets()
  const createWidget = useCreateDashboardWidget()
  const updateWidget = useUpdateDashboardWidget()

  const toggle = (code: DashboardWidget['widget_code'], position: number) => {
    const existing = widgets?.find((widget) => widget.widget_code === code)
    if (existing) {
      updateWidget.mutate({ id: existing.id, data: { is_visible: !existing.is_visible } })
    } else {
      createWidget.mutate({ widget_code: code, position, is_visible: false })
    }
  }

  return (
    <Modal title="Personalizar dashboard" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p className="core-page-subtitle" style={{ margin: 0 }}>
          Elige qué tarjetas se muestran en tu dashboard.
        </p>
        {WIDGET_CODES.map((code, index) => {
          const existing = widgets?.find((widget) => widget.widget_code === code)
          const isVisible = existing ? existing.is_visible : true
          return (
            <label
              key={code}
              style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
            >
              <input
                type="checkbox"
                checked={isVisible}
                onChange={() => toggle(code, index)}
              />
              {WIDGET_LABELS[code]}
            </label>
          )
        })}
      </div>
    </Modal>
  )
}
