import { Ban, PackageSearch, ShoppingCart } from 'lucide-react'
import { useMemo, useState } from 'react'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ApiError } from '../../../shared/utils/apiClient'
import type { Product } from '../../inventory/api'
import type { ProductReservation } from '../api'
import { useCustomers } from '../hooks/useCustomers'
import {
  useCancelReservation,
  useConvertReservation,
  useCreateReservation,
  useReservations,
} from '../hooks/useReservations'
import { ConvertToSaleModal } from './ConvertToSaleModal'

const STATUS_LABELS: Record<ProductReservation['status'], string> = {
  ACTIVE: 'Activa',
  CONVERTED: 'Convertida',
  EXPIRED: 'Vencida',
  CANCELLED: 'Cancelada',
}

const STATUS_BADGE: Record<ProductReservation['status'], string> = {
  ACTIVE: 'badge-success',
  CONVERTED: 'badge-neutral',
  EXPIRED: 'badge-danger',
  CANCELLED: 'badge-danger',
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })
}

interface ReservationsTabProps {
  products: Product[]
  warehouses: { id: number; name: string }[]
}

export function ReservationsTab({ products, warehouses }: ReservationsTabProps) {
  const [statusFilter, setStatusFilter] = useState<ProductReservation['status'] | ''>('ACTIVE')
  const { data: reservations, isLoading } = useReservations(
    statusFilter ? { status: statusFilter } : undefined,
  )
  const { data: customers } = useCustomers()
  const cancelReservation = useCancelReservation()
  const [convertingId, setConvertingId] = useState<number | null>(null)

  const variantLabel = (variantId: number) => {
    for (const product of products) {
      const variant = product.variants.find((v) => v.id === variantId)
      if (variant) return `${variant.sku} — ${product.name}`
    }
    return `#${variantId}`
  }
  const customerName = (customerId: number) =>
    customers?.find((c) => c.id === customerId)?.name ?? `#${customerId}`
  const warehouseName = (warehouseId: number) =>
    warehouses.find((w) => w.id === warehouseId)?.name ?? `#${warehouseId}`

  const convertingReservation = reservations?.find((r) => r.id === convertingId) ?? null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ReservationFormCard products={products} warehouses={warehouses} />

      <div className="card core-table-card">
        <div className="table-toolbar">
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as ProductReservation['status'] | '')
            }
            style={{ maxWidth: 200 }}
          >
            <option value="">Todos los estados</option>
            {(Object.keys(STATUS_LABELS) as ProductReservation['status'][]).map((value) => (
              <option key={value} value={value}>
                {STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        {isLoading && (
          <div className="loading-row">
            <span className="spinner" />
            Cargando...
          </div>
        )}
        {reservations && reservations.length === 0 && (
          <EmptyState icon={<PackageSearch />} title="Sin apartados en este estado" />
        )}
        {reservations && reservations.length > 0 && (
          <table className="core-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Producto</th>
                <th>Almacén</th>
                <th>Cantidad</th>
                <th>Vence</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((reservation) => (
                <tr key={reservation.id}>
                  <td>{customerName(reservation.customer)}</td>
                  <td>{variantLabel(reservation.variant)}</td>
                  <td>{warehouseName(reservation.warehouse)}</td>
                  <td>{reservation.quantity}</td>
                  <td>{formatDate(reservation.expires_at)}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[reservation.status]}`}>
                      <span className="dot" />
                      {STATUS_LABELS[reservation.status]}
                    </span>
                  </td>
                  <td>
                    {reservation.status === 'ACTIVE' && (
                      <div className="row-actions">
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => setConvertingId(reservation.id)}
                        >
                          <ShoppingCart size={14} strokeWidth={2} />
                          Vender
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger-ghost btn-sm btn-icon"
                          aria-label="Cancelar apartado"
                          onClick={() => {
                            if (confirm('¿Cancelar este apartado?')) {
                              cancelReservation.mutate(reservation.id)
                            }
                          }}
                        >
                          <Ban />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {convertingReservation && (
        <ConvertReservationModal
          reservation={convertingReservation}
          total={(
            Number(
              products
                .flatMap((p) => p.variants)
                .find((v) => v.id === convertingReservation.variant)?.price ?? 0,
            ) * Number(convertingReservation.quantity)
          ).toFixed(2)}
          onClose={() => setConvertingId(null)}
        />
      )}
    </div>
  )
}

function ConvertReservationModal({
  reservation,
  total,
  onClose,
}: {
  reservation: ProductReservation
  total: string
  onClose: () => void
}) {
  const convertReservation = useConvertReservation()
  const [error, setError] = useState<string | null>(null)

  return (
    <ConvertToSaleModal
      title="Convertir apartado en venta"
      total={total}
      isSubmitting={convertReservation.isPending}
      error={error}
      onClose={onClose}
      onConfirm={(cashSessionId, payments) => {
        setError(null)
        convertReservation
          .mutateAsync({ id: reservation.id, data: { cash_session_id: cashSessionId, payments } })
          .then(onClose)
          .catch((err: unknown) => {
            const body = err instanceof ApiError ? (err.body as { error?: { message?: string } }) : null
            setError(body?.error?.message ?? 'No se pudo registrar la venta.')
          })
      }}
    />
  )
}

function ReservationFormCard({
  products,
  warehouses,
}: {
  products: Product[]
  warehouses: { id: number; name: string }[]
}) {
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerId, setCustomerId] = useState<number | ''>('')
  const { data: customers } = useCustomers(customerSearch)
  const selectedCustomer = customers?.find((c) => c.id === customerId)

  const [variantSearch, setVariantSearch] = useState('')
  const [variantId, setVariantId] = useState<number | ''>('')
  const [warehouseId, setWarehouseId] = useState<number | ''>(warehouses[0]?.id ?? '')
  const [quantity, setQuantity] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const createReservation = useCreateReservation()

  const variantOptions = useMemo(() => {
    const term = variantSearch.trim().toLowerCase()
    const rows = products.flatMap((product) =>
      product.variants.map((variant) => ({
        id: variant.id,
        label: `${variant.sku} — ${product.name}`,
      })),
    )
    if (!term) return rows.slice(0, 20)
    return rows.filter((row) => row.label.toLowerCase().includes(term)).slice(0, 20)
  }, [products, variantSearch])

  const handleSubmit = () => {
    setError(null)
    setSuccess(null)
    if (!customerId || !variantId || !warehouseId || !quantity || !expiresAt) {
      setError('Completa cliente, producto, almacén, cantidad y vencimiento.')
      return
    }
    createReservation
      .mutateAsync({
        customer_id: customerId,
        variant_id: variantId,
        warehouse_id: warehouseId,
        quantity,
        expires_at: new Date(expiresAt).toISOString(),
      })
      .then(() => {
        setSuccess('Apartado registrado.')
        setQuantity('')
      })
      .catch((err: unknown) => {
        const body = err instanceof ApiError ? (err.body as { error?: { message?: string } }) : null
        setError(body?.error?.message ?? 'No se pudo registrar el apartado.')
      })
  }

  return (
    <div className="card" style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p className="core-page-subtitle" style={{ margin: 0, fontWeight: 600 }}>
        Nuevo apartado
      </p>

      <div>
        <label htmlFor="reservation-customer-search">Cliente</label>
        <input
          id="reservation-customer-search"
          value={selectedCustomer ? selectedCustomer.name : customerSearch}
          onChange={(event) => {
            setCustomerSearch(event.target.value)
            setCustomerId('')
          }}
          placeholder="Buscar por documento o nombre..."
          autoComplete="off"
        />
        {!selectedCustomer && customerSearch.trim() && customers && customers.length > 0 && (
          <div className="card" style={{ marginTop: 4, maxHeight: 160, overflowY: 'auto' }}>
            {customers.map((customer) => (
              <button
                key={customer.id}
                type="button"
                className="btn btn-ghost"
                style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 0 }}
                onClick={() => {
                  setCustomerId(customer.id)
                  setCustomerSearch('')
                }}
              >
                {customer.name} · {customer.document_number}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="reservation-variant-search">Buscar variante</label>
        <input
          id="reservation-variant-search"
          value={variantSearch}
          onChange={(event) => {
            setVariantSearch(event.target.value)
            setVariantId('')
          }}
          placeholder="SKU o nombre del producto"
          autoComplete="off"
        />
      </div>

      <div>
        <label htmlFor="reservation-variant">Variante</label>
        <select
          id="reservation-variant"
          value={variantId}
          onChange={(event) => setVariantId(Number(event.target.value) || '')}
        >
          <option value="">Selecciona una variante</option>
          {variantOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <label htmlFor="reservation-warehouse">Almacén</label>
          <select
            id="reservation-warehouse"
            value={warehouseId}
            onChange={(event) => setWarehouseId(Number(event.target.value) || '')}
          >
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="reservation-quantity">Cantidad</label>
          <input
            id="reservation-quantity"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            inputMode="decimal"
            placeholder="0"
          />
        </div>
      </div>

      <div>
        <label htmlFor="reservation-expires">Vence</label>
        <input
          id="reservation-expires"
          type="datetime-local"
          value={expiresAt}
          onChange={(event) => setExpiresAt(event.target.value)}
        />
      </div>

      {error && (
        <p className="login-error" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p style={{ color: 'var(--success)', fontSize: '0.8125rem', margin: 0 }}>{success}</p>
      )}

      <button
        type="button"
        className="btn btn-primary"
        onClick={handleSubmit}
        disabled={createReservation.isPending}
      >
        {createReservation.isPending ? 'Guardando...' : 'Apartar'}
      </button>
    </div>
  )
}
