import type { ReactNode } from 'react'
import * as Sentry from '@sentry/react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { EmptyState } from './EmptyState'

interface RouteErrorBoundaryProps {
  children: ReactNode
}

/** Aisla un error de render al contenido de la ruta actual: el sidebar y la
 * topbar siguen vivos, asi un fallo en (por ejemplo) Reportes no deja en
 * blanco el POS. La key por pathname resetea el boundary al navegar a otra
 * pantalla. Sentry.ErrorBoundary reporta el error si Sentry esta activo y
 * funciona igual (solo renderiza el fallback) si no lo esta. */
export function RouteErrorBoundary({ children }: RouteErrorBoundaryProps) {
  const { pathname } = useLocation()
  return (
    <Sentry.ErrorBoundary
      key={pathname}
      fallback={({ resetError }) => (
        <div className="card" role="alert">
          <EmptyState
            icon={<AlertTriangle size={32} />}
            title="Algo salió mal al mostrar esta pantalla"
            subtitle="El resto del sistema sigue funcionando. Intenta de nuevo o cambia de sección."
          />
          <div className="route-error-actions">
            <button type="button" className="btn btn-primary" onClick={resetError}>
              <RotateCcw size={15} />
              Reintentar
            </button>
          </div>
        </div>
      )}
    >
      {children}
    </Sentry.ErrorBoundary>
  )
}
