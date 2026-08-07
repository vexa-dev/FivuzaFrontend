import { useState, type FormEvent } from 'react'
import { Modal } from '../../../shared/components/Modal'
import type { Customer, CustomerDocumentType } from '../api'
import { useCreateCustomer, useUpdateCustomer } from '../hooks/useCustomers'

interface CustomerFormModalProps {
  editingCustomer: Customer | null
  onClose: () => void
}

const DOCUMENT_TYPES: [CustomerDocumentType, string][] = [
  ['DNI', 'DNI'],
  ['RUC', 'RUC'],
  ['ANONIMO', 'Anónimo'],
]

export function CustomerFormModal({ editingCustomer, onClose }: CustomerFormModalProps) {
  const [documentType, setDocumentType] = useState<CustomerDocumentType>(
    editingCustomer?.document_type ?? 'DNI',
  )
  const [documentNumber, setDocumentNumber] = useState(editingCustomer?.document_number ?? '')
  const [name, setName] = useState(editingCustomer?.name ?? '')
  const [phone, setPhone] = useState(editingCustomer?.phone ?? '')
  const [address, setAddress] = useState(editingCustomer?.address ?? '')
  const [creditLimit, setCreditLimit] = useState(editingCustomer?.credit_limit ?? '')
  const [error, setError] = useState<string | null>(null)

  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()
  const isPending = createCustomer.isPending || updateCustomer.isPending

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!documentNumber.trim() || !name.trim()) {
      setError('Documento y nombre son requeridos.')
      return
    }

    const data = {
      document_type: documentType,
      document_number: documentNumber,
      name,
      phone,
      address,
      is_active: true,
      credit_limit: creditLimit.trim() === '' ? null : creditLimit,
    }
    const action = editingCustomer
      ? updateCustomer.mutateAsync({ id: editingCustomer.id, data })
      : createCustomer.mutateAsync(data)

    action.then(onClose).catch(() => setError('No se pudo guardar el cliente.'))
  }

  return (
    <Modal title={editingCustomer ? 'Editar cliente' : 'Nuevo cliente'} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="customer-document-type">Tipo de documento</label>
            <select
              id="customer-document-type"
              value={documentType}
              onChange={(event) => setDocumentType(event.target.value as CustomerDocumentType)}
            >
              {DOCUMENT_TYPES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: 2 }}>
            <label htmlFor="customer-document-number">Número de documento</label>
            <input
              id="customer-document-number"
              value={documentNumber}
              onChange={(event) => setDocumentNumber(event.target.value)}
            />
          </div>
        </div>

        <div>
          <label htmlFor="customer-name">Nombre</label>
          <input id="customer-name" value={name} onChange={(event) => setName(event.target.value)} />
        </div>

        <div>
          <label htmlFor="customer-phone">Teléfono</label>
          <input
            id="customer-phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="customer-address">Dirección</label>
          <input
            id="customer-address"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="customer-credit-limit">Límite de crédito (opcional)</label>
          <input
            id="customer-credit-limit"
            inputMode="decimal"
            value={creditLimit ?? ''}
            onChange={(event) => setCreditLimit(event.target.value)}
            placeholder="Sin límite"
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
