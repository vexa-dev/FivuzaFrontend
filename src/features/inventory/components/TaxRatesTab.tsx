import { Percent, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog'
import { EmptyState } from '../../../shared/components/EmptyState'
import type { TaxRate } from '../api'
import { useDeleteTaxRate, useTaxRates } from '../hooks/useTaxRates'
import { TaxRateFormModal } from './TaxRateFormModal'

interface TaxRatesTabProps {
  canManage: boolean
  // "Nuevo impuesto" se dispara desde la fila de pestañas de InventoryPage
  // (al mismo nivel que el menu, no adentro de la tabla) -por eso el
  // trigger de creacion vive en el padre; la edicion desde una fila si
  // sigue siendo estado interno de esta tab.
  showCreateForm: boolean
  onCloseCreateForm: () => void
}

export function TaxRatesTab({ canManage, showCreateForm, onCloseCreateForm }: TaxRatesTabProps) {
  const { data: taxRates, isLoading } = useTaxRates()
  const deleteTaxRate = useDeleteTaxRate()
  const [editingTaxRate, setEditingTaxRate] = useState<TaxRate | null>(null)
  const [deletingTaxRate, setDeletingTaxRate] = useState<TaxRate | null>(null)

  return (
    <div className="card core-table-card">
      {isLoading && (
        <div className="loading-row">
          <span className="spinner" />
          Cargando...
        </div>
      )}
      {taxRates && taxRates.length === 0 && (
        <EmptyState icon={<Percent />} title="Todavía no hay impuestos configurados" />
      )}
      {taxRates && taxRates.length > 0 && (
        <table className="core-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Porcentaje</th>
              <th>Estado</th>
              {canManage && <th></th>}
            </tr>
          </thead>
          <tbody>
            {taxRates.map((taxRate) => (
              <tr key={taxRate.id}>
                <td className="core-table-strong">{taxRate.name}</td>
                <td>{taxRate.percentage}%</td>
                <td>
                  <span className={`badge ${taxRate.is_active ? 'badge-success' : 'badge-neutral'}`}>
                    <span className="dot" />
                    {taxRate.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                {canManage && (
                  <td>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm btn-icon"
                        aria-label={`Editar ${taxRate.name}`}
                        onClick={() => setEditingTaxRate(taxRate)}
                      >
                        <Pencil />
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger-ghost btn-sm btn-icon"
                        aria-label={`Eliminar ${taxRate.name}`}
                        onClick={() => setDeletingTaxRate(taxRate)}
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

      {(showCreateForm || editingTaxRate) && (
        <TaxRateFormModal
          editingTaxRate={editingTaxRate}
          onClose={() => {
            onCloseCreateForm()
            setEditingTaxRate(null)
          }}
        />
      )}

      {deletingTaxRate && (
        <ConfirmDialog
          title="Eliminar impuesto"
          message={`¿Eliminar "${deletingTaxRate.name}"? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          onConfirm={() => deleteTaxRate.mutate(deletingTaxRate.id)}
          onClose={() => setDeletingTaxRate(null)}
        />
      )}
    </div>
  )
}
