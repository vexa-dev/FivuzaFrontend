import { FileText, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ApiError } from '../../../shared/utils/apiClient'
import type { Product } from '../../inventory/api'
import type { Quote, QuoteLineInput } from '../api'
import { useCustomers } from '../hooks/useCustomers'
import {
  useConvertQuote,
  useCreateQuote,
  useMarkQuoteAccepted,
  useMarkQuoteRejected,
  useMarkQuoteSent,
  useQuotes,
} from '../hooks/useQuotes'
import { ConvertToSaleModal } from './ConvertToSaleModal'
import { QuoteDocumentModal } from './QuoteDocumentModal'

const STATUS_LABELS: Record<Quote['status'], string> = {
  DRAFT: 'Borrador',
  SENT: 'Enviada',
  ACCEPTED: 'Aceptada',
  EXPIRED: 'Vencida',
  REJECTED: 'Rechazada',
}

const STATUS_BADGE: Record<Quote['status'], string> = {
  DRAFT: 'badge-neutral',
  SENT: 'badge-warning',
  ACCEPTED: 'badge-success',
  EXPIRED: 'badge-danger',
  REJECTED: 'badge-danger',
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })
}

interface QuotesTabProps {
  products: Product[]
}

export function QuotesTab({ products }: QuotesTabProps) {
  const [statusFilter, setStatusFilter] = useState<Quote['status'] | ''>('')
  const { data: quotes, isLoading } = useQuotes(statusFilter ? { status: statusFilter } : undefined)
  const { data: customers } = useCustomers()
  const markSent = useMarkQuoteSent()
  const markAccepted = useMarkQuoteAccepted()
  const markRejected = useMarkQuoteRejected()
  const [convertingId, setConvertingId] = useState<number | null>(null)
  const [documentId, setDocumentId] = useState<number | null>(null)

  const customerName = (customerId: number) =>
    customers?.find((c) => c.id === customerId)?.name ?? `#${customerId}`

  const convertingQuote = quotes?.find((q) => q.id === convertingId) ?? null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <QuoteFormCard products={products} />

      <div className="card core-table-card">
        <div className="table-toolbar">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as Quote['status'] | '')}
            style={{ maxWidth: 200 }}
          >
            <option value="">Todos los estados</option>
            {(Object.keys(STATUS_LABELS) as Quote['status'][]).map((value) => (
              <option key={value} value={value}>
                {STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        {isLoading && (
          <div className="loading-row">
            <span className="spinner" />
            Cargando...
          </div>
        )}
        {quotes && quotes.length === 0 && (
          <EmptyState icon={<FileText />} title="Sin cotizaciones en este estado" />
        )}
        {quotes && quotes.length > 0 && (
          <table className="core-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Vigencia</th>
                <th>Total</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((quote) => (
                <tr key={quote.id}>
                  <td>{customerName(quote.customer)}</td>
                  <td>{formatDate(quote.valid_until)}</td>
                  <td className="core-table-strong">S/ {quote.total}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[quote.status]}`}>
                      <span className="dot" />
                      {STATUS_LABELS[quote.status]}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setDocumentId(quote.id)}
                      >
                        Ver
                      </button>
                      {quote.status === 'DRAFT' && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => markSent.mutate(quote.id)}
                        >
                          Marcar enviada
                        </button>
                      )}
                      {(quote.status === 'DRAFT' || quote.status === 'SENT') && (
                        <>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => markAccepted.mutate(quote.id)}
                          >
                            Aceptada
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger-ghost btn-sm"
                            onClick={() => markRejected.mutate(quote.id)}
                          >
                            Rechazada
                          </button>
                        </>
                      )}
                      {quote.status === 'ACCEPTED' && quote.sale === null && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => setConvertingId(quote.id)}
                        >
                          <ShoppingCart size={14} strokeWidth={2} />
                          Vender
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {convertingQuote && (
        <ConvertQuoteModal quote={convertingQuote} onClose={() => setConvertingId(null)} />
      )}

      {documentId !== null && (
        <QuoteDocumentModal quoteId={documentId} onClose={() => setDocumentId(null)} />
      )}
    </div>
  )
}

function ConvertQuoteModal({ quote, onClose }: { quote: Quote; onClose: () => void }) {
  const convertQuote = useConvertQuote()
  const [error, setError] = useState<string | null>(null)

  return (
    <ConvertToSaleModal
      title="Convertir cotización en venta"
      total={quote.total}
      isSubmitting={convertQuote.isPending}
      error={error}
      onClose={onClose}
      onConfirm={(cashSessionId, payments) => {
        setError(null)
        convertQuote
          .mutateAsync({ id: quote.id, data: { cash_session_id: cashSessionId, payments } })
          .then(onClose)
          .catch((err: unknown) => {
            const body = err instanceof ApiError ? (err.body as { error?: { message?: string } }) : null
            setError(body?.error?.message ?? 'No se pudo registrar la venta.')
          })
      }}
    />
  )
}

function QuoteFormCard({ products }: { products: Product[] }) {
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerId, setCustomerId] = useState<number | ''>('')
  const { data: customers } = useCustomers(customerSearch)
  const selectedCustomer = customers?.find((c) => c.id === customerId)

  const [validUntil, setValidUntil] = useState('')
  const [lines, setLines] = useState<QuoteLineInput[]>([])
  const [variantSearch, setVariantSearch] = useState('')
  const [variantId, setVariantId] = useState<number | ''>('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const createQuote = useCreateQuote()

  const variantOptions = useMemo(() => {
    const term = variantSearch.trim().toLowerCase()
    const rows = products.flatMap((product) =>
      product.variants.map((variant) => ({
        id: variant.id,
        label: `${variant.sku} — ${product.name}`,
      })),
    )
    if (!term) return rows.slice(0, 20)
    return rows.filter((row) => row.label.toLowerCase().includes(term)).slice(0, 20)
  }, [products, variantSearch])

  const variantLabel = (id: number) => {
    for (const product of products) {
      const variant = product.variants.find((v) => v.id === id)
      if (variant) return `${variant.sku} — ${product.name}`
    }
    return `#${id}`
  }

  const handleAddLine = () => {
    if (!variantId) return
    setLines((prev) => {
      const existing = prev.find((line) => line.variant_id === variantId)
      if (existing) {
        return prev.map((line) =>
          line.variant_id === variantId
            ? { ...line, quantity: String(Number(line.quantity) + 1) }
            : line,
        )
      }
      return [...prev, { variant_id: variantId, quantity: '1' }]
    })
    setVariantId('')
    setVariantSearch('')
  }

  const handleSubmit = () => {
    setError(null)
    setSuccess(null)
    if (!customerId || !validUntil || lines.length === 0) {
      setError('Completa cliente, vigencia y al menos una línea.')
      return
    }
    createQuote
      .mutateAsync({
        customer_id: customerId,
        valid_until: new Date(validUntil).toISOString(),
        lines,
      })
      .then(() => {
        setSuccess('Cotización creada.')
        setLines([])
      })
      .catch(() => setError('No se pudo crear la cotización.'))
  }

  return (
    <div className="card" style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p className="core-page-subtitle" style={{ margin: 0, fontWeight: 600 }}>
        Nueva cotización
      </p>

      <div>
        <label htmlFor="quote-customer-search">Cliente</label>
        <input
          id="quote-customer-search"
          value={selectedCustomer ? selectedCustomer.name : customerSearch}
          onChange={(event) => {
            setCustomerSearch(event.target.value)
            setCustomerId('')
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

      <div>
        <label htmlFor="quote-valid-until">Válida hasta</label>
        <input
          id="quote-valid-until"
          type="datetime-local"
          value={validUntil}
          onChange={(event) => setValidUntil(event.target.value)}
        />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={variantSearch}
          onChange={(event) => {
            setVariantSearch(event.target.value)
            setVariantId('')
          }}
          placeholder="Buscar producto por SKU o nombre..."
          autoComplete="off"
          style={{ flex: 1 }}
        />
        <select
          value={variantId}
          onChange={(event) => setVariantId(Number(event.target.value) || '')}
          style={{ flex: 1 }}
        >
          <option value="">Selecciona una variante</option>
          {variantOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <button type="button" className="btn btn-primary" onClick={handleAddLine}>
          <Plus size={14} strokeWidth={2} />
          Agregar
        </button>
      </div>

      {lines.length > 0 && (
        <table className="core-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.variant_id}>
                <td>{variantLabel(line.variant_id)}</td>
                <td>
                  <input
                    value={line.quantity}
                    onChange={(event) =>
                      setLines((prev) =>
                        prev.map((l) =>
                          l.variant_id === line.variant_id
                            ? { ...l, quantity: event.target.value }
                            : l,
                        ),
                      )
                    }
                    inputMode="decimal"
                    style={{ width: 70 }}
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className="btn btn-danger-ghost btn-sm btn-icon"
                    aria-label="Quitar línea"
                    onClick={() =>
                      setLines((prev) => prev.filter((l) => l.variant_id !== line.variant_id))
                    }
                  >
                    <Trash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {error && (
        <p className="login-error" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p style={{ color: 'var(--success)', fontSize: '0.8125rem', margin: 0 }}>{success}</p>
      )}

      <button
        type="button"
        className="btn btn-primary"
        onClick={handleSubmit}
        disabled={createQuote.isPending}
      >
        {createQuote.isPending ? 'Guardando...' : 'Crear cotización'}
      </button>
    </div>
  )
}
