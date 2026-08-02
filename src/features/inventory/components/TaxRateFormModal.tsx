import { useState, type FormEvent } from 'react'
import { Modal } from '../../../shared/components/Modal'
import type { TaxRate } from '../api'
import { useCreateTaxRate, useUpdateTaxRate } from '../hooks/useTaxRates'

interface TaxRateFormModalProps {
  editingTaxRate: TaxRate | null
  onClose: () => void
}

export function TaxRateFormModal({ editingTaxRate, onClose }: TaxRateFormModalProps) {
  const [name, setName] = useState(editingTaxRate?.name ?? '')
  const [percentage, setPercentage] = useState(editingTaxRate?.percentage ?? '')
  const [error, setError] = useState<string | null>(null)

  const createTaxRate = useCreateTaxRate()
  const updateTaxRate = useUpdateTaxRate()
  const isPending = createTaxRate.isPending || updateTaxRate.isPending

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!name.trim() || !percentage) {
      setError('Nombre y porcentaje son requeridos.')
      return
    }

    const data = { name, percentage }
    const action = editingTaxRate
      ? updateTaxRate.mutateAsync({ id: editingTaxRate.id, data })
      : createTaxRate.mutateAsync(data)

    action.then(onClose).catch(() => setError('No se pudo guardar el impuesto.'))
  }

  return (
    <Modal title={editingTaxRate ? 'Editar impuesto' : 'Nuevo impuesto'} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <label htmlFor="tax-name">Nombre</label>
          <input
            id="tax-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="IGV"
          />
        </div>

        <div>
          <label htmlFor="tax-percentage">Porcentaje</label>
          <input
            id="tax-percentage"
            value={percentage}
            onChange={(event) => setPercentage(event.target.value)}
            placeholder="18.00"
            inputMode="decimal"
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
