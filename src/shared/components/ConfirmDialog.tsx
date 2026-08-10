import { AlertTriangle } from 'lucide-react'
import { Modal } from './Modal'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'primary'
  onConfirm: () => void
  onClose: () => void
}

/** Reemplaza el confirm() nativo del navegador -un dialogo de sistema sin
 * estilo (sin dark mode, tipografia del SO) sonaba fuera de lugar al lado
 * de una UI completamente tematizada. Mismo Modal que ya usa el resto de
 * la app, con la accion destructiva en .btn-danger (solido, no ghost:
 * "eliminar" es una decision, no una accion secundaria mas). */
export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'danger',
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal title={title} onClose={onClose}>
      <div className="confirm-dialog">
        {tone === 'danger' && (
          <div className="confirm-dialog-icon">
            <AlertTriangle size={20} strokeWidth={2} />
          </div>
        )}
        <p className="confirm-dialog-message">{message}</p>
        <div className="confirm-dialog-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn ${tone === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
