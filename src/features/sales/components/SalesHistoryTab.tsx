import { Receipt as ReceiptIcon, ReceiptText, Undo2, Ban, CloudOff } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../auth/hooks/useAuth'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ExportButtons } from '../../../shared/components/ExportButtons'
import { Modal } from '../../../shared/components/Modal'
import { useOnlineStatus } from '../../../shared/offline/useOnlineStatus'
import { downloadSalesReport, type Sale, type SaleReturn } from '../api'
import { useCustomers } from '../hooks/useCustomers'
import { useSale, useSaleReceipt, useSales } from '../hooks/useSales'
import { useSaleReturns } from '../hooks/useSaleReturns'
import { ReceiptView } from './ReceiptView'
import { ReturnSaleModal } from './ReturnSaleModal'
import { VoidSaleModal } from './VoidSaleModal'

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
  const isOnline = useOnlineStatus()
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
          {dateFrom && dateTo && (
            <ExportButtons
              filename={`ventas_${dateFrom}_a_${dateTo}`}
              onDownload={(format) => downloadSalesReport({ date_from: dateFrom, date_to: dateTo }, format)}
            />
          )}
        </div>
      </div>

      <div className="card core-table-card">
        {!isOnline && (
          <EmptyState
            icon={<CloudOff />}
            title="El historial de ventas no está disponible sin conexión"
            subtitle="Se puede seguir vendiendo offline; el historial se actualiza al reconectar."
          />
        )}
        {isOnline && isLoading && (
          <div className="loading-row">
            <span className="spinner" />
            Cargando...
          </div>
        )}
        {isOnline && sales && sales.length === 0 && (
          <EmptyState icon={<ReceiptText />} title="No hay ventas para estos filtros" />
        )}
        {isOnline && sales && sales.length > 0 && (
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
                      className={`badge ${sale.status === 'COMPLETED' ? 'badge-success' : sale.status === 'VOIDED' ? 'badge-danger' : 'badge-neutral'}`}
                    >
                      <span className="dot" />
                      {sale.status === 'VOIDED' ? 'ANULADA' : sale.status}
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
  const { hasPermission } = useAuth()
  const { data: sale, isLoading } = useSale(saleId)
  const { data: receiptHtml, isLoading: loadingReceipt } = useSaleReceipt(saleId)
  const { data: returns } = useSaleReturns(saleId)
  const [showVoid, setShowVoid] = useState(false)
  const [showReturn, setShowReturn] = useState(false)

  const canVoid = hasPermission('SALES_VOID')
  const canReturn = hasPermission('SALES_RETURN')

  return (
    <Modal title={sale ? sale.invoice_number : 'Detalle de venta'} onClose={onClose}>
      {isLoading && (
        <div className="loading-row">
          <span className="spinner" />
          Cargando...
        </div>
      )}
      {sale && (
        <>
          <SaleDetailBody sale={sale} returns={returns ?? []} />

          {sale.status === 'COMPLETED' && (canVoid || canReturn) && (
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              {canReturn && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowReturn(true)}
                >
                  <Undo2 size={14} strokeWidth={2} />
                  Registrar devolución
                </button>
              )}
              {canVoid && (
                <button
                  type="button"
                  className="btn btn-danger-ghost btn-sm"
                  onClick={() => setShowVoid(true)}
                >
                  <Ban size={14} strokeWidth={2} />
                  Anular venta
                </button>
              )}
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <ReceiptView html={receiptHtml} isLoading={loadingReceipt} />
          </div>

          {showVoid && (
            <VoidSaleModal
              sale={sale}
              onClose={() => setShowVoid(false)}
              onVoided={() => setShowVoid(false)}
            />
          )}
          {showReturn && (
            <ReturnSaleModal
              sale={sale}
              onClose={() => setShowReturn(false)}
              onReturned={() => setShowReturn(false)}
            />
          )}
        </>
      )}
    </Modal>
  )
}

function SaleDetailBody({ sale, returns }: { sale: Sale; returns: SaleReturn[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <p className="core-page-subtitle" style={{ margin: 0 }}>
          {formatDate(sale.created_at)}
        </p>
        {sale.status === 'VOIDED' && (
          <span className="badge badge-danger">
            <span className="dot" />
            ANULADA
          </span>
        )}
        {returns.length > 0 && (
          <span className="badge badge-warning">
            <span className="dot" />
            {returns.length === 1 ? '1 devolución' : `${returns.length} devoluciones`}
          </span>
        )}
      </div>
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
        {returns.length > 0 && (
          <>
            <dt>Devuelto</dt>
            <dd>
              {returns
                .map(
                  (sr) =>
                    `S/ ${sr.total_refund_amount} (${sr.refund_type === 'CASH' ? 'efectivo' : 'saldo a favor'})`,
                )
                .join(' · ')}
            </dd>
          </>
        )}
      </dl>
    </div>
  )
}
