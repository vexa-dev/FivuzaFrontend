import { useState, type FormEvent } from 'react'
import { Modal } from '../../../shared/components/Modal'
import type { Category } from '../api'
import { useCreateCategory, useUpdateCategory } from '../hooks/useCategories'

interface CategoryFormModalProps {
  editingCategory: Category | null
  onClose: () => void
}

export function CategoryFormModal({ editingCategory, onClose }: CategoryFormModalProps) {
  const [name, setName] = useState(editingCategory?.name ?? '')
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

    const action = editingCategory
      ? updateCategory.mutateAsync({ id: editingCategory.id, data: { name } })
      : createCategory.mutateAsync({ name })

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
