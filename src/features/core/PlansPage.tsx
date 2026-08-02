import { Package, Plus } from 'lucide-react'
import { useState } from 'react'
import { EmptyState } from '../../shared/components/EmptyState'
import { useAuth } from './hooks/useAuth'
import { useAllPlans } from './hooks/usePlansAdmin'
import type { Plan } from './api'
import { PlanFormModal } from './components/PlanFormModal'

export function PlansPage() {
  const { hasRole } = useAuth()
  const canManage = hasRole('SUPER_ADMIN')
  const { data: plans, isLoading } = useAllPlans()
  const [editingPlan, setEditingPlan] = useState<Plan | null | undefined>(undefined)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="core-page-title">Planes</h1>
          <p className="core-page-subtitle">Planes comerciales y sus características incluidas</p>
        </div>
        {canManage && (
          <button type="button" className="btn btn-primary" onClick={() => setEditingPlan(null)}>
            <Plus size={15} strokeWidth={2.5} />
            Nuevo plan
          </button>
        )}
      </div>

      <div className="card core-table-card">
        {isLoading && (
          <div className="loading-row">
            <span className="spinner" />
            Cargando...
          </div>
        )}
        {plans && plans.length === 0 && <EmptyState icon={<Package />} title="Todavía no hay planes" />}
        {plans && plans.length > 0 && (
          <table className="core-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Usuarios</th>
                <th>Mensual</th>
                <th>Semestral</th>
                <th>Anual</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id}>
                  <td className="core-table-strong">{plan.code}</td>
                  <td>{plan.name}</td>
                  <td>{plan.max_users}</td>
                  <td>S/ {plan.price_monthly}</td>
                  <td>S/ {plan.price_semiannual}</td>
                  <td>S/ {plan.price_annual}</td>
                  <td>
                    <span className={`badge ${plan.is_active ? 'badge-success' : 'badge-neutral'}`}>
                      <span className="dot" />
                      {plan.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    {canManage && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setEditingPlan(plan)}
                      >
                        Editar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editingPlan !== undefined && (
        <PlanFormModal editingPlan={editingPlan} onClose={() => setEditingPlan(undefined)} />
      )}
    </div>
  )
}
