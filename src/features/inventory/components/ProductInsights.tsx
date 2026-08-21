import { BadgeCheck, CircleDollarSign, TriangleAlert } from 'lucide-react'
import { formatCurrency, formatQuantity } from '../../../shared/utils/format'
import type { Product, Warehouse } from '../api'
import { UNIT_LABELS } from './ProductsTab.model'

export interface InventoryInsights {
  costValue: number
  saleValue: number
  reorderUnits: number
  missingImages: number
  missingBarcodes: number
  inactiveVariants: number
  mostUrgent: { sku: string; shortage: number }
}

interface ProductInsightsProps {
  product: Product
  selectedWarehouse?: Warehouse
  stockAlerts: { out: number; low: number }
  inventory: InventoryInsights
}

export function ProductInsights({
  product,
  selectedWarehouse,
  stockAlerts,
  inventory,
}: ProductInsightsProps) {
  const catalogIssueCount =
    inventory.missingImages + inventory.missingBarcodes + inventory.inactiveVariants

  return (
    <aside className="products-detail-insights" aria-label="Resumen de inventario">
      <section className="products-insight-card" aria-label="Alertas y reposición">
        <header><TriangleAlert size={15} /><strong>Alertas y reposición</strong></header>
        <div className="products-alert-summary">
          <span><strong className={stockAlerts.out > 0 ? 'products-stock-low' : ''}>{stockAlerts.out}</strong><small>Agotadas</small></span>
          <span><strong className={stockAlerts.low > 0 ? 'products-stock-low' : ''}>{stockAlerts.low}</strong><small>Stock bajo</small></span>
        </div>
        {inventory.reorderUnits > 0 ? (
          <div className="products-replenishment">
            <span><small>Reposición sugerida</small><strong>{formatQuantity(inventory.reorderUnits)} {UNIT_LABELS[product.unit_of_measure].toLowerCase()}</strong></span>
            <p>Prioridad: <strong>{inventory.mostUrgent.sku}</strong> · faltan {formatQuantity(inventory.mostUrgent.shortage)}</p>
          </div>
        ) : (
          <p className="products-insight-ok">Stock por encima de los mínimos.</p>
        )}
      </section>

      <section className="products-insight-card" aria-label="Valor del inventario">
        <header><CircleDollarSign size={15} /><strong>Valor del inventario</strong></header>
        <p className="products-insight-context">{selectedWarehouse?.name ?? 'Todos los almacenes'}</p>
        <dl className="products-commercial-list products-inventory-value-list">
          <div><dt>Valor al costo</dt><dd>{formatCurrency(inventory.costValue)}</dd></div>
          <div><dt>Venta potencial</dt><dd>{formatCurrency(inventory.saleValue)}</dd></div>
          <div className="products-value-highlight"><dt>Ganancia potencial</dt><dd>{formatCurrency(inventory.saleValue - inventory.costValue)}</dd></div>
        </dl>
      </section>

      <section className="products-insight-card" aria-label="Calidad del catálogo">
        <header><BadgeCheck size={15} /><strong>Calidad del catálogo</strong></header>
        <div className="products-quality-summary products-quality-summary-standalone">
          <span><strong>Estado</strong><small>{catalogIssueCount === 0 ? 'Completo' : catalogIssueCount === 1 ? '1 observación' : `${catalogIssueCount} observaciones`}</small></span>
          <ul>
            <li><span>Sin imagen</span><strong className={inventory.missingImages ? 'products-quality-warning' : ''}>{inventory.missingImages}</strong></li>
            <li><span>Sin código</span><strong className={inventory.missingBarcodes ? 'products-quality-warning' : ''}>{inventory.missingBarcodes}</strong></li>
            <li><span>Inactivas</span><strong className={inventory.inactiveVariants ? 'products-quality-warning' : ''}>{inventory.inactiveVariants}</strong></li>
          </ul>
        </div>
      </section>
    </aside>
  )
}
