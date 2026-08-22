import { useState, type FormEvent } from 'react'
import { Modal } from '../../../shared/components/Modal'
import { getErrorMessage } from '../../../shared/utils/errorMessage'
import type { Attribute, Category } from '../api'
import { useCreateCategory, useUpdateCategory } from '../hooks/useCategories'
import './CategoryFormModal.css'

interface CategoryFormModalProps {
  editingCategory: Category | null
  attributes: Attribute[]
  onClose: () => void
}

export function CategoryFormModal({ editingCategory, attributes, onClose }: CategoryFormModalProps) {
  const [name, setName] = useState(editingCategory?.name ?? '')
  const [allowedAttributeIds, setAllowedAttributeIds] = useState<number[]>(
    editingCategory?.allowed_attributes ?? [],
  )
  const [primaryAttributeId, setPrimaryAttributeId] = useState<number | ''>(
    editingCategory?.primary_attribute ?? '',
  )
  const [isActive, setIsActive] = useState(editingCategory?.is_active ?? true)
  const [error, setError] = useState<string | null>(null)

  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const isPending = createCategory.isPending || updateCategory.isPending
  const allowedAttributes = attributes.filter((attribute) =>
    allowedAttributeIds.includes(attribute.id),
  )

  const toggleAttribute = (attributeId: number) => {
    setAllowedAttributeIds((current) => {
      if (current.includes(attributeId)) {
        if (primaryAttributeId === attributeId) setPrimaryAttributeId('')
        return current.filter((id) => id !== attributeId)
      }
      return [...current, attributeId]
    })
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError('El nombre es requerido.')
      return
    }

    const data = {
      name: name.trim(),
      primary_attribute: primaryAttributeId || null,
      allowed_attributes: allowedAttributeIds,
      is_active: isActive,
    }
    const action = editingCategory
      ? updateCategory.mutateAsync({ id: editingCategory.id, data })
      : createCategory.mutateAsync(data)

    action
      .then(onClose)
      .catch((requestError: unknown) =>
        setError(getErrorMessage(requestError, 'No se pudo guardar la categoría.')),
      )
  }

  return (
    <Modal title={editingCategory ? 'Editar categoría' : 'Nueva categoría'} onClose={onClose}>
      <form className="category-form" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="category-name">Nombre</label>
          <input id="category-name" value={name} onChange={(event) => setName(event.target.value)} autoFocus />
        </div>

        {attributes.length > 0 && (
          <fieldset className="category-attributes-fieldset">
            <legend>Atributos permitidos</legend>
            <p>Selecciona únicamente las características que pueden definir variantes en esta categoría.</p>
            <div className="category-attributes-grid">
              {attributes.map((attribute) => (
                <label className="category-attribute-option" key={attribute.id}>
                  <input
                    type="checkbox"
                    checked={allowedAttributeIds.includes(attribute.id)}
                    onChange={() => toggleAttribute(attribute.id)}
                  />
                  <span>{attribute.name}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <div>
          <label htmlFor="category-primary-attribute">Atributo de agrupación (opcional)</label>
          <select
            id="category-primary-attribute"
            value={primaryAttributeId}
            onChange={(event) => setPrimaryAttributeId(event.target.value ? Number(event.target.value) : '')}
            disabled={allowedAttributes.length === 0}
          >
            <option value="">Sin agrupar (lista plana)</option>
            {allowedAttributes.map((attribute) => (
              <option key={attribute.id} value={attribute.id}>{attribute.name}</option>
            ))}
          </select>
          <p className="category-form-help">
            Se usa para ordenar y agrupar las variantes en la lista de productos.
          </p>
        </div>

        <label className="product-form-switch">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
          />
          <span>
            <strong>Categoría activa</strong>
            <small>Las categorías inactivas no aparecen como opción al crear productos.</small>
          </span>
        </label>

        {error && <p className="login-error" role="alert">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={isPending}>
          {isPending ? 'Guardando...' : 'Guardar'}
        </button>
      </form>
    </Modal>
  )
}
