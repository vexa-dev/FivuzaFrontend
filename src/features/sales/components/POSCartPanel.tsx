import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { useState, type Dispatch } from 'react'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ApiError } from '../../../shared/utils/apiClient'
import type { Sale } from '../api'
import type { CartAction } from '../cart/cartReducer'
import type { CartTotals } from '../cart/totals'
import { toSaleCreateInput } from '../cart/useCart'
import type { CartState } from '../cart/types'
import { useCustomers } from '../hooks/useCustomers'
import { useCreateSale } from '../hooks/useSales'
import { CheckoutModal } from './CheckoutModal'
import { PostSaleModal } from './PostSaleModal'

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
  const [showCheckout, setShowCheckout] = useState(false)
  const [completedSale, setCompletedSale] = useState<Sale | null>(null)

  const openCheckout = () => {
    setError(null)
    if (cashSessionId === undefined) {
      setError('No hay una sesión de caja abierta.')
      return
    }
    if (cart.customerId === null) {
      setError('Selecciona un cliente antes de cobrar.')
      return
    }
    setShowCheckout(true)
  }

  const handleConfirm = () => {
    setError(null)
    if (cashSessionId === undefined) return
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
        setShowCheckout(false)
        setCompletedSale(sale)
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon pos-qty-btn"
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
                      <span className="pos-qty-value">{line.quantity}</span>
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon pos-qty-btn"
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
                      className="btn btn-danger-ghost btn-icon pos-remove-btn"
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

      {error && (
        <p className="login-error" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        className="btn btn-primary pos-checkout-btn"
        disabled={cart.lines.length === 0 || cashSessionId === undefined}
        onClick={openCheckout}
      >
        {`Cobrar S/ ${totals.total.toFixed(2)}`}
      </button>

      {showCheckout && (
        <CheckoutModal
          cart={cart}
          totals={totals}
          error={error}
          isSubmitting={createSale.isPending}
          onAddPayment={(payment) => dispatch({ type: 'ADD_PAYMENT', payment })}
          onUpdatePaymentAmount={(index, amount) =>
            dispatch({ type: 'UPDATE_PAYMENT_AMOUNT', index, amount })
          }
          onUpdatePaymentMethod={(index, method) =>
            dispatch({ type: 'UPDATE_PAYMENT_METHOD', index, method })
          }
          onRemovePayment={(index) => dispatch({ type: 'REMOVE_PAYMENT', index })}
          onConfirm={handleConfirm}
          onClose={() => setShowCheckout(false)}
        />
      )}

      {completedSale && (
        <PostSaleModal sale={completedSale} onClose={() => setCompletedSale(null)} />
      )}
    </div>
  )
}
