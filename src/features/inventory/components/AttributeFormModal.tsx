import { useState, type FormEvent } from 'react'
import { Modal } from '../../../shared/components/Modal'
import type { Attribute } from '../api'
import { useCreateAttribute, useUpdateAttribute } from '../hooks/useAttributes'

interface AttributeFormModalProps {
  editingAttribute: Attribute | null
  onClose: () => void
}

export function AttributeFormModal({ editingAttribute, onClose }: AttributeFormModalProps) {
  const [name, setName] = useState(editingAttribute?.name ?? '')
  const [error, setError] = useState<string | null>(null)

  const createAttribute = useCreateAttribute()
  const updateAttribute = useUpdateAttribute()
  const isPending = createAttribute.isPending || updateAttribute.isPending

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError('El nombre es requerido.')
      return
    }

    const action = editingAttribute
      ? updateAttribute.mutateAsync({ id: editingAttribute.id, data: { name } })
      : createAttribute.mutateAsync({ name })

    action.then(onClose).catch(() => setError('No se pudo guardar el atributo.'))
  }

  return (
    <Modal title={editingAttribute ? 'Editar atributo' : 'Nuevo atributo'} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <label htmlFor="attribute-name">Nombre</label>
          <input
            id="attribute-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ej. Talla, Color"
            autoFocus
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
