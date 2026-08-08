import { PackageSearch, Search, Tag } from 'lucide-react'
import { useMemo, useState } from 'react'
import { EmptyState } from '../../../shared/components/EmptyState'
import type { POSCatalogItem } from '../api'
import { useCart } from '../cart/useCart'
import { useCashRegisters, useOpenCashSessions } from '../hooks/useCashSessions'
import { usePOSCatalog } from '../hooks/usePOSCatalog'
import './POS.css'
import { OfflineSyncStatus } from './OfflineSyncStatus'
import { POSCartPanel } from './POSCartPanel'

function promotionBadge(item: POSCatalogItem): string | null {
  if (!item.promotion) return null
  return item.promotion.type === 'PERCENTAGE'
    ? `-${Number(item.promotion.value)}%`
    : `-S/ ${Number(item.promotion.value).toFixed(2)}`
}

export function POSTab() {
  const { data: openSessions, isLoading: loadingSessions } = useOpenCashSessions()
  const { data: registers } = useCashRegisters()
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const { state, totals, dispatch } = useCart()

  const sessionId = selectedSessionId ?? openSessions?.[0]?.id
  const session = openSessions?.find((s) => s.id === sessionId)
  const warehouseId = registers?.find((r) => r.id === session?.cash_register)?.warehouse

  const { data: catalog, isLoading: loadingCatalog } = usePOSCatalog(warehouseId)

  const filtered = useMemo(() => {
    if (!catalog) return []
    const query = search.trim().toLowerCase()
    if (!query) return catalog

    const exactBarcode = catalog.find((item) => item.barcode === search.trim())
    if (exactBarcode) return [exactBarcode]

    return catalog.filter(
      (item) =>
        item.sku.toLowerCase().includes(query) || item.product_name.toLowerCase().includes(query),
    )
  }, [catalog, search])

  if (loadingSessions) {
    return (
      <div className="loading-row">
        <span className="spinner" />
        Cargando...
      </div>
    )
  }

  if (!openSessions || openSessions.length === 0) {
    return (
      <EmptyState
        icon={<PackageSearch />}
        title="No hay una caja abierta"
        subtitle='Abre una caja en la pestaña "Caja actual" antes de vender.'
      />
    )
  }

  return (
    <div className="pos-layout">
      <div className="card pos-catalog-panel">
        <OfflineSyncStatus />

        {openSessions.length > 1 && (
          <div>
            <label htmlFor="pos-session">Caja</label>
            <select
              id="pos-session"
              value={sessionId}
              onChange={(event) => setSelectedSessionId(Number(event.target.value))}
            >
              {openSessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {registers?.find((r) => r.id === s.cash_register)?.name ?? `Caja #${s.cash_register}`}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="pos-search-bar">
          <Search />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Escanea un código de barras o busca por nombre/SKU..."
            autoFocus
          />
        </div>

        {loadingCatalog && (
          <div className="loading-row">
            <span className="spinner" />
            Cargando...
          </div>
        )}

        {!loadingCatalog && filtered.length === 0 && (
          <EmptyState
            icon={<PackageSearch />}
            title="Sin resultados"
            subtitle="Prueba con otro nombre, SKU o código de barras."
          />
        )}

        <div className="pos-product-grid">
          {filtered.map((item) => {
            const badge = promotionBadge(item)
            const outOfStock = Number(item.stock) <= 0
            return (
              <button
                key={item.id}
                type="button"
                className="card pos-product-card"
                disabled={outOfStock}
                onClick={() => {
                  dispatch({
                    type: 'ADD_LINE',
                    line: {
                      variantId: item.id,
                      sku: item.sku,
                      productName: item.product_name,
                      basePrice: item.price,
                      pricingTiers: item.pricing_tiers,
                      unitOfMeasure: item.unit_of_measure,
                    },
                  })
                  setSearch('')
                }}
              >
                <div className="pos-product-card-header">
                  <div>
                    <div className="pos-product-card-name">{item.product_name}</div>
                    <div className="pos-product-card-sku">{item.sku}</div>
                  </div>
                  {badge && (
                    <span className="badge badge-success pos-promo-badge">
                      <Tag size={11} strokeWidth={2} />
                      {badge}
                    </span>
                  )}
                </div>
                <div className="pos-product-card-footer">
                  <span className="pos-product-card-price">S/ {item.price}</span>
                  <span className="pos-product-card-stock">
                    {outOfStock ? 'Sin stock' : `Stock: ${Number(item.stock)}`}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <POSCartPanel cart={state} totals={totals} dispatch={dispatch} cashSessionId={sessionId} />
    </div>
  )
}
