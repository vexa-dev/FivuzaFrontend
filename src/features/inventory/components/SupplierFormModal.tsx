import { useState, type FormEvent } from 'react'
import { Modal } from '../../../shared/components/Modal'
import type { Supplier } from '../api'
import { useCreateSupplier, useUpdateSupplier } from '../hooks/useSuppliers'

interface SupplierFormModalProps {
  editingSupplier: Supplier | null
  onClose: () => void
}

export function SupplierFormModal({ editingSupplier, onClose }: SupplierFormModalProps) {
  const [rucOrDni, setRucOrDni] = useState(editingSupplier?.ruc_or_dni ?? '')
  const [companyName, setCompanyName] = useState(editingSupplier?.company_name ?? '')
  const [phone, setPhone] = useState(editingSupplier?.phone ?? '')
  const [address, setAddress] = useState(editingSupplier?.address ?? '')
  const [error, setError] = useState<string | null>(null)

  const createSupplier = useCreateSupplier()
  const updateSupplier = useUpdateSupplier()
  const isPending = createSupplier.isPending || updateSupplier.isPending

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!rucOrDni.trim() || !companyName.trim()) {
      setError('RUC/DNI y razón social son requeridos.')
      return
    }

    const data = { ruc_or_dni: rucOrDni, company_name: companyName, phone, address }
    const action = editingSupplier
      ? updateSupplier.mutateAsync({ id: editingSupplier.id, data })
      : createSupplier.mutateAsync(data)

    action.then(onClose).catch(() => setError('No se pudo guardar el proveedor.'))
  }

  return (
    <Modal title={editingSupplier ? 'Editar proveedor' : 'Nuevo proveedor'} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <label htmlFor="supplier-ruc">RUC / DNI</label>
          <input
            id="supplier-ruc"
            value={rucOrDni}
            onChange={(event) => setRucOrDni(event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="supplier-name">Razón social</label>
          <input
            id="supplier-name"
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="supplier-phone">Teléfono</label>
          <input
            id="supplier-phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="supplier-address">Dirección</label>
          <input
            id="supplier-address"
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
