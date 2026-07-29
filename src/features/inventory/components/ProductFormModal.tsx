import { useState, type FormEvent } from 'react'
import { Modal } from '../../../shared/components/Modal'
import type { Category, NewVariantInput, Supplier } from '../api'
import { useCreateProduct } from '../hooks/useProducts'

interface ProductFormModalProps {
  categories: Category[]
  suppliers: Supplier[]
  onClose: () => void
}

const emptyVariant = (): NewVariantInput => ({ sku: '', barcode: '', cost: '', price: '' })

export function ProductFormModal({ categories, suppliers, onClose }: ProductFormModalProps) {
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState<number | ''>(categories[0]?.id ?? '')
  const [supplierId, setSupplierId] = useState<number | ''>('')
  const [unitOfMeasure, setUnitOfMeasure] = useState<'UND' | 'KG'>('UND')
  const [variants, setVariants] = useState<NewVariantInput[]>([emptyVariant()])
  const [error, setError] = useState<string | null>(null)

  const createProduct = useCreateProduct()

  const updateVariant = (index: number, field: keyof NewVariantInput, value: string) => {
    setVariants((rows) =>
      rows.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)),
    )
  }

  const addVariantRow = () => setVariants((rows) => [...rows, emptyVariant()])

  const removeVariantRow = (index: number) =>
    setVariants((rows) => rows.filter((_, rowIndex) => rowIndex !== index))

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!name.trim() || !categoryId) {
      setError('Nombre y categoría son requeridos.')
      return
    }
    const validVariants = variants.filter((row) => row.sku.trim())
    if (validVariants.length === 0) {
      setError('Agrega al menos una variante con SKU.')
      return
    }

    createProduct
      .mutateAsync({
        type: 'PRODUCT',
        name,
        category: categoryId,
        supplier: supplierId || null,
        unit_of_measure: unitOfMeasure,
        variants_input: validVariants.map((row) => ({
          sku: row.sku,
          barcode: row.barcode || undefined,
          cost: row.cost || '0',
          price: row.price || '0',
        })),
      })
      .then(onClose)
      .catch(() => setError('No se pudo guardar el producto.'))
  }

  return (
    <Modal title="Nuevo producto" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <label htmlFor="product-name">Nombre</label>
          <input id="product-name" value={name} onChange={(event) => setName(event.target.value)} />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="product-category">Categoría</label>
            <select
              id="product-category"
              value={categoryId}
              onChange={(event) => setCategoryId(Number(event.target.value))}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1 }}>
            <label htmlFor="product-supplier">Proveedor (opcional)</label>
            <select
              id="product-supplier"
              value={supplierId}
              onChange={(event) => setSupplierId(event.target.value ? Number(event.target.value) : '')}
            >
              <option value="">—</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.company_name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1 }}>
            <label htmlFor="product-unit">Unidad</label>
            <select
              id="product-unit"
              value={unitOfMeasure}
              onChange={(event) => setUnitOfMeasure(event.target.value as 'UND' | 'KG')}
            >
              <option value="UND">Unidad</option>
              <option value="KG">Kilogramo</option>
            </select>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label>Variantes</label>
            <button type="button" className="btn btn-ghost" onClick={addVariantRow}>
              + Agregar variante
            </button>
          </div>
          <p className="core-page-subtitle" style={{ marginTop: 0 }}>
            Si el producto no tiene tallas/colores, deja solo la primera fila.
          </p>

          {variants.map((variant, index) => (
            <div key={index} style={{ display: 'flex', gap: 6, marginBottom: 8, alignItems: 'flex-end' }}>
              <div style={{ flex: 2 }}>
                {index === 0 && <label htmlFor={`variant-sku-${index}`}>SKU</label>}
                <input
                  id={`variant-sku-${index}`}
                  value={variant.sku}
                  onChange={(event) => updateVariant(index, 'sku', event.target.value)}
                  placeholder="SKU"
                />
              </div>
              <div style={{ flex: 2 }}>
                {index === 0 && <label htmlFor={`variant-barcode-${index}`}>Código de barras</label>}
                <input
                  id={`variant-barcode-${index}`}
                  value={variant.barcode}
                  onChange={(event) => updateVariant(index, 'barcode', event.target.value)}
                  placeholder="Escanea o escribe"
                  autoComplete="off"
                />
              </div>
              <div style={{ flex: 1 }}>
                {index === 0 && <label htmlFor={`variant-cost-${index}`}>Costo</label>}
                <input
                  id={`variant-cost-${index}`}
                  value={variant.cost}
                  onChange={(event) => updateVariant(index, 'cost', event.target.value)}
                  placeholder="0.00"
                  inputMode="decimal"
                />
              </div>
              <div style={{ flex: 1 }}>
                {index === 0 && <label htmlFor={`variant-price-${index}`}>Precio</label>}
                <input
                  id={`variant-price-${index}`}
                  value={variant.price}
                  onChange={(event) => updateVariant(index, 'price', event.target.value)}
                  placeholder="0.00"
                  inputMode="decimal"
                />
              </div>
              {variants.length > 1 && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => removeVariantRow(index)}
                  aria-label="Quitar variante"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn btn-primary" disabled={createProduct.isPending}>
          {createProduct.isPending ? 'Guardando...' : 'Guardar'}
        </button>
      </form>
    </Modal>
  )
}
