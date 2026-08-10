import { CloudOff, History } from 'lucide-react'
import { useMemo, useState } from 'react'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ExportButtons } from '../../../shared/components/ExportButtons'
import { useOnlineStatus } from '../../../shared/offline/useOnlineStatus'
import { formatQuantity } from '../../../shared/utils/format'
import {
  downloadLowStockReport,
  downloadStockValuationReport,
  type Product,
  type Warehouse,
} from '../api'
import { useInventoryMovements } from '../hooks/useStock'

interface KardexTabProps {
  products: Product[]
  warehouses: Warehouse[]
}

const CONCEPT_LABELS: Record<string, string> = {
  PURCHASE: 'Compra',
  SALE: 'Venta',
  ADJUSTMENT: 'Ajuste',
  RETURN: 'Devolución',
  TRANSFER_IN: 'Traslado (entrada)',
  TRANSFER_OUT: 'Traslado (salida)',
}

export function KardexTab({ products, warehouses }: KardexTabProps) {
  const isOnline = useOnlineStatus()
  const [variantId, setVariantId] = useState<number | ''>('')
  const [warehouseId, setWarehouseId] = useState<number | ''>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const variantOptions = useMemo(
    () =>
      products.flatMap((product) =>
        product.variants.map((variant) => ({
          id: variant.id,
          label: `${variant.sku} — ${product.name}`,
        })),
      ),
    [products],
  )

  const { data: movements, isLoading } = useInventoryMovements({
    variant: variantId || undefined,
    warehouse: warehouseId || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  })

  const variantLabel = (id: number) =>
    variantOptions.find((option) => option.id === id)?.label ?? `#${id}`
  const warehouseName = (id: number) =>
    warehouses.find((warehouse) => warehouse.id === id)?.name ?? `#${id}`

  return (
    <div className="card core-table-card">
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', padding: '16px 16px 0' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label htmlFor="kardex-variant">Variante</label>
          <select
            id="kardex-variant"
            value={variantId}
            onChange={(event) => setVariantId(Number(event.target.value) || '')}
          >
            <option value="">Todas</option>
            {variantOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div style={{ flex: '1 1 160px' }}>
          <label htmlFor="kardex-warehouse">Almacén</label>
          <select
            id="kardex-warehouse"
            value={warehouseId}
            onChange={(event) => setWarehouseId(Number(event.target.value) || '')}
          >
            <option value="">Todos</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ flex: '1 1 140px' }}>
          <label htmlFor="kardex-from">Desde</label>
          <input
            id="kardex-from"
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
          />
        </div>
        <div style={{ flex: '1 1 140px' }}>
          <label htmlFor="kardex-to">Hasta</label>
          <input
            id="kardex-to"
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
          />
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          alignItems: 'center',
          padding: '10px 16px 0',
        }}
      >
        <span className="core-page-subtitle" style={{ margin: 0 }}>
          Valorización de stock:
        </span>
        <ExportButtons
          filename="valorizacion_stock"
          onDownload={(format) => downloadStockValuationReport(format, warehouseId || undefined)}
        />
        <span className="core-page-subtitle" style={{ margin: 0 }}>
          Stock bajo mínimo:
        </span>
        <ExportButtons
          filename="stock_bajo_minimo"
          onDownload={(format) => downloadLowStockReport(format)}
        />
      </div>

      {!isOnline && (
        <EmptyState
          icon={<CloudOff />}
          title="El Kardex no está disponible sin conexión"
          subtitle="Se puede seguir vendiendo offline; el historial de movimientos se actualiza al reconectar."
        />
      )}
      {isOnline && isLoading && (
        <div className="loading-row">
          <span className="spinner" />
          Cargando...
        </div>
      )}
      {isOnline && movements && movements.length === 0 && (
        <EmptyState
          icon={<History />}
          title="Sin movimientos"
          subtitle="Ajusta el stock de una variante para ver su historial aquí."
        />
      )}
      {isOnline && movements && movements.length > 0 && (
        <table className="core-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Variante</th>
              <th>Almacén</th>
              <th>Tipo</th>
              <th>Cantidad</th>
              <th>Saldo</th>
              <th>Motivo</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((movement) => (
              <tr key={movement.id}>
                <td>{new Date(movement.created_at).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}</td>
                <td className="core-table-strong">{variantLabel(movement.variant)}</td>
                <td>{warehouseName(movement.warehouse)}</td>
                <td>
                  <span className={`badge ${movement.type === 'IN' ? 'badge-success' : 'badge-danger'}`}>
                    <span className="dot" />
                    {movement.type === 'IN' ? 'Entrada' : 'Salida'}
                  </span>
                </td>
                <td>{formatQuantity(movement.quantity)}</td>
                <td className="core-table-strong">{formatQuantity(movement.resulting_balance)}</td>
                <td>{CONCEPT_LABELS[movement.concept] ?? movement.concept}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
