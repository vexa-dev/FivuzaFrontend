import { useState, type FormEvent } from 'react'
import { Modal } from '../../../shared/components/Modal'
import type { Attribute, Category } from '../api'
import { useCreateCategory, useUpdateCategory } from '../hooks/useCategories'

interface CategoryFormModalProps {
  editingCategory: Category | null
  attributes: Attribute[]
  onClose: () => void
}

export function CategoryFormModal({ editingCategory, attributes, onClose }: CategoryFormModalProps) {
  const [name, setName] = useState(editingCategory?.name ?? '')
  const [primaryAttributeId, setPrimaryAttributeId] = useState<number | ''>(
    editingCategory?.primary_attribute ?? '',
  )
  const [error, setError] = useState<string | null>(null)

  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const isPending = createCategory.isPending || updateCategory.isPending

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError('El nombre es requerido.')
      return
    }

    const data = { name, primary_attribute: primaryAttributeId || null }
    const action = editingCategory
      ? updateCategory.mutateAsync({ id: editingCategory.id, data })
      : createCategory.mutateAsync(data)

    action.then(onClose).catch(() => setError('No se pudo guardar la categoría.'))
  }

  return (
    <Modal title={editingCategory ? 'Editar categoría' : 'Nueva categoría'} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <label htmlFor="category-name">Nombre</label>
          <input
            id="category-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        {attributes.length > 0 && (
          <div>
            <label htmlFor="category-primary-attribute">Atributo de agrupación (opcional)</label>
            <select
              id="category-primary-attribute"
              value={primaryAttributeId}
              onChange={(event) =>
                setPrimaryAttributeId(event.target.value ? Number(event.target.value) : '')
              }
            >
              <option value="">Sin agrupar (lista plana)</option>
              {attributes.map((attribute) => (
                <option key={attribute.id} value={attribute.id}>
                  {attribute.name}
                </option>
              ))}
            </select>
            <p className="core-page-subtitle" style={{ marginTop: 4 }}>
              Los productos de esta categoría se agruparán por este valor (ej. Talla) en la tabla de
              Productos.
            </p>
          </div>
        )}

        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn btn-primary" disabled={isPending}>
          {isPending ? 'Guardando...' : 'Guardar'}
        </button>
      </form>
    </Modal>
  )
}
