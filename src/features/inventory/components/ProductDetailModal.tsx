import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Modal } from '../../../shared/components/Modal'
import { formatCurrency } from '../../../shared/utils/format'
import type { Product, ProductVariant } from '../api'
import { useDeleteVariant } from '../hooks/useProducts'
import { VariantEditModal } from './VariantEditModal'

interface ProductDetailModalProps {
  product: Product
  canManage: boolean
  onClose: () => void
}

export function ProductDetailModal({ product, canManage, onClose }: ProductDetailModalProps) {
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null)
  const deleteVariant = useDeleteVariant()

  return (
    <Modal title={product.name} onClose={onClose}>
      <div style={{ overflowX: 'auto' }}>
        <table className="core-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Código de barras</th>
              <th>Costo</th>
              <th>Precio</th>
              <th>Predet.</th>
              {canManage && <th></th>}
            </tr>
          </thead>
          <tbody>
            {product.variants.map((variant) => (
              <tr key={variant.id}>
                <td className="core-table-strong">{variant.sku}</td>
                <td>{variant.barcode ?? '—'}</td>
                <td>{formatCurrency(variant.cost)}</td>
                <td>{formatCurrency(variant.price)}</td>
                <td>{variant.is_default ? '✓' : ''}</td>
                {canManage && (
                  <td>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm btn-icon"
                        aria-label={`Editar variante ${variant.sku}`}
                        onClick={() => setEditingVariant(variant)}
                      >
                        <Pencil />
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger-ghost btn-sm btn-icon"
                        aria-label={`Eliminar variante ${variant.sku}`}
                        onClick={() => {
                          if (confirm(`¿Eliminar la variante ${variant.sku}?`)) {
                            deleteVariant.mutate(variant.id)
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
      </div>

      {editingVariant && (
        <VariantEditModal variant={editingVariant} onClose={() => setEditingVariant(null)} />
      )}
    </Modal>
  )
}
