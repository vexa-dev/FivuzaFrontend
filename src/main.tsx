import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import './theme/fonts.css'
import './theme/theme.css'
import './shared/styles/components.css'
import './index.css'
import App from './App.tsx'
import { ToastProvider } from './shared/components/ToastProvider.tsx'
import { ThemeProvider } from './theme/ThemeContext.tsx'
import { BrandThemeProvider } from './theme/BrandThemeContext.tsx'

const queryClient = new QueryClient()

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

// Solo en produccion (Sprint 20): en dev el service worker pelea con el
// HMR de Vite -cachea respuestas que HMR espera frescas- sin aportar nada,
// ya que el objetivo (POS instalable/usable offline) es de la build real.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <BrandThemeProvider>
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <ToastProvider>
              <App />
            </ToastProvider>
          </QueryClientProvider>
        </BrowserRouter>
      </BrandThemeProvider>
    </ThemeProvider>
  </StrictMode>,
)
