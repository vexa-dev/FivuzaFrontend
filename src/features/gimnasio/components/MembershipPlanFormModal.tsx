import { useState, type FormEvent } from 'react'
import { Modal } from '../../../shared/components/Modal'
import type { MembershipPlan } from '../api'
import { useCreateMembershipPlan, useUpdateMembershipPlan } from '../hooks/useMembershipPlans'

const PERIODICITY_LABELS: Record<MembershipPlan['periodicity'], string> = {
  MONTHLY: 'Mensual',
  QUARTERLY: 'Trimestral',
  YEARLY: 'Anual',
}

interface MembershipPlanFormModalProps {
  editingPlan: MembershipPlan | null
  onClose: () => void
}

export function MembershipPlanFormModal({ editingPlan, onClose }: MembershipPlanFormModalProps) {
  const [name, setName] = useState(editingPlan?.name ?? '')
  const [price, setPrice] = useState(editingPlan?.price ?? '')
  const [periodicity, setPeriodicity] = useState<MembershipPlan['periodicity']>(
    editingPlan?.periodicity ?? 'MONTHLY',
  )
  const [benefits, setBenefits] = useState(editingPlan?.benefits ?? '')
  const [error, setError] = useState<string | null>(null)

  const createPlan = useCreateMembershipPlan()
  const updatePlan = useUpdateMembershipPlan()
  const isPending = createPlan.isPending || updatePlan.isPending

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!name.trim() || !price) {
      setError('Nombre y precio son requeridos.')
      return
    }

    const data = { name, price, periodicity, benefits }
    const action = editingPlan
      ? updatePlan.mutateAsync({ id: editingPlan.id, data })
      : createPlan.mutateAsync(data)

    action.then(onClose).catch(() => setError('No se pudo guardar el plan.'))
  }

  return (
    <Modal title={editingPlan ? 'Editar plan' : 'Nuevo plan de membresía'} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <label htmlFor="plan-name">Nombre</label>
          <input
            id="plan-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Plan mensual"
          />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="plan-price">Precio</label>
            <input
              id="plan-price"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="100.00"
              inputMode="decimal"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="plan-periodicity">Periodicidad</label>
            <select
              id="plan-periodicity"
              value={periodicity}
              onChange={(event) =>
                setPeriodicity(event.target.value as MembershipPlan['periodicity'])
              }
            >
              {(Object.keys(PERIODICITY_LABELS) as MembershipPlan['periodicity'][]).map(
                (value) => (
                  <option key={value} value={value}>
                    {PERIODICITY_LABELS[value]}
                  </option>
                ),
              )}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="plan-benefits">Beneficios incluidos</label>
          <input
            id="plan-benefits"
            value={benefits}
            onChange={(event) => setBenefits(event.target.value)}
            placeholder="Acceso a sala de pesas, clases grupales..."
          />
        </div>

        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn btn-primary" disabled={isPending}>
          {isPending ? 'Guardando...' : 'Guardar'}
        </button>
      </form>
    </Modal>
  )
}
