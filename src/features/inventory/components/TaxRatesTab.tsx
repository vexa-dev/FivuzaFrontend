import { Percent, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { EmptyState } from '../../../shared/components/EmptyState'
import type { TaxRate } from '../api'
import { useDeleteTaxRate, useTaxRates } from '../hooks/useTaxRates'
import { TaxRateFormModal } from './TaxRateFormModal'

export function TaxRatesTab({ canManage }: { canManage: boolean }) {
  const { data: taxRates, isLoading } = useTaxRates()
  const deleteTaxRate = useDeleteTaxRate()
  const [editingTaxRate, setEditingTaxRate] = useState<TaxRate | null | undefined>(undefined)

  return (
    <div className="card core-table-card">
      {canManage && (
        <div className="table-toolbar" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-primary" onClick={() => setEditingTaxRate(null)}>
            <Plus size={15} strokeWidth={2.5} />
            Nuevo impuesto
          </button>
        </div>
      )}

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
                        onClick={() => {
                          if (confirm(`¿Eliminar ${taxRate.name}?`)) {
                            deleteTaxRate.mutate(taxRate.id)
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

      {editingTaxRate !== undefined && (
        <TaxRateFormModal
          editingTaxRate={editingTaxRate}
          onClose={() => setEditingTaxRate(undefined)}
        />
      )}
    </div>
  )
}
