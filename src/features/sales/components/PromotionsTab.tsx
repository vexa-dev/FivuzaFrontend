import { Pencil, Plus, Tags, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { EmptyState } from '../../../shared/components/EmptyState'
import type { Category, Product } from '../../inventory/api'
import type { Promotion } from '../api'
import { useDeletePromotion, usePromotions } from '../hooks/usePromotions'
import { PromotionFormModal } from './PromotionFormModal'
import { PromotionTargetsModal } from './PromotionTargetsModal'

function formatDate(value: string) {
  // start_date/end_date se guardan como medianoche UTC del dia calendario
  // elegido (PromotionFormModal), no un instante local -formatear en la
  // zona horaria del navegador correria la fecha un dia hacia atras en
  // cualquier UTC negativo (ej. Peru, UTC-5).
  return new Date(value).toLocaleDateString('es-PE', { dateStyle: 'medium', timeZone: 'UTC' })
}

export function PromotionsTab({
  canManage,
  categories,
  products,
}: {
  canManage: boolean
  categories: Category[]
  products: Product[]
}) {
  const { data: promotions, isLoading } = usePromotions()
  const deletePromotion = useDeletePromotion()
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null | undefined>(undefined)
  const [targetsPromotionId, setTargetsPromotionId] = useState<number | null>(null)

  return (
    <div className="card core-table-card">
      {canManage && (
        <div className="table-toolbar" style={{ justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setEditingPromotion(null)}
          >
            <Plus size={15} strokeWidth={2.5} />
            Nueva promoción
          </button>
        </div>
      )}

      {isLoading && (
        <div className="loading-row">
          <span className="spinner" />
          Cargando...
        </div>
      )}
      {promotions && promotions.length === 0 && (
        <EmptyState
          icon={<Tags />}
          title="Todavía no hay promociones"
          subtitle={canManage ? 'Crea la primera con "Nueva promoción".' : undefined}
        />
      )}
      {promotions && promotions.length > 0 && (
        <table className="core-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descuento</th>
              <th>Vigencia</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {promotions.map((promotion) => (
              <tr key={promotion.id}>
                <td className="core-table-strong">{promotion.name}</td>
                <td>
                  {promotion.type === 'PERCENTAGE' ? `${promotion.value}%` : `S/ ${promotion.value}`}
                </td>
                <td>
                  {formatDate(promotion.start_date)} — {formatDate(promotion.end_date)}
                </td>
                <td>
                  <span className={`badge ${promotion.is_active ? 'badge-success' : 'badge-ghost'}`}>
                    <span className="dot" />
                    {promotion.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setTargetsPromotionId(promotion.id)}
                    >
                      Productos
                    </button>
                    {canManage && (
                      <>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm btn-icon"
                          aria-label={`Editar ${promotion.name}`}
                          onClick={() => setEditingPromotion(promotion)}
                        >
                          <Pencil />
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger-ghost btn-sm btn-icon"
                          aria-label={`Eliminar ${promotion.name}`}
                          onClick={() => {
                            if (confirm(`¿Eliminar ${promotion.name}?`)) {
                              deletePromotion.mutate(promotion.id)
                            }
                          }}
                        >
                          <Trash2 />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editingPromotion !== undefined && (
        <PromotionFormModal
          editingPromotion={editingPromotion}
          onClose={() => setEditingPromotion(undefined)}
        />
      )}

      {targetsPromotionId !== null && (
        <PromotionTargetsModal
          promotionId={targetsPromotionId}
          categories={categories}
          products={products}
          onClose={() => setTargetsPromotionId(null)}
        />
      )}
    </div>
  )
}
