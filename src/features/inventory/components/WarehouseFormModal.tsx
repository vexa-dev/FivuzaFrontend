import { useState, type FormEvent } from 'react'
import { Modal } from '../../../shared/components/Modal'
import { ApiError } from '../../../shared/utils/apiClient'
import type { Warehouse } from '../api'
import { useCreateWarehouse, useUpdateWarehouse } from '../hooks/useWarehouses'

interface WarehouseFormModalProps {
  editingWarehouse: Warehouse | null
  onClose: () => void
}

export function WarehouseFormModal({ editingWarehouse, onClose }: WarehouseFormModalProps) {
  const [name, setName] = useState(editingWarehouse?.name ?? '')
  const [address, setAddress] = useState(editingWarehouse?.address ?? '')
  const [error, setError] = useState<string | null>(null)

  const createWarehouse = useCreateWarehouse()
  const updateWarehouse = useUpdateWarehouse()
  const isPending = createWarehouse.isPending || updateWarehouse.isPending

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError('El nombre es requerido.')
      return
    }

    const data = { name, address }
    const action = editingWarehouse
      ? updateWarehouse.mutateAsync({ id: editingWarehouse.id, data })
      : createWarehouse.mutateAsync(data)

    action
      .then(onClose)
      .catch((err: unknown) => {
        const body = err instanceof ApiError ? (err.body as { code?: string }) : null
        const message =
          body?.code === 'MODULE_DISABLED'
            ? 'Tu plan/configuración actual solo permite 1 almacén.'
            : 'No se pudo guardar el almacén.'
        setError(message)
      })
  }

  return (
    <Modal title={editingWarehouse ? 'Editar almacén' : 'Nuevo almacén'} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <label htmlFor="warehouse-name">Nombre</label>
          <input
            id="warehouse-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="warehouse-address">Dirección</label>
          <input
            id="warehouse-address"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
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
