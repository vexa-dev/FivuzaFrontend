import type { DashboardWidget } from '../api'
import { useDashboardWidgets } from './useDashboardWidgets'

/** Un widget es visible por defecto hasta que el usuario lo oculta
 * explícitamente -no existe fila en dashboard_widgets hasta ese momento
 * (Sprint 25). */
export function useWidgetVisibility() {
  const { data: widgets } = useDashboardWidgets()

  const isVisible = (code: DashboardWidget['widget_code']) => {
    const existing = widgets?.find((widget) => widget.widget_code === code)
    return existing ? existing.is_visible : true
  }

  return { isVisible }
}
