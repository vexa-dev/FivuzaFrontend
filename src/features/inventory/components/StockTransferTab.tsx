import { ArrowRightLeft } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { ApiError } from '../../../shared/utils/apiClient'
import type { Product, Warehouse } from '../api'
import { useStock, useTransferStock } from '../hooks/useStock'

interface StockTransferTabProps {
  products: Product[]
  warehouses: Warehouse[]
}

export function StockTransferTab({ products, warehouses }: StockTransferTabProps) {
  const [search, setSearch] = useState('')
  const [variantId, setVariantId] = useState<number | ''>('')
  const [fromWarehouseId, setFromWarehouseId] = useState<number | ''>(warehouses[0]?.id ?? '')
  const [toWarehouseId, setToWarehouseId] = useState<number | ''>(warehouses[1]?.id ?? '')
  const [quantity, setQuantity] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const variantOptions = useMemo(() => {
    const term = search.trim().toLowerCase()
    const rows = products.flatMap((product) =>
      product.variants.map((variant) => ({
        id: variant.id,
        label: `${variant.sku} — ${product.name}`,
      })),
    )
    if (!term) return rows.slice(0, 20)
    return rows.filter((row) => row.label.toLowerCase().includes(term)).slice(0, 20)
  }, [products, search])

  const { data: originStockRows } = useStock(
    variantId && fromWarehouseId ? { variant: variantId, warehouse: fromWarehouseId } : undefined,
  )
  const originQuantity = originStockRows?.[0]?.quantity ?? '0'

  const transferStock = useTransferStock()

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (!variantId || !fromWarehouseId || !toWarehouseId || quantity === '') {
      setError('Selecciona variante, almacén de origen, almacén de destino y cantidad.')
      return
    }
    if (fromWarehouseId === toWarehouseId) {
      setError('El almacén de origen y destino deben ser distintos.')
      return
    }

    transferStock
      .mutateAsync({
        variant: variantId,
        from_warehouse: fromWarehouseId,
        to_warehouse: toWarehouseId,
        quantity,
      })
      .then(() => {
        setSuccess('Traslado registrado correctamente.')
        setQuantity('')
      })
      .catch((err: unknown) => {
        const body = err instanceof ApiError ? (err.body as { detail?: string }) : null
        setError(body?.detail ?? 'No se pudo registrar el traslado.')
      })
  }

  return (
    <div className="card" style={{ maxWidth: 480 }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label htmlFor="transfer-search">Buscar variante</label>
          <input
            id="transfer-search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setVariantId('')
            }}
            placeholder="SKU o nombre del producto"
            autoComplete="off"
          />
        </div>

        <div>
          <label htmlFor="transfer-variant">Variante</label>
          <select
            id="transfer-variant"
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

        <div>
          <label htmlFor="transfer-from">Almacén de origen</label>
          <select
            id="transfer-from"
            value={fromWarehouseId}
            onChange={(event) => setFromWarehouseId(Number(event.target.value) || '')}
          >
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </select>
        </div>

        {variantId && fromWarehouseId && (
          <p className="core-page-subtitle" style={{ margin: 0 }}>
            Cantidad disponible en origen:{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{originQuantity}</strong>
          </p>
        )}

        <div>
          <label htmlFor="transfer-to">Almacén de destino</label>
          <select
            id="transfer-to"
            value={toWarehouseId}
            onChange={(event) => setToWarehouseId(Number(event.target.value) || '')}
          >
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="transfer-quantity">Cantidad a trasladar</label>
          <input
            id="transfer-quantity"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            inputMode="decimal"
            placeholder="0"
          />
        </div>

        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p style={{ color: 'var(--success)', fontSize: '0.8125rem', margin: 0 }}>
            <ArrowRightLeft
              size={14}
              strokeWidth={2}
              style={{ verticalAlign: 'middle', marginRight: 4 }}
            />
            {success}
          </p>
        )}

        <button type="submit" className="btn btn-primary" disabled={transferStock.isPending}>
          {transferStock.isPending ? 'Guardando...' : 'Registrar traslado'}
        </button>
      </form>
    </div>
  )
}
