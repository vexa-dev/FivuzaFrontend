import { useState, type FormEvent } from 'react'
import { Modal } from '../../../shared/components/Modal'
import type { Attribute, Brand, Category, NewVariantInput, Supplier } from '../api'
import { useCreateProduct } from '../hooks/useProducts'

interface ProductFormModalProps {
  categories: Category[]
  brands: Brand[]
  suppliers: Supplier[]
  attributes: Attribute[]
  onClose: () => void
}

const emptyVariant = (): NewVariantInput => ({
  sku: '',
  barcode: '',
  cost: '',
  price: '',
  attribute_value_ids: [],
})

export function ProductFormModal({
  categories,
  brands,
  suppliers,
  attributes,
  onClose,
}: ProductFormModalProps) {
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState<number | ''>(categories[0]?.id ?? '')
  const [brandId, setBrandId] = useState<number | ''>('')
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

  // Cada Attribute (Talla, Color...) permite como maximo 1 valor por
  // variante -al elegir uno nuevo se reemplaza el anterior DE ESE MISMO
  // atributo (los ids de otros atributos en la fila quedan intactos), en
  // vez de acumular selecciones contradictorias como "Talla: M" y
  // "Talla: L" a la vez en la misma variante.
  const setVariantAttributeValue = (index: number, attribute: Attribute, valueId: number | '') => {
    const attributeValueIds = new Set(attribute.values.map((value) => value.id))
    setVariants((rows) =>
      rows.map((row, rowIndex) => {
        if (rowIndex !== index) return row
        const kept = (row.attribute_value_ids ?? []).filter((id) => !attributeValueIds.has(id))
        return {
          ...row,
          attribute_value_ids: valueId === '' ? kept : [...kept, valueId],
        }
      }),
    )
  }

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
        brand: brandId || null,
        supplier: supplierId || null,
        unit_of_measure: unitOfMeasure,
        variants_input: validVariants.map((row) => ({
          sku: row.sku,
          barcode: row.barcode || undefined,
          cost: row.cost || '0',
          price: row.price || '0',
          attribute_value_ids: row.attribute_value_ids,
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
            <label htmlFor="product-brand">Marca (opcional)</label>
            <select
              id="product-brand"
              value={brandId}
              onChange={(event) => setBrandId(event.target.value ? Number(event.target.value) : '')}
            >
              <option value="">—</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
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
            <div
              key={index}
              style={{
                marginBottom: 10,
                paddingBottom: 10,
                borderBottom: variants.length > 1 ? '1px dashed var(--border-subtle)' : 'none',
              }}
            >
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
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

            {attributes.length > 0 && (
              <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                {attributes.map((attribute) => {
                  const selected =
                    attribute.values.find((value) =>
                      (variant.attribute_value_ids ?? []).includes(value.id),
                    )?.id ?? ''
                  return (
                    <div key={attribute.id} style={{ flex: '1 1 140px' }}>
                      <select
                        aria-label={attribute.name}
                        value={selected}
                        onChange={(event) =>
                          setVariantAttributeValue(
                            index,
                            attribute,
                            event.target.value ? Number(event.target.value) : '',
                          )
                        }
                      >
                        <option value="">{attribute.name}: —</option>
                        {attribute.values.map((value) => (
                          <option key={value.id} value={value.id}>
                            {attribute.name}: {value.value}
                          </option>
                        ))}
                      </select>
                    </div>
                  )
                })}
              </div>
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
