import { Eye, EyeOff } from 'lucide-react'
import { Modal } from '../../../shared/components/Modal'
import { DASHBOARD_CARD_DEFS, useCardVisibility } from '../hooks/useCardVisibility'
import './DashboardCardsModal.css'

interface DashboardCardsModalProps {
  onClose: () => void
}

/** Modal de "que cards ver" -pedido explicito: rapido de escanear, sin
 * tener que leer cada fila para saber su estado. Agrupado por General/Por
 * modulo (mismo criterio que las secciones de la pagina) con switches en
 * vez de checkboxes -un switch "se lee" prendido/apagado de un vistazo,
 * un checkbox pide fijarse si el tick esta o no. */
export function DashboardCardsModal({ onClose }: DashboardCardsModalProps) {
  const { isCardVisible, toggleCard, showAll, hideAll } = useCardVisibility()

  const groups = ['General', 'Por módulo'] as const
  const visibleCount = DASHBOARD_CARD_DEFS.filter((card) => isCardVisible(card.id)).length

  return (
    <Modal title="Cards del dashboard" onClose={onClose}>
      <div className="dashboard-cards-modal">
        <div className="dashboard-cards-modal-toolbar">
          <span className="dashboard-cards-modal-count">
            {visibleCount} de {DASHBOARD_CARD_DEFS.length} visibles
          </span>
          <div className="dashboard-cards-modal-actions">
            <button type="button" className="dashboard-cards-modal-action" onClick={showAll}>
              <Eye size={13} strokeWidth={2} />
              Mostrar todo
            </button>
            <button type="button" className="dashboard-cards-modal-action" onClick={hideAll}>
              <EyeOff size={13} strokeWidth={2} />
              Ocultar todo
            </button>
          </div>
        </div>

        {groups.map((group) => (
          <div className="dashboard-cards-modal-group" key={group}>
            <span className="dashboard-cards-modal-group-title">{group}</span>
            {DASHBOARD_CARD_DEFS.filter((card) => card.group === group).map((card) => {
              const visible = isCardVisible(card.id)
              return (
                <label className="dashboard-cards-modal-row" key={card.id}>
                  <span className="dashboard-cards-modal-row-label">{card.label}</span>
                  <span
                    className={`dashboard-cards-modal-switch ${visible ? 'is-on' : ''}`}
                    role="switch"
                    aria-checked={visible}
                    tabIndex={0}
                    onClick={() => toggleCard(card.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        toggleCard(card.id)
                      }
                    }}
                  >
                    <span className="dashboard-cards-modal-switch-knob" />
                  </span>
                </label>
              )
            })}
          </div>
        ))}
      </div>
    </Modal>
  )
}
