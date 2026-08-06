import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { useState, type Dispatch } from 'react'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ApiError } from '../../../shared/utils/apiClient'
import type { SalePaymentMethod } from '../api'
import type { CartAction } from '../cart/cartReducer'
import type { CartTotals } from '../cart/totals'
import { toSaleCreateInput } from '../cart/useCart'
import type { CartState } from '../cart/types'
import { useCustomers } from '../hooks/useCustomers'
import { useCreateSale } from '../hooks/useSales'

const PAYMENT_METHODS: [SalePaymentMethod, string][] = [
  ['CASH', 'Efectivo'],
  ['CARD', 'Tarjeta'],
  ['YAPE', 'Yape'],
  ['CREDIT_LEDGER', 'Crédito (fiado)'],
  ['BALANCE', 'Saldo a favor'],
]

interface POSCartPanelProps {
  cart: CartState
  totals: CartTotals
  dispatch: Dispatch<CartAction>
  cashSessionId: number | undefined
}

export function POSCartPanel({ cart, totals, dispatch, cashSessionId }: POSCartPanelProps) {
  const [customerSearch, setCustomerSearch] = useState('')
  const { data: customers } = useCustomers(customerSearch)
  const selectedCustomer = customers?.find((c) => c.id === cart.customerId)
  const createSale = useCreateSale()
  const [error, setError] = useState<string | null>(null)
  const [lastSale, setLastSale] = useState<{ invoice: string; total: string } | null>(null)

  const handleCheckout = () => {
    setError(null)
    if (cashSessionId === undefined) {
      setError('No hay una sesión de caja abierta.')
      return
    }
    const payload = toSaleCreateInput({ ...cart, cashSessionId })
    if (payload === null) {
      setError('Selecciona un cliente antes de cobrar.')
      return
    }
    if (!totals.paymentsMatchTotal) {
      setError('La suma de los pagos debe cuadrar con el total.')
      return
    }

    createSale
      .mutateAsync(payload)
      .then((sale) => {
        setLastSale({ invoice: sale.invoice_number, total: sale.total })
        dispatch({ type: 'CLEAR' })
        dispatch({ type: 'SET_CUSTOMER', customerId: null })
        setCustomerSearch('')
      })
      .catch((err: unknown) => {
        const body =
          err instanceof ApiError ? (err.body as { error?: { message?: string } }) : null
        setError(body?.error?.message ?? 'No se pudo registrar la venta.')
      })
  }

  return (
    <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label htmlFor="pos-customer-search">Cliente</label>
        <input
          id="pos-customer-search"
          value={selectedCustomer ? selectedCustomer.name : customerSearch}
          onChange={(event) => {
            setCustomerSearch(event.target.value)
            if (cart.customerId !== null) dispatch({ type: 'SET_CUSTOMER', customerId: null })
          }}
          placeholder="Buscar por documento o nombre..."
          autoComplete="off"
        />
        {!selectedCustomer && customerSearch.trim() && customers && customers.length > 0 && (
          <div className="card" style={{ marginTop: 4, maxHeight: 160, overflowY: 'auto' }}>
            {customers.map((customer) => (
              <button
                key={customer.id}
                type="button"
                className="btn btn-ghost"
                style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 0 }}
                onClick={() => {
                  dispatch({ type: 'SET_CUSTOMER', customerId: customer.id })
                  setCustomerSearch('')
                }}
              >
                {customer.name} · {customer.document_number}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {cart.lines.length === 0 ? (
          <EmptyState icon={<ShoppingCart />} title="El carrito está vacío" subtitle="Busca o escanea un producto para agregarlo." />
        ) : (
          <table className="core-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cant.</th>
                <th>Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cart.lines.map((line) => (
                <tr key={line.variantId}>
                  <td>
                    <div className="core-table-strong">{line.productName}</div>
                    <div className="core-page-subtitle" style={{ margin: 0 }}>
                      {line.sku} · S/ {line.unitPrice}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm btn-icon"
                        aria-label={`Restar unidad de ${line.productName}`}
                        onClick={() =>
                          dispatch({
                            type: 'SET_LINE_QUANTITY',
                            variantId: line.variantId,
                            quantity: String(Math.max(1, Number(line.quantity) - 1)),
                          })
                        }
                      >
                        <Minus />
                      </button>
                      <span style={{ minWidth: 24, textAlign: 'center' }}>{line.quantity}</span>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm btn-icon"
                        aria-label={`Sumar unidad de ${line.productName}`}
                        onClick={() =>
                          dispatch({
                            type: 'SET_LINE_QUANTITY',
                            variantId: line.variantId,
                            quantity: String(Number(line.quantity) + 1),
                          })
                        }
                      >
                        <Plus />
                      </button>
                    </div>
                  </td>
                  <td className="core-table-strong">
                    S/ {(Number(line.unitPrice) * Number(line.quantity)).toFixed(2)}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-danger-ghost btn-sm btn-icon"
                      aria-label={`Quitar ${line.productName}`}
                      onClick={() => dispatch({ type: 'REMOVE_LINE', variantId: line.variantId })}
                    >
                      <Trash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <dl className="detail-grid">
        <dt>Subtotal</dt>
        <dd>S/ {totals.subtotal.toFixed(2)}</dd>
        <dt>Descuento</dt>
        <dd>S/ {totals.discountTotal.toFixed(2)}</dd>
        <dt>Total</dt>
        <dd style={{ fontWeight: 700, fontSize: '1.1rem' }}>S/ {totals.total.toFixed(2)}</dd>
      </dl>

      <PaymentsBuilder cart={cart} totals={totals} dispatch={dispatch} />

      {error && (
        <p className="login-error" role="alert">
          {error}
        </p>
      )}

      {lastSale && (
        <p className="core-state-message" role="status">
          Venta {lastSale.invoice} registrada por S/ {lastSale.total}.
        </p>
      )}

      <button
        type="button"
        className="btn btn-primary"
        style={{ fontSize: '1.05rem', padding: '12px' }}
        disabled={
          createSale.isPending ||
          cart.lines.length === 0 ||
          cashSessionId === undefined ||
          cart.customerId === null
        }
        onClick={handleCheckout}
      >
        {createSale.isPending ? 'Cobrando...' : `Cobrar S/ ${totals.total.toFixed(2)}`}
      </button>
    </div>
  )
}

function PaymentsBuilder({
  cart,
  totals,
  dispatch,
}: {
  cart: CartState
  totals: CartTotals
  dispatch: Dispatch<CartAction>
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ margin: 0 }}>Pagos</label>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => dispatch({ type: 'ADD_PAYMENT', payment: { method: 'CASH', amount: '' } })}
        >
          <Plus size={14} strokeWidth={2} />
          Agregar pago
        </button>
      </div>
      {cart.payments.length === 0 && (
        <p className="core-page-subtitle" style={{ margin: '4px 0 0' }}>
          Agrega al menos un pago para cobrar.
        </p>
      )}
      {cart.payments.map((payment, index) => (
        <div key={index} style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <select
            value={payment.method}
            onChange={(event) =>
              dispatch({
                type: 'UPDATE_PAYMENT_METHOD',
                index,
                method: event.target.value as SalePaymentMethod,
              })
            }
            style={{ flex: 1 }}
          >
            {PAYMENT_METHODS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            inputMode="decimal"
            value={payment.amount}
            onChange={(event) =>
              dispatch({ type: 'UPDATE_PAYMENT_AMOUNT', index, amount: event.target.value })
            }
            placeholder="0.00"
            style={{ width: 90 }}
          />
          <button
            type="button"
            className="btn btn-danger-ghost btn-sm btn-icon"
            aria-label="Quitar pago"
            onClick={() => dispatch({ type: 'REMOVE_PAYMENT', index })}
          >
            <Trash2 />
          </button>
        </div>
      ))}
      {cart.payments.length > 0 && (
        <p
          className={`core-page-subtitle ${totals.paymentsMatchTotal ? '' : 'login-error'}`}
          style={{ margin: '6px 0 0' }}
        >
          Pagado: S/ {totals.paymentsTotal.toFixed(2)} de S/ {totals.total.toFixed(2)}
        </p>
      )}
    </div>
  )
}
