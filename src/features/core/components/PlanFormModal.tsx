import { useState, type FormEvent } from 'react'
import { Modal } from '../../../shared/components/Modal'
import { PLAN_FEATURE_CODES, type Plan } from '../api'
import {
  useCreatePlan,
  usePlanFeatures,
  useTogglePlanFeature,
  useUpdatePlan,
} from '../hooks/usePlansAdmin'

interface PlanFormModalProps {
  editingPlan: Plan | null
  onClose: () => void
}

const FEATURE_LABELS: Record<string, string> = {
  HAS_SALES_MODULE: 'Ventas',
  HAS_PURCHASES_MODULE: 'Compras',
  HAS_VARIANTS: 'Variantes de producto',
  HAS_MULTI_WAREHOUSE: 'Multi-almacén',
  HAS_HR_MODULE: 'RRHH',
  HAS_CASH_MODULE: 'Caja',
}

export function PlanFormModal({ editingPlan, onClose }: PlanFormModalProps) {
  const [code, setCode] = useState(editingPlan?.code ?? '')
  const [name, setName] = useState(editingPlan?.name ?? '')
  const [maxUsers, setMaxUsers] = useState(editingPlan?.max_users ?? 1)
  const [priceMonthly, setPriceMonthly] = useState(editingPlan?.price_monthly ?? '')
  const [priceSemiannual, setPriceSemiannual] = useState(editingPlan?.price_semiannual ?? '')
  const [priceAnnual, setPriceAnnual] = useState(editingPlan?.price_annual ?? '')
  const [isActive, setIsActive] = useState(editingPlan?.is_active ?? true)
  const [error, setError] = useState<string | null>(null)

  const createPlan = useCreatePlan()
  const updatePlan = useUpdatePlan()
  const { data: features } = usePlanFeatures(editingPlan?.id)
  const toggleFeature = useTogglePlanFeature()
  const isPending = createPlan.isPending || updatePlan.isPending

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!code || !name || !priceMonthly || !priceSemiannual || !priceAnnual) {
      setError('Todos los campos de precio son requeridos.')
      return
    }

    const payload = {
      code,
      name,
      max_users: maxUsers,
      price_monthly: priceMonthly,
      price_semiannual: priceSemiannual,
      price_annual: priceAnnual,
      is_active: isActive,
    }

    const action = editingPlan
      ? updatePlan.mutateAsync({ id: editingPlan.id, data: payload })
      : createPlan.mutateAsync(payload)

    action.then(onClose).catch(() => setError('No se pudo guardar el plan.'))
  }

  return (
    <Modal title={editingPlan ? 'Editar plan' : 'Nuevo plan'} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <label htmlFor="plan-code">Código</label>
          <input id="plan-code" value={code} onChange={(event) => setCode(event.target.value)} />
        </div>
        <div>
          <label htmlFor="plan-name">Nombre</label>
          <input id="plan-name" value={name} onChange={(event) => setName(event.target.value)} />
        </div>
        <div>
          <label htmlFor="plan-max-users">Usuarios máximos</label>
          <input
            id="plan-max-users"
            type="number"
            min={1}
            value={maxUsers}
            onChange={(event) => setMaxUsers(Number(event.target.value))}
          />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="plan-price-monthly">Mensual</label>
            <input
              id="plan-price-monthly"
              value={priceMonthly}
              onChange={(event) => setPriceMonthly(event.target.value)}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="plan-price-semiannual">Semestral</label>
            <input
              id="plan-price-semiannual"
              value={priceSemiannual}
              onChange={(event) => setPriceSemiannual(event.target.value)}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="plan-price-annual">Anual</label>
            <input
              id="plan-price-annual"
              value={priceAnnual}
              onChange={(event) => setPriceAnnual(event.target.value)}
            />
          </div>
        </div>
        <label className="settings-toggle-row">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
          />
          <span>Disponible para nuevas contrataciones</span>
        </label>

        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn btn-primary" disabled={isPending}>
          {isPending ? 'Guardando...' : 'Guardar'}
        </button>
      </form>

      {editingPlan && (
        <div style={{ marginTop: 20, borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
          <h3 className="summary-section-title">Características incluidas</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PLAN_FEATURE_CODES.map((featureCode) => {
              const existing = features?.find((f) => f.feature_code === featureCode)
              return (
                <label key={featureCode} className="settings-toggle-row">
                  <input
                    type="checkbox"
                    checked={existing?.is_enabled ?? false}
                    disabled={toggleFeature.isPending}
                    onChange={(event) =>
                      toggleFeature.mutate({
                        planId: editingPlan.id,
                        featureId: existing?.id ?? null,
                        featureCode,
                        isEnabled: event.target.checked,
                      })
                    }
                  />
                  <span>{FEATURE_LABELS[featureCode]}</span>
                </label>
              )
            })}
          </div>
        </div>
      )}
      {!editingPlan && (
        <p className="core-state-message" style={{ marginTop: 16 }}>
          Guarda el plan primero para poder elegir sus características incluidas.
        </p>
      )}
    </Modal>
  )
}
