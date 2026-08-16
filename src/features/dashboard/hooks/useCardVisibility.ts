import { useSyncExternalStore } from 'react'

export type DashboardCardId =
  | 'salesByDay'
  | 'paymentMethods'
  | 'pending'
  | 'topProducts'
  | 'lowStock'
  | 'activity'
  | 'inventory'
  | 'salesExtra'
  | 'customers'
  | 'hr'
  | 'gym'

interface CardDef {
  id: DashboardCardId
  label: string
  group: 'General' | 'Por módulo'
}

// Catalogo de TODAS las cards/secciones que se pueden ocultar -Resumen y
// el hero de Ventas del mes quedan fuera a proposito (son el ancla fija de
// la pantalla, ocultarlos dejaria el dashboard sin ningun numero arriba).
export const DASHBOARD_CARD_DEFS: CardDef[] = [
  { id: 'salesByDay', label: 'Ventas por día', group: 'General' },
  { id: 'paymentMethods', label: 'Métodos de pago', group: 'General' },
  { id: 'pending', label: 'Pendientes', group: 'General' },
  { id: 'topProducts', label: 'Productos más vendidos', group: 'General' },
  { id: 'lowStock', label: 'Stock crítico', group: 'General' },
  { id: 'activity', label: 'Actividad reciente', group: 'General' },
  { id: 'inventory', label: 'Inventario', group: 'Por módulo' },
  { id: 'salesExtra', label: 'Ventas y caja', group: 'Por módulo' },
  { id: 'customers', label: 'Clientes', group: 'Por módulo' },
  { id: 'hr', label: 'RRHH', group: 'Por módulo' },
  { id: 'gym', label: 'Gimnasio', group: 'Por módulo' },
]

const STORAGE_KEY = 'fivuza-dashboard-cards'

function readStored(): Partial<Record<DashboardCardId, boolean>> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

// Store a nivel de modulo (no useState local) -DashboardPage y
// DashboardCardsModal montan el hook por separado; con useState comun cada
// uno tenia su propia copia y el toggle del modal nunca se reflejaba en la
// pagina de atras hasta recargar. useSyncExternalStore los mantiene a los
// dos leyendo el mismo objeto y re-renderiza a ambos en cada cambio.
let hidden: Partial<Record<DashboardCardId, boolean>> = readStored()
const listeners = new Set<() => void>()

function setHidden(next: Partial<Record<DashboardCardId, boolean>>) {
  hidden = next
  localStorage.setItem(STORAGE_KEY, JSON.stringify(hidden))
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Que cards del dashboard se muestran, por usuario/navegador -a diferencia
 * de useWidgetVisibility (filas sueltas dentro de la card "Resumen",
 * persistidas en el backend), esto controla cards y secciones ENTERAS y
 * vive solo en localStorage: es una preferencia de "que tan denso quiero
 * ver mi pantalla", no un dato de negocio que valga la pena sincronizar
 * entre dispositivos. Todo visible por defecto hasta que el usuario oculta
 * algo por primera vez, mismo criterio que el sistema existente. */
export function useCardVisibility() {
  const snapshot = useSyncExternalStore(subscribe, () => hidden)

  const isCardVisible = (id: DashboardCardId) => snapshot[id] !== true

  const toggleCard = (id: DashboardCardId) => {
    setHidden({ ...snapshot, [id]: snapshot[id] !== true })
  }

  const showAll = () => setHidden({})

  const hideAll = () => {
    setHidden(Object.fromEntries(DASHBOARD_CARD_DEFS.map((card) => [card.id, true])))
  }

  return { isCardVisible, toggleCard, showAll, hideAll }
}
