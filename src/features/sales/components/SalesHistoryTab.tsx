import { Receipt as ReceiptIcon, ReceiptText } from 'lucide-react'
import { useState } from 'react'
import { EmptyState } from '../../../shared/components/EmptyState'
import { Modal } from '../../../shared/components/Modal'
import type { Sale } from '../api'
import { useCustomers } from '../hooks/useCustomers'
import { useSale, useSaleReceipt, useSales } from '../hooks/useSales'
import { ReceiptView } from './ReceiptView'

function formatDate(value: string) {
  return new Date(value).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  YAPE: 'Yape',
  CREDIT_LEDGER: 'Crédito (fiado)',
  BALANCE: 'Saldo a favor',
}

export function SalesHistoryTab() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerId, setCustomerId] = useState<number | null>(null)
  const { data: customers } = useCustomers(customerSearch)
  const selectedCustomer = customers?.find((c) => c.id === customerId)

  const { data: sales, isLoading } = useSales({
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    customer: customerId ?? undefined,
  })

  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label htmlFor="sales-history-from">Desde</label>
            <input
              id="sales-history-from"
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="sales-history-to">Hasta</label>
            <input
              id="sales-history-to"
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <label htmlFor="sales-history-customer">Cliente</label>
            <input
              id="sales-history-customer"
              value={selectedCustomer ? selectedCustomer.name : customerSearch}
              onChange={(event) => {
                setCustomerSearch(event.target.value)
                if (customerId !== null) setCustomerId(null)
              }}
              placeholder="Todos los clientes"
              autoComplete="off"
            />
            {!selectedCustomer && customerSearch.trim() && customers && customers.length > 0 && (
              <div
                className="card"
                style={{ position: 'absolute', zIndex: 1, marginTop: 4, maxHeight: 160, overflowY: 'auto', minWidth: 200 }}
              >
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
          {(dateFrom || dateTo || customerId !== null) && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setDateFrom('')
                setDateTo('')
                setCustomerId(null)
                setCustomerSearch('')
              }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      <div className="card core-table-card">
        {isLoading && (
          <div className="loading-row">
            <span className="spinner" />
            Cargando...
          </div>
        )}
        {sales && sales.length === 0 && (
          <EmptyState icon={<ReceiptText />} title="No hay ventas para estos filtros" />
        )}
        {sales && sales.length > 0 && (
          <table className="core-table">
            <thead>
              <tr>
                <th>Comprobante</th>
                <th>Fecha</th>
                <th>Total</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id}>
                  <td className="core-table-strong">{sale.invoice_number}</td>
                  <td>{formatDate(sale.created_at)}</td>
                  <td>S/ {sale.total}</td>
                  <td>
                    <span
                      className={`badge ${sale.status === 'COMPLETED' ? 'badge-success' : 'badge-neutral'}`}
                    >
                      <span className="dot" />
                      {sale.status}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm btn-icon"
                      aria-label={`Ver detalle de ${sale.invoice_number}`}
                      onClick={() => setSelectedSaleId(sale.id)}
                    >
                      <ReceiptIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedSaleId !== null && (
        <SaleDetailModal saleId={selectedSaleId} onClose={() => setSelectedSaleId(null)} />
      )}
    </div>
  )
}

function SaleDetailModal({ saleId, onClose }: { saleId: number; onClose: () => void }) {
  const { data: sale, isLoading } = useSale(saleId)
  const { data: receiptHtml, isLoading: loadingReceipt } = useSaleReceipt(saleId)

  return (
    <Modal title={sale ? sale.invoice_number : 'Detalle de venta'} onClose={onClose}>
      {isLoading && (
        <div className="loading-row">
          <span className="spinner" />
          Cargando...
        </div>
      )}
      {sale && <SaleDetailBody sale={sale} />}
      <div style={{ marginTop: 16 }}>
        <ReceiptView html={receiptHtml} isLoading={loadingReceipt} />
      </div>
    </Modal>
  )
}

function SaleDetailBody({ sale }: { sale: Sale }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p className="core-page-subtitle" style={{ margin: 0 }}>
        {formatDate(sale.created_at)}
      </p>
      <table className="core-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Cant.</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {sale.details.map((detail) => (
            <tr key={detail.id}>
              <td>
                <div className="core-table-strong">{detail.product_name_snapshot}</div>
                <div className="core-page-subtitle" style={{ margin: 0 }}>
                  {detail.sku_snapshot}
                </div>
              </td>
              <td>{detail.quantity}</td>
              <td>S/ {detail.subtotal}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="detail-grid">
        <dt>Subtotal</dt>
        <dd>S/ {sale.subtotal}</dd>
        <dt>Descuento</dt>
        <dd>S/ {sale.discount_total}</dd>
        <dt>Total</dt>
        <dd style={{ fontWeight: 700 }}>S/ {sale.total}</dd>
        <dt>Pagos</dt>
        <dd>
          {sale.payments
            .map((payment) => `${PAYMENT_METHOD_LABELS[payment.method] ?? payment.method}: S/ ${payment.amount}`)
            .join(' · ')}
        </dd>
      </dl>
    </div>
  )
}
