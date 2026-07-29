import { useState } from 'react'
import { Modal } from '../../../shared/components/Modal'
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
              <td>{variant.cost}</td>
              <td>{variant.price}</td>
              <td>{variant.is_default ? '✓' : ''}</td>
              {canManage && (
                <td style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setEditingVariant(variant)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      if (confirm(`¿Eliminar la variante ${variant.sku}?`)) {
                        deleteVariant.mutate(variant.id)
                      }
                    }}
                  >
                    Eliminar
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {editingVariant && (
        <VariantEditModal variant={editingVariant} onClose={() => setEditingVariant(null)} />
      )}
    </Modal>
  )
}
