import { X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import './Modal.css'

const CLOSE_ANIMATION_MS = 160

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  className?: string
  // 'lg' -para contenido que no entra en el ancho de formulario por
  // defecto (28rem), tipicamente una tabla con varias columnas (ej. las
  // variantes de un producto en ProductDetailModal); el resto de modales
  // (formularios de nombre/campos sueltos) se quedan con 'md'.
  size?: 'md' | 'lg' | 'xl'
}

export function Modal({ title, onClose, children, size = 'md', className = '' }: ModalProps) {
  const [closing, setClosing] = useState(false)
  const cardClassName = [
    'modal-card card',
    size === 'lg' ? 'modal-card-lg' : '',
    size === 'xl' ? 'modal-card-xl' : '',
    className,
    closing ? 'modal-card-closing' : '',
  ].filter(Boolean).join(' ')

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
        className={cardClassName}
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
