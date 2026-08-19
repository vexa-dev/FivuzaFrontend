import { useState, type FormEvent } from 'react'
import { Modal } from '../../../shared/components/Modal'
import type { Brand } from '../api'
import { useCreateBrand, useUpdateBrand } from '../hooks/useBrands'

interface BrandFormModalProps {
  editingBrand: Brand | null
  onClose: () => void
}

export function BrandFormModal({ editingBrand, onClose }: BrandFormModalProps) {
  const [name, setName] = useState(editingBrand?.name ?? '')
  const [error, setError] = useState<string | null>(null)

  const createBrand = useCreateBrand()
  const updateBrand = useUpdateBrand()
  const isPending = createBrand.isPending || updateBrand.isPending

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError('El nombre es requerido.')
      return
    }

    const action = editingBrand
      ? updateBrand.mutateAsync({ id: editingBrand.id, data: { name } })
      : createBrand.mutateAsync({ name })

    action.then(onClose).catch(() => setError('No se pudo guardar la marca.'))
  }

  return (
    <Modal title={editingBrand ? 'Editar marca' : 'Nueva marca'} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <label htmlFor="brand-name">Nombre</label>
          <input
            id="brand-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
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
