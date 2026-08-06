import { PackageSearch, Search, Tag } from 'lucide-react'
import { useMemo, useState } from 'react'
import { EmptyState } from '../../../shared/components/EmptyState'
import type { POSCatalogItem } from '../api'
import { useCart } from '../cart/useCart'
import { useCashRegisters, useOpenCashSessions } from '../hooks/useCashSessions'
import { usePOSCatalog } from '../hooks/usePOSCatalog'
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
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(320px, 1fr)', gap: 16 }}>
      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
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

        <div className="table-toolbar" style={{ padding: 0 }}>
          <div className="search-input" style={{ maxWidth: 'none' }}>
            <Search />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Escanea un código de barras o busca por nombre/SKU..."
              autoFocus
              style={{ fontSize: '1.05rem', padding: '12px 12px 12px 34px' }}
            />
          </div>
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

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: 10,
            overflowY: 'auto',
          }}
        >
          {filtered.map((item) => {
            const badge = promotionBadge(item)
            const outOfStock = Number(item.stock) <= 0
            return (
              <button
                key={item.id}
                type="button"
                className="card"
                disabled={outOfStock}
                style={{
                  padding: 12,
                  textAlign: 'left',
                  cursor: outOfStock ? 'not-allowed' : 'pointer',
                  opacity: outOfStock ? 0.5 : 1,
                  position: 'relative',
                  minHeight: 88,
                }}
                onClick={() => {
                  dispatch({
                    type: 'ADD_LINE',
                    line: {
                      variantId: item.id,
                      sku: item.sku,
                      productName: item.product_name,
                      unitPrice: item.price,
                    },
                  })
                  setSearch('')
                }}
              >
                {badge && (
                  <span
                    className="badge badge-success"
                    style={{ position: 'absolute', top: 8, right: 8 }}
                  >
                    <Tag size={11} strokeWidth={2} />
                    {badge}
                  </span>
                )}
                <div className="core-table-strong">{item.product_name}</div>
                <div className="core-page-subtitle" style={{ margin: '2px 0' }}>
                  {item.sku}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 700 }}>S/ {item.price}</span>
                  <span className="core-page-subtitle" style={{ margin: 0 }}>
                    Stock: {Number(item.stock)}
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
