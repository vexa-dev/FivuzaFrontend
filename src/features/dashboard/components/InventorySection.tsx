import { AlertTriangle, Boxes, PackageSearch, ShoppingBag, Truck } from 'lucide-react'
import { useMemo } from 'react'
import { EmptyState } from '../../../shared/components/EmptyState'
import { formatCurrency } from '../../../shared/utils/format'
import { useProducts } from '../../inventory/hooks/useProducts'
import { usePurchaseOrders } from '../../inventory/hooks/usePurchaseOrders'
import { useSuppliers } from '../../inventory/hooks/useSuppliers'
import { useAllStock, useInventoryMovements } from '../../inventory/hooks/useStock'
import { CapsuleColumns, RankingBars } from './ChartPrimitives'
import { MiniStat, SectionHeader } from './DashboardSection'

const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

/** Todo lo que existe en el modelo de Inventario y no vivia en ningun lado
 * del dashboard: valor de stock inmovilizado, que tan movido estuvo el mes,
 * ordenes de compra por estado, y quienes son los proveedores que mas se
 * llevan del presupuesto de compras -antes habia que entrar a 4 pantallas
 * distintas del modulo para juntar esto a mano. */
export function InventorySection() {
  const { data: stock } = useAllStock()
  const { data: products } = useProducts()
  const { data: movements } = useInventoryMovements({ date_from: THIRTY_DAYS_AGO })
  const { data: purchaseOrders } = usePurchaseOrders()
  const { data: suppliers } = useSuppliers()

  // Valor de inventario -no hay endpoint agregado para esto (ver auditoria),
  // se cruza Stock (cantidad por variante+almacen) con ProductVariant
  // (costo/precio) del lado del cliente, mismo patron que ya usa el resto
  // del archivo para "totales" sin un agregado propio del backend.
  const variantMap = useMemo(() => {
    const map = new Map<number, { cost: number; price: number }>()
    products?.forEach((product) =>
      product.variants.forEach((variant) =>
        map.set(variant.id, { cost: Number(variant.cost), price: Number(variant.price) }),
      ),
    )
    return map
  }, [products])

  const { costValue, retailValue } = useMemo(() => {
    if (!stock) return { costValue: 0, retailValue: 0 }
    return stock.reduce(
      (acc, row) => {
        const variant = variantMap.get(row.variant)
        if (!variant) return acc
        const qty = Number(row.quantity)
        acc.costValue += qty * variant.cost
        acc.retailValue += qty * variant.price
        return acc
      },
      { costValue: 0, retailValue: 0 },
    )
  }, [stock, variantMap])

  const movementCounts = useMemo(() => {
    const counts = { PURCHASE: 0, ADJUSTMENT: 0, RETURN: 0, oversell: 0 }
    movements?.forEach((movement) => {
      if (movement.concept === 'PURCHASE') counts.PURCHASE += 1
      if (movement.concept === 'ADJUSTMENT') counts.ADJUSTMENT += 1
      if (movement.concept === 'RETURN') counts.RETURN += 1
      if (movement.oversell_flag) counts.oversell += 1
    })
    return counts
  }, [movements])

  const poCounts = useMemo(() => {
    const counts = { PENDING: 0, RECEIVED: 0, CANCELLED: 0 }
    purchaseOrders?.forEach((po) => {
      counts[po.status] += 1
    })
    return counts
  }, [purchaseOrders])

  const topSuppliers = useMemo(() => {
    if (!purchaseOrders || !suppliers) return []
    const recentPOs = purchaseOrders.filter((po) => po.created_at.slice(0, 10) >= THIRTY_DAYS_AGO)
    const bySupplier = new Map<number, number>()
    recentPOs.forEach((po) => {
      bySupplier.set(po.supplier, (bySupplier.get(po.supplier) ?? 0) + Number(po.total))
    })
    const supplierName = (id: number) =>
      suppliers.find((s) => s.id === id)?.company_name ?? `Proveedor #${id}`
    return Array.from(bySupplier.entries())
      .map(([supplierId, total]) => ({ name: supplierName(supplierId), total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
  }, [purchaseOrders, suppliers])

  return (
    <div className="dashboard-section">
      <SectionHeader icon={<Boxes size={15} strokeWidth={2} />} title="Inventario" />

      <div className="dashboard-mini-stats-grid">
        <MiniStat
          icon={<Boxes size={13} strokeWidth={2} />}
          label="Valor de inventario (costo)"
          value={formatCurrency(costValue)}
          caption={`Valor a precio de venta: ${formatCurrency(retailValue)}`}
        />
        <MiniStat
          icon={<PackageSearch size={13} strokeWidth={2} />}
          label="Compras recibidas (30 días)"
          value={String(movementCounts.PURCHASE)}
        />
        <MiniStat
          icon={<AlertTriangle size={13} strokeWidth={2} />}
          label="Ajustes de stock (30 días)"
          value={String(movementCounts.ADJUSTMENT)}
          caption={
            movementCounts.oversell > 0
              ? `${movementCounts.oversell} venta(s) con stock insuficiente`
              : undefined
          }
        />
        <MiniStat
          icon={<Truck size={13} strokeWidth={2} />}
          label="Órdenes de compra"
          value={String(poCounts.PENDING)}
          caption={`${poCounts.RECEIVED} recibidas · ${poCounts.CANCELLED} canceladas`}
        />
      </div>

      <div className="dashboard-split-grid">
        <div className="card dashboard-split-card">
          <div style={{ padding: '12px 16px 0' }}>
            <h3 className="card-title">Top proveedores por compras (30 días)</h3>
          </div>
          {topSuppliers.length === 0 ? (
            <EmptyState icon={<ShoppingBag />} title="Sin órdenes de compra en este periodo" />
          ) : (
            <RankingBars
              items={topSuppliers.map((row) => ({ key: row.name, label: row.name, value: row.total }))}
              valueFormatter={formatCurrency}
            />
          )}
        </div>

        <div className="card dashboard-split-card">
          <div style={{ padding: '12px 16px 0' }}>
            <h3 className="card-title">Movimientos por tipo (30 días)</h3>
          </div>
          <CapsuleColumns
            items={[
              { key: 'PURCHASE', label: 'Compras', value: movementCounts.PURCHASE },
              { key: 'ADJUSTMENT', label: 'Ajustes', value: movementCounts.ADJUSTMENT },
              { key: 'RETURN', label: 'Devoluciones', value: movementCounts.RETURN },
              { key: 'oversell', label: 'Oversell', value: movementCounts.oversell },
            ]}
          />
        </div>
      </div>
    </div>
  )
}
