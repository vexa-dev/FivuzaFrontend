import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Modal } from '../../../shared/components/Modal'
import type { Category, Product } from '../../inventory/api'
import {
  useAddPromotionTarget,
  usePromotion,
  useRemovePromotionTarget,
} from '../hooks/usePromotions'

interface PromotionTargetsModalProps {
  promotionId: number
  categories: Category[]
  products: Product[]
  onClose: () => void
}

export function PromotionTargetsModal({
  promotionId,
  categories,
  products,
  onClose,
}: PromotionTargetsModalProps) {
  const { data: promotion, isLoading } = usePromotion(promotionId)
  const addTarget = useAddPromotionTarget(promotionId)
  const removeTarget = useRemovePromotionTarget(promotionId)

  const [mode, setMode] = useState<'category' | 'variant'>('category')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [variantId, setVariantId] = useState<number | ''>('')
  const [error, setError] = useState<string | null>(null)

  const variants = products.flatMap((product) =>
    product.variants.map((variant) => ({ ...variant, productName: product.name })),
  )

  const categoryName = (id: number) => categories.find((c) => c.id === id)?.name ?? `#${id}`
  const variantLabel = (id: number) => {
    const variant = variants.find((v) => v.id === id)
    return variant ? `${variant.productName} — ${variant.sku}` : `#${id}`
  }

  const handleAdd = () => {
    setError(null)
    if (mode === 'category' && !categoryId) {
      setError('Selecciona una categoría.')
      return
    }
    if (mode === 'variant' && !variantId) {
      setError('Selecciona un producto.')
      return
    }
    addTarget
      .mutateAsync(
        mode === 'category' ? { category: categoryId as number } : { variant: variantId as number },
      )
      .then(() => {
        setCategoryId('')
        setVariantId('')
      })
      .catch(() => setError('No se pudo agregar el producto/categoría.'))
  }

  return (
    <Modal title="Productos afectados" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {isLoading && (
          <div className="loading-row">
            <span className="spinner" />
            Cargando...
          </div>
        )}

        {promotion && (
          <>
            {promotion.targets.length === 0 && (
              <p className="core-state-message">
                Esta promoción todavía no tiene productos ni categorías asignadas.
              </p>
            )}
            {promotion.targets.length > 0 && (
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 0, margin: 0 }}>
                {promotion.targets.map((target) => (
                  <li
                    key={target.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      listStyle: 'none',
                    }}
                  >
                    <span>
                      {target.category !== null
                        ? `Categoría: ${categoryName(target.category)}`
                        : `Producto: ${variantLabel(target.variant as number)}`}
                    </span>
                    <button
                      type="button"
                      className="btn btn-danger-ghost btn-sm btn-icon"
                      aria-label="Quitar"
                      onClick={() => removeTarget.mutate(target.id)}
                    >
                      <Trash2 />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                <label className="settings-toggle-row">
                  <input
                    type="radio"
                    name="target-mode"
                    checked={mode === 'category'}
                    onChange={() => setMode('category')}
                  />
                  <span>Toda una categoría</span>
                </label>
                <label className="settings-toggle-row">
                  <input
                    type="radio"
                    name="target-mode"
                    checked={mode === 'variant'}
                    onChange={() => setMode('variant')}
                  />
                  <span>Un producto específico</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                {mode === 'category' ? (
                  <select
                    value={categoryId}
                    onChange={(event) =>
                      setCategoryId(event.target.value ? Number(event.target.value) : '')
                    }
                    style={{ flex: 1 }}
                  >
                    <option value="">Selecciona una categoría</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={variantId}
                    onChange={(event) =>
                      setVariantId(event.target.value ? Number(event.target.value) : '')
                    }
                    style={{ flex: 1 }}
                  >
                    <option value="">Selecciona un producto</option>
                    {variants.map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {variant.productName} — {variant.sku}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAdd}
                  disabled={addTarget.isPending}
                >
                  Agregar
                </button>
              </div>
              {error && (
                <p className="login-error" role="alert" style={{ marginTop: 8 }}>
                  {error}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
