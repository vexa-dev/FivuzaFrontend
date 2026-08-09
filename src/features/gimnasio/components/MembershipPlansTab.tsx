import { Dumbbell, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { EmptyState } from '../../../shared/components/EmptyState'
import { formatCurrency } from '../../../shared/utils/format'
import type { MembershipPlan } from '../api'
import { useDeleteMembershipPlan, useMembershipPlans } from '../hooks/useMembershipPlans'
import { MembershipPlanFormModal } from './MembershipPlanFormModal'

const PERIODICITY_LABELS: Record<MembershipPlan['periodicity'], string> = {
  MONTHLY: 'Mensual',
  QUARTERLY: 'Trimestral',
  YEARLY: 'Anual',
}

export function MembershipPlansTab({ canManage }: { canManage: boolean }) {
  const { data: plans, isLoading } = useMembershipPlans()
  const deletePlan = useDeleteMembershipPlan()
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null | undefined>(undefined)

  return (
    <div className="card core-table-card">
      {canManage && (
        <div className="table-toolbar" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-primary" onClick={() => setEditingPlan(null)}>
            <Plus size={15} strokeWidth={2.5} />
            Nuevo plan
          </button>
        </div>
      )}

      {isLoading && (
        <div className="loading-row">
          <span className="spinner" />
          Cargando...
        </div>
      )}
      {plans && plans.length === 0 && (
        <EmptyState
          icon={<Dumbbell />}
          title="Todavía no hay planes de membresía"
          subtitle={canManage ? 'Crea el primero con "Nuevo plan".' : undefined}
        />
      )}
      {plans && plans.length > 0 && (
        <table className="core-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Precio</th>
              <th>Periodicidad</th>
              <th>Beneficios</th>
              <th>Estado</th>
              {canManage && <th></th>}
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan.id}>
                <td className="core-table-strong">{plan.name}</td>
                <td>{formatCurrency(plan.price)}</td>
                <td>{PERIODICITY_LABELS[plan.periodicity]}</td>
                <td>{plan.benefits || '—'}</td>
                <td>
                  <span className={`badge ${plan.is_active ? 'badge-success' : 'badge-neutral'}`}>
                    <span className="dot" />
                    {plan.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                {canManage && (
                  <td>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm btn-icon"
                        aria-label={`Editar ${plan.name}`}
                        onClick={() => setEditingPlan(plan)}
                      >
                        <Pencil />
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger-ghost btn-sm btn-icon"
                        aria-label={`Eliminar ${plan.name}`}
                        onClick={() => {
                          if (confirm(`¿Eliminar ${plan.name}?`)) {
                            deletePlan.mutate(plan.id)
                          }
                        }}
                      >
                        <Trash2 />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editingPlan !== undefined && (
        <MembershipPlanFormModal editingPlan={editingPlan} onClose={() => setEditingPlan(undefined)} />
      )}
    </div>
  )
}
