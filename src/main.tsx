import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.tsx'

const sentryDsn = import.meta.env.VITE_SENTRY_DSN
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT ?? 'development',
    // dataCollection deshabilitado: mismo criterio de privacidad que el backend
    // (send_default_pii=False) -el sistema maneja datos de negocios/clientes
    // sujetos a la Ley N 29733 (TRD, seccion 6.2).
    dataCollection: {
      userInfo: false,
      httpBodies: [],
    },
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
