import { PackageCheck, Plus, ShoppingBag } from 'lucide-react'
import { useState } from 'react'
import { EmptyState } from '../../../shared/components/EmptyState'
import { formatCurrency } from '../../../shared/utils/format'
import type { Product, Supplier, Warehouse } from '../api'
import { usePurchaseOrders, useReceivePurchaseOrder } from '../hooks/usePurchaseOrders'
import { PurchaseOrderFormModal } from './PurchaseOrderFormModal'

interface PurchaseOrdersTabProps {
  canManage: boolean
  suppliers: Supplier[]
  warehouses: Warehouse[]
  products: Product[]
}

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'badge-warning',
  RECEIVED: 'badge-success',
  CANCELLED: 'badge-neutral',
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente',
  RECEIVED: 'Recibida',
  CANCELLED: 'Cancelada',
}

export function PurchaseOrdersTab({
  canManage,
  suppliers,
  warehouses,
  products,
}: PurchaseOrdersTabProps) {
  const { data: orders, isLoading } = usePurchaseOrders()
  const receiveOrder = useReceivePurchaseOrder()
  const [showForm, setShowForm] = useState(false)

  const supplierName = (id: number) =>
    suppliers.find((supplier) => supplier.id === id)?.company_name ?? '—'
  const warehouseName = (id: number) =>
    warehouses.find((warehouse) => warehouse.id === id)?.name ?? '—'

  return (
    <div className="card core-table-card">
      {canManage && (
        <div className="table-toolbar" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={15} strokeWidth={2.5} />
            Nueva orden de compra
          </button>
        </div>
      )}

      {isLoading && (
        <div className="loading-row">
          <span className="spinner" />
          Cargando...
        </div>
      )}
      {orders && orders.length === 0 && (
        <EmptyState
          icon={<ShoppingBag />}
          title="Todavía no hay órdenes de compra"
          subtitle={canManage ? 'Crea la primera con "Nueva orden de compra".' : undefined}
        />
      )}
      {orders && orders.length > 0 && (
        <table className="core-table">
          <thead>
            <tr>
              <th>Proveedor</th>
              <th>Almacén</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Fecha</th>
              {canManage && <th></th>}
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="core-table-strong">{supplierName(order.supplier)}</td>
                <td>{warehouseName(order.warehouse)}</td>
                <td>{formatCurrency(order.total)}</td>
                <td>
                  <span className={`badge ${STATUS_BADGE[order.status]}`}>
                    <span className="dot" />
                    {STATUS_LABEL[order.status] ?? order.status}
                  </span>
                </td>
                <td>
                  {new Date(order.created_at).toLocaleDateString('es-PE', { dateStyle: 'medium' })}
                </td>
                {canManage && (
                  <td>
                    {order.status === 'PENDING' && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          if (confirm('¿Marcar esta orden como recibida? Esto actualizará el stock.')) {
                            receiveOrder.mutate(order.id)
                          }
                        }}
                      >
                        <PackageCheck size={13} strokeWidth={2} />
                        Recibir
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <PurchaseOrderFormModal
          suppliers={suppliers}
          warehouses={warehouses}
          products={products}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
