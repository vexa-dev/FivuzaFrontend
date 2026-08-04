import { useState, type FormEvent } from 'react'
import { Modal } from '../../../shared/components/Modal'
import type { Promotion, PromotionType } from '../api'
import { useCreatePromotion, useUpdatePromotion } from '../hooks/usePromotions'

interface PromotionFormModalProps {
  editingPromotion: Promotion | null
  onClose: () => void
}

function toDateInputValue(value: string) {
  return value ? value.slice(0, 10) : ''
}

export function PromotionFormModal({ editingPromotion, onClose }: PromotionFormModalProps) {
  const [name, setName] = useState(editingPromotion?.name ?? '')
  const [type, setType] = useState<PromotionType>(editingPromotion?.type ?? 'PERCENTAGE')
  const [value, setValue] = useState(editingPromotion?.value ?? '')
  const [startDate, setStartDate] = useState(toDateInputValue(editingPromotion?.start_date ?? ''))
  const [endDate, setEndDate] = useState(toDateInputValue(editingPromotion?.end_date ?? ''))
  const [isActive, setIsActive] = useState(editingPromotion?.is_active ?? true)
  const [error, setError] = useState<string | null>(null)

  const createPromotion = useCreatePromotion()
  const updatePromotion = useUpdatePromotion()
  const isPending = createPromotion.isPending || updatePromotion.isPending

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!name.trim() || !value.trim() || !startDate || !endDate) {
      setError('Nombre, valor y vigencia son requeridos.')
      return
    }
    if (startDate > endDate) {
      setError('La fecha de inicio no puede ser posterior a la de fin.')
      return
    }

    const data = {
      name,
      type,
      value,
      start_date: `${startDate}T00:00:00Z`,
      end_date: `${endDate}T23:59:59Z`,
      is_active: isActive,
    }
    const action = editingPromotion
      ? updatePromotion.mutateAsync({ id: editingPromotion.id, data })
      : createPromotion.mutateAsync(data)

    action.then(onClose).catch(() => setError('No se pudo guardar la promoción.'))
  }

  return (
    <Modal title={editingPromotion ? 'Editar promoción' : 'Nueva promoción'} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <label htmlFor="promotion-name">Nombre</label>
          <input
            id="promotion-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="promotion-type">Tipo de descuento</label>
            <select
              id="promotion-type"
              value={type}
              onChange={(event) => setType(event.target.value as PromotionType)}
            >
              <option value="PERCENTAGE">Porcentaje</option>
              <option value="FIXED_AMOUNT">Monto fijo</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="promotion-value">
              {type === 'PERCENTAGE' ? 'Porcentaje (%)' : 'Monto (S/)'}
            </label>
            <input
              id="promotion-value"
              inputMode="decimal"
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="promotion-start">Desde</label>
            <input
              id="promotion-start"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="promotion-end">Hasta</label>
            <input
              id="promotion-end"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </div>
        </div>

        <label className="settings-toggle-row">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
          />
          <span>Activa</span>
        </label>

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
