import { AlertCircle, CheckCircle2, X } from 'lucide-react'
import { createContext, useCallback, useContext, useRef, useState } from 'react'
import './ToastProvider.css'

type ToastTone = 'error' | 'success'

interface Toast {
  id: number
  tone: ToastTone
  message: string
}

interface ToastContextValue {
  showToast: (tone: ToastTone, message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const AUTO_DISMISS_MS = 5000

/** Revision general del proyecto (auditoria de frontend): ~47 mutaciones
 * useMutation no tenian ningun onError -acciones destructivas (eliminar,
 * congelar membresia, desactivar) fallaban en silencio, el boton solo
 * dejaba de girar sin ningun aviso. En vez de duplicar estado de error
 * inline en cada componente, un toast global centraliza el feedback -las
 * mutaciones solo llaman showToast('error', mensaje) en su onError. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)

  const showToast = useCallback((tone: ToastTone, message: string) => {
    const id = nextId.current++
    setToasts((current) => [...current, { id, tone, message }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, AUTO_DISMISS_MS)
  }, [])

  const dismiss = (id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-stack" role="region" aria-label="Notificaciones">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.tone}`} role="alert">
            {toast.tone === 'error' ? (
              <AlertCircle size={18} strokeWidth={2} />
            ) : (
              <CheckCircle2 size={18} strokeWidth={2} />
            )}
            <span className="toast-message">{toast.message}</span>
            <button
              type="button"
              className="toast-close"
              aria-label="Cerrar notificacion"
              onClick={() => dismiss(toast.id)}
            >
              <X size={14} strokeWidth={2} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast debe usarse dentro de <ToastProvider>')
  }
  return context
}
