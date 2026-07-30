import { PackageCheck } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { ApiError } from '../../../shared/utils/apiClient'
import type { Product, Warehouse } from '../api'
import { useAdjustStock, useStock } from '../hooks/useStock'

interface StockAdjustTabProps {
  products: Product[]
  warehouses: Warehouse[]
}

const CONCEPT_LABELS: Record<string, string> = {
  ADJUSTMENT: 'Ajuste manual / conteo físico',
  PURCHASE: 'Ingreso por compra',
  RETURN: 'Devolución',
}

export function StockAdjustTab({ products, warehouses }: StockAdjustTabProps) {
  const [search, setSearch] = useState('')
  const [variantId, setVariantId] = useState<number | ''>('')
  const [warehouseId, setWarehouseId] = useState<number | ''>(warehouses[0]?.id ?? '')
  const [countedQuantity, setCountedQuantity] = useState('')
  const [concept, setConcept] = useState<'ADJUSTMENT' | 'PURCHASE' | 'RETURN'>('ADJUSTMENT')
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

  const { data: stockRows } = useStock(
    variantId && warehouseId ? { variant: variantId, warehouse: warehouseId } : undefined,
  )
  const systemQuantity = stockRows?.[0]?.quantity ?? '0'

  const adjustStock = useAdjustStock()

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (!variantId || !warehouseId || countedQuantity === '') {
      setError('Selecciona variante, almacén y cantidad contada.')
      return
    }

    adjustStock
      .mutateAsync({
        variant: variantId,
        warehouse: warehouseId,
        counted_quantity: countedQuantity,
        concept,
      })
      .then(() => {
        setSuccess('Stock actualizado correctamente.')
        setCountedQuantity('')
      })
      .catch((err: unknown) => {
        const body = err instanceof ApiError ? (err.body as { detail?: string }) : null
        setError(body?.detail ?? 'No se pudo registrar el ajuste.')
      })
  }

  return (
    <div className="card" style={{ maxWidth: 480 }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label htmlFor="stock-search">Buscar variante</label>
          <input
            id="stock-search"
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
          <label htmlFor="stock-variant">Variante</label>
          <select
            id="stock-variant"
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
          <label htmlFor="stock-warehouse">Almacén</label>
          <select
            id="stock-warehouse"
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

        {variantId && warehouseId && (
          <p className="core-page-subtitle" style={{ margin: 0 }}>
            Cantidad en sistema: <strong style={{ color: 'var(--text-primary)' }}>{systemQuantity}</strong>
          </p>
        )}

        <div>
          <label htmlFor="stock-counted">Cantidad contada</label>
          <input
            id="stock-counted"
            value={countedQuantity}
            onChange={(event) => setCountedQuantity(event.target.value)}
            inputMode="decimal"
            placeholder="0"
          />
        </div>

        <div>
          <label htmlFor="stock-concept">Motivo</label>
          <select
            id="stock-concept"
            value={concept}
            onChange={(event) => setConcept(event.target.value as typeof concept)}
          >
            {Object.entries(CONCEPT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p style={{ color: 'var(--success)', fontSize: '0.8125rem', margin: 0 }}>
            <PackageCheck size={14} strokeWidth={2} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            {success}
          </p>
        )}

        <button type="submit" className="btn btn-primary" disabled={adjustStock.isPending}>
          {adjustStock.isPending ? 'Guardando...' : 'Registrar ajuste'}
        </button>
      </form>
    </div>
  )
}
