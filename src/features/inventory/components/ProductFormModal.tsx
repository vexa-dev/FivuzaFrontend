import { Layers3, Package, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { Modal } from '../../../shared/components/Modal'
import { getErrorMessage } from '../../../shared/utils/errorMessage'
import type { Attribute, Brand, Category, NewVariantInput, Supplier } from '../api'
import { resolveAllowedAttributeIds } from '../hooks/useAttributes'
import { useCreateProduct } from '../hooks/useProducts'
import './ProductFormModal.css'

interface ProductFormModalProps {
  categories: Category[]
  brands: Brand[]
  suppliers: Supplier[]
  attributes: Attribute[]
  onConfigureCategory: (category: Category) => void
  onClose: () => void
}

const emptyVariant = (): NewVariantInput => ({
  sku: '',
  barcode: '',
  cost: '0',
  price: '0',
  min_stock: '0',
  attribute_value_ids: [],
})

type VariantTextField = 'sku' | 'barcode' | 'cost' | 'price' | 'min_stock'

function validDecimal(value: string | undefined, decimalPlaces: number) {
  if (!value) return true
  const expression = new RegExp(`^\\d+(?:\\.\\d{1,${decimalPlaces}})?$`)
  return expression.test(value) && Number(value) >= 0
}

export function ProductFormModal({
  categories,
  brands,
  suppliers,
  attributes,
  onConfigureCategory,
  onClose,
}: ProductFormModalProps) {
  const activeCategories = categories.filter((category) => category.is_active)
  const activeBrands = brands.filter((brand) => brand.is_active)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState<number | ''>(activeCategories[0]?.id ?? '')
  const [brandId, setBrandId] = useState<number | ''>('')
  const [supplierId, setSupplierId] = useState<number | ''>('')
  const [unitOfMeasure, setUnitOfMeasure] = useState<'UND' | 'KG'>('UND')
  const [isForSale, setIsForSale] = useState(true)
  const [isActive, setIsActive] = useState(true)
  const [variants, setVariants] = useState<NewVariantInput[]>([emptyVariant()])
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const createProduct = useCreateProduct()
  const selectedCategory = activeCategories.find((category) => category.id === categoryId)
  const allowedAttributes = useMemo(() => {
    const allowedIds = resolveAllowedAttributeIds(selectedCategory)
    return attributes
      .filter((attribute) => allowedIds.has(attribute.id))
      .sort((a, b) => {
        if (a.id === selectedCategory?.primary_attribute) return -1
        if (b.id === selectedCategory?.primary_attribute) return 1
        return a.name.localeCompare(b.name)
      })
  }, [attributes, selectedCategory])

  const updateVariant = (index: number, field: VariantTextField, value: string) => {
    setVariants((rows) =>
      rows.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)),
    )
  }

  const handleDescriptionChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = event.currentTarget
    setDescription(textarea.value)
    textarea.style.height = 'auto'
    const nextHeight = Math.min(Math.max(textarea.scrollHeight, 40), 128)
    textarea.style.height = `${nextHeight}px`
    textarea.style.overflowY = textarea.scrollHeight > 128 ? 'auto' : 'hidden'
  }

  const addVariantRow = () => setVariants((rows) => [...rows, emptyVariant()])
  const removeVariantRow = (index: number) =>
    setVariants((rows) => rows.filter((_, rowIndex) => rowIndex !== index))

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

  const handleCategoryChange = (nextCategoryId: number) => {
    const nextCategory = activeCategories.find((category) => category.id === nextCategoryId)
    const allowedAttributeIds = resolveAllowedAttributeIds(nextCategory)
    const allowedValueIds = new Set(
      attributes
        .filter((attribute) => allowedAttributeIds.has(attribute.id))
        .flatMap((attribute) => attribute.values.map((value) => value.id)),
    )
    let removed = 0
    const compatibleVariants = variants.map((row) => {
      const current = row.attribute_value_ids ?? []
      const compatible = current.filter((id) => allowedValueIds.has(id))
      removed += current.length - compatible.length
      return { ...row, attribute_value_ids: compatible }
    })
    setVariants(compatibleVariants)
    setCategoryId(nextCategoryId)
    setNotice(
      removed > 0 ? `Se retiraron ${removed} atributos incompatibles con la categoría.` : null,
    )
  }

  const validate = () => {
    if (!name.trim() || !categoryId) return 'Nombre y categoría son requeridos.'
    if (variants.some((variant) => !variant.sku.trim())) {
      return 'Todas las variantes deben tener un SKU.'
    }

    const normalizedSkus = variants.map((variant) => variant.sku.trim())
    if (new Set(normalizedSkus).size !== normalizedSkus.length) {
      return 'Los SKU de las variantes no pueden repetirse.'
    }
    const barcodes = variants.map((variant) => variant.barcode?.trim()).filter(Boolean)
    if (new Set(barcodes).size !== barcodes.length) {
      return 'Los códigos de barras de las variantes no pueden repetirse.'
    }

    for (const [index, variant] of variants.entries()) {
      if (!validDecimal(variant.cost, 4) || !validDecimal(variant.price, 4)) {
        return (
          `Revisa el costo y precio de la variante ${index + 1}; ` +
          'deben ser valores no negativos con hasta 4 decimales.'
        )
      }
      if (!validDecimal(variant.min_stock, 3)) {
        return `Revisa el stock mínimo de la variante ${index + 1}; admite hasta 3 decimales.`
      }
    }
    return null
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    createProduct
      .mutateAsync({
        type: 'PRODUCT',
        name: name.trim(),
        description: description.trim(),
        category: Number(categoryId),
        brand: brandId || null,
        supplier: supplierId || null,
        unit_of_measure: unitOfMeasure,
        is_for_sale: isForSale,
        is_active: isActive,
        variants_input: variants.map((row) => ({
          sku: row.sku.trim(),
          barcode: row.barcode?.trim() || undefined,
          cost: row.cost || '0',
          price: row.price || '0',
          min_stock: row.min_stock || '0',
          attribute_value_ids: row.attribute_value_ids,
        })),
      })
      .then(onClose)
      .catch((requestError: unknown) =>
        setError(getErrorMessage(requestError, 'No se pudo guardar el producto.')),
      )
  }

  return (
    <Modal title="Nuevo producto" onClose={onClose} size="xl" className="product-form-modal">
      <form className="product-form" onSubmit={handleSubmit} noValidate>
        <div className="product-form-scroll">
          <p className="product-form-intro">
            Registra la información comercial y configura las variantes que controlarás en el inventario.
          </p>

          <section className="product-form-section" aria-labelledby="product-general-heading">
            <div className="product-form-section-heading">
              <span className="product-form-section-icon"><Package aria-hidden="true" /></span>
              <div>
                <h3 id="product-general-heading">Información general</h3>
                <p>Datos que identifican al producto en el catálogo.</p>
              </div>
            </div>

            <div className="product-form-grid">
              <div className="product-form-field product-form-field-wide">
                <label htmlFor="product-name">Nombre *</label>
                <input
                  id="product-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ej. Polo básico"
                  autoFocus
                />
              </div>
              <div className="product-form-field product-form-field-wide">
                <label htmlFor="product-description">Descripción (opcional)</label>
                <textarea
                  id="product-description"
                  value={description}
                  onChange={handleDescriptionChange}
                  placeholder="Añade una descripción breve para el catálogo."
                  rows={1}
                />
              </div>
              <div className="product-form-field">
                <label htmlFor="product-category">Categoría *</label>
                <select
                  id="product-category"
                  value={categoryId}
                  onChange={(event) => handleCategoryChange(Number(event.target.value))}
                >
                  {activeCategories.length === 0 && <option value="">Sin categorías activas</option>}
                  {activeCategories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              <div className="product-form-field">
                <label htmlFor="product-unit">Unidad *</label>
                <select
                  id="product-unit"
                  value={unitOfMeasure}
                  onChange={(event) => setUnitOfMeasure(event.target.value as 'UND' | 'KG')}
                >
                  <option value="UND">Unidad</option>
                  <option value="KG">Kilogramo</option>
                </select>
              </div>
              <div className="product-form-field">
                <label htmlFor="product-brand">Marca (opcional)</label>
                <select
                  id="product-brand"
                  value={brandId}
                  onChange={(event) =>
                    setBrandId(event.target.value ? Number(event.target.value) : '')
                  }
                >
                  <option value="">Sin marca</option>
                  {activeBrands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                </select>
              </div>
              <div className="product-form-field">
                <label htmlFor="product-supplier">Proveedor (opcional)</label>
                <select
                  id="product-supplier"
                  value={supplierId}
                  onChange={(event) =>
                    setSupplierId(event.target.value ? Number(event.target.value) : '')
                  }
                >
                  <option value="">Sin proveedor</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>{supplier.company_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="product-form-switches">
              <label className="product-form-switch">
                <input
                  type="checkbox"
                  checked={isForSale}
                  onChange={(event) => setIsForSale(event.target.checked)}
                />
                <span>
                  <strong>Disponible para venta</strong>
                  <small>Aparecerá en el catálogo y el punto de venta.</small>
                </span>
              </label>
              <label className="product-form-switch">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(event) => setIsActive(event.target.checked)}
                />
                <span>
                  <strong>Producto activo</strong>
                  <small>Podrá utilizarse inmediatamente después de guardarlo.</small>
                </span>
              </label>
            </div>
          </section>

          <section className="product-form-section" aria-labelledby="product-variants-heading">
            <div className="product-form-section-heading product-form-variants-heading">
              <span className="product-form-section-icon"><Layers3 aria-hidden="true" /></span>
              <div>
                <h3 id="product-variants-heading">Variantes</h3>
                <p>La primera variante quedará como predeterminada.</p>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={addVariantRow}>
                <Plus aria-hidden="true" /> Agregar variante
              </button>
            </div>

            {notice && <p className="product-form-notice" role="status">{notice}</p>}

            <div className="product-variant-list">
              {variants.map((variant, index) => (
                <article className="product-variant-card" key={index}>
                  <div className="product-variant-card-header">
                    <div>
                      <span className="product-variant-number">{index + 1}</span>
                      <strong>Variante {index + 1}</strong>
                      {index === 0 && <span className="product-variant-default">Predeterminada</span>}
                    </div>
                    {variants.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-danger-ghost btn-sm btn-icon"
                        onClick={() => removeVariantRow(index)}
                        aria-label={`Quitar variante ${index + 1}`}
                      >
                        <Trash2 aria-hidden="true" />
                      </button>
                    )}
                  </div>

                  <div className="product-variant-fields">
                    <div className="product-form-field product-variant-sku">
                      <label htmlFor={`variant-sku-${index}`}>SKU *</label>
                      <input
                        id={`variant-sku-${index}`}
                        value={variant.sku}
                        onChange={(event) => updateVariant(index, 'sku', event.target.value)}
                        placeholder="SKU-001"
                      />
                    </div>
                    <div className="product-form-field product-variant-barcode">
                      <label htmlFor={`variant-barcode-${index}`}>Código de barras</label>
                      <input
                        id={`variant-barcode-${index}`}
                        value={variant.barcode}
                        onChange={(event) => updateVariant(index, 'barcode', event.target.value)}
                        placeholder="Escanea o escribe"
                        autoComplete="off"
                      />
                    </div>
                    <div className="product-form-field">
                      <label htmlFor={`variant-cost-${index}`}>Costo</label>
                      <input
                        id={`variant-cost-${index}`}
                        value={variant.cost}
                        onChange={(event) => updateVariant(index, 'cost', event.target.value)}
                        inputMode="decimal"
                      />
                    </div>
                    <div className="product-form-field">
                      <label htmlFor={`variant-price-${index}`}>Precio</label>
                      <input
                        id={`variant-price-${index}`}
                        value={variant.price}
                        onChange={(event) => updateVariant(index, 'price', event.target.value)}
                        inputMode="decimal"
                      />
                    </div>
                    <div className="product-form-field">
                      <label htmlFor={`variant-min-stock-${index}`}>Stock mínimo</label>
                      <input
                        id={`variant-min-stock-${index}`}
                        value={variant.min_stock}
                        onChange={(event) => updateVariant(index, 'min_stock', event.target.value)}
                        inputMode="decimal"
                      />
                    </div>
                  </div>

                  {allowedAttributes.length > 0 ? (
                    <div className="product-variant-attributes">
                      {allowedAttributes.map((attribute) => {
                        const selected =
                          attribute.values.find((value) =>
                            (variant.attribute_value_ids ?? []).includes(value.id),
                          )?.id ?? ''
                        return (
                          <div className="product-form-field" key={attribute.id}>
                            <label htmlFor={`variant-${index}-attribute-${attribute.id}`}>{attribute.name}</label>
                            <select
                              id={`variant-${index}-attribute-${attribute.id}`}
                              aria-label={`${attribute.name} de variante ${index + 1}`}
                              value={selected}
                              onChange={(event) =>
                                setVariantAttributeValue(
                                  index,
                                  attribute,
                                  event.target.value ? Number(event.target.value) : '',
                                )
                              }
                              disabled={attribute.values.length === 0}
                            >
                              <option value="">Sin seleccionar</option>
                              {attribute.values.map((value) => (
                                <option key={value.id} value={value.id}>{value.value}</option>
                              ))}
                            </select>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="product-variant-empty-attributes">
                      <p>
                        Esta categoría todavía no tiene atributos para sus variantes.
                      </p>
                      {selectedCategory && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => onConfigureCategory(selectedCategory)}
                        >
                          Configurar atributos
                        </button>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        </div>

        <footer className="product-form-footer">
          {error && <p className="login-error product-form-error" role="alert">{error}</p>}
          <div className="product-form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={createProduct.isPending}>
              {createProduct.isPending ? 'Guardando...' : 'Guardar producto'}
            </button>
          </div>
        </footer>
      </form>
    </Modal>
  )
}
