import { X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import './Modal.css'

const CLOSE_ANIMATION_MS = 160

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
}

export function Modal({ title, onClose, children }: ModalProps) {
  const [closing, setClosing] = useState(false)

  // El modal se desmontaba instantaneo al cerrar (solo tenia animacion de
  // entrada). Retrasamos el onClose real lo que dura la animacion de salida
  // en vez de cortar la tarjeta en seco -el llamador sigue viendo un
  // onClose() simple, sin saber que hay un delay de por medio.
  function requestClose() {
    setClosing(true)
    setTimeout(onClose, CLOSE_ANIMATION_MS)
  }

  return (
    <div className={`modal-overlay ${closing ? 'modal-overlay-closing' : ''}`} onClick={requestClose}>
      <div
        className={`modal-card card ${closing ? 'modal-card-closing' : ''}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button
            type="button"
            className="modal-close"
            onClick={requestClose}
            aria-label="Cerrar"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}
