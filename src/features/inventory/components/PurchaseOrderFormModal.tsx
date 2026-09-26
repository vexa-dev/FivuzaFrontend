import { useMemo, useState, type FormEvent } from 'react'
import { Modal } from '../../../shared/components/Modal'
import { ApiError } from '../../../shared/utils/apiClient'
import { round2, toTwoDecimals } from '../../../shared/utils/decimals'
import type { NewPurchaseOrderLine, Product, Supplier, Warehouse } from '../api'
import { useCreatePurchaseOrder } from '../hooks/usePurchaseOrders'

interface PurchaseOrderFormModalProps {
  suppliers: Supplier[]
  warehouses: Warehouse[]
  products: Product[]
  onClose: () => void
}

interface LineRow {
  variant_id: number | ''
  quantity: string
  unit_cost: string
  subtotal: string
  // Qué escribió el usuario: el costo unitario o el subtotal de la factura.
  // El otro se deriva y se muestra solo como referencia.
  entered: 'unit_cost' | 'subtotal'
}

const emptyLine = (): LineRow => ({
  variant_id: '',
  quantity: '',
  unit_cost: '',
  subtotal: '',
  entered: 'unit_cost',
})

/** Subtotal de la línea: el de la factura si se escribió, si no cantidad ×
 * costo unitario a 2 decimales (misma regla que el backend). */
function lineSubtotal(line: LineRow): number {
  if (line.entered === 'subtotal') return Number(line.subtotal) || 0
  return round2((Number(line.quantity) || 0) * (Number(line.unit_cost) || 0))
}

/** Costo unitario de referencia cuando se escribió el subtotal. */
function derivedUnitCost(line: LineRow): string {
  const quantity = Number(line.quantity)
  if (!quantity || !line.subtotal) return ''
  return round2(Number(line.subtotal) / quantity).toFixed(2)
}

export function PurchaseOrderFormModal({
  suppliers,
  warehouses,
  products,
  onClose,
}: PurchaseOrderFormModalProps) {
  const [supplierId, setSupplierId] = useState<number | ''>(suppliers[0]?.id ?? '')
  const [warehouseId, setWarehouseId] = useState<number | ''>(warehouses[0]?.id ?? '')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [lines, setLines] = useState<LineRow[]>([emptyLine()])
  const [error, setError] = useState<string | null>(null)

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

  const createPurchaseOrder = useCreatePurchaseOrder()

  const updateLine = (
    index: number,
    field: 'variant_id' | 'quantity' | 'unit_cost' | 'subtotal',
    value: string,
  ) => {
    setLines((rows) =>
      rows.map((row, rowIndex) => {
        if (rowIndex !== index) return row
        if (field === 'variant_id') return { ...row, variant_id: Number(value) || '' }
        if (field === 'unit_cost') return { ...row, unit_cost: value, subtotal: '', entered: 'unit_cost' }
        if (field === 'subtotal') return { ...row, subtotal: value, unit_cost: '', entered: 'subtotal' }
        return { ...row, quantity: value }
      }),
    )
  }

  const addLine = () => setLines((rows) => [...rows, emptyLine()])
  const removeLine = (index: number) =>
    setLines((rows) => rows.filter((_, rowIndex) => rowIndex !== index))

  const total = round2(lines.reduce((sum, line) => sum + lineSubtotal(line), 0))

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!supplierId || !warehouseId) {
      setError('Proveedor y almacén son requeridos.')
      return
    }
    const validLines = lines.filter(
      (line) => line.variant_id && line.quantity && (line.unit_cost || line.subtotal),
    )
    if (validLines.length === 0) {
      setError('Agrega al menos una línea con variante, cantidad y costo o subtotal.')
      return
    }

    const details_input: NewPurchaseOrderLine[] = validLines.map((line) =>
      line.entered === 'subtotal'
        ? { variant_id: line.variant_id as number, quantity: line.quantity, subtotal: line.subtotal }
        : { variant_id: line.variant_id as number, quantity: line.quantity, unit_cost: line.unit_cost },
    )

    createPurchaseOrder
      .mutateAsync({
        supplier: supplierId,
        warehouse: warehouseId,
        invoice_number: invoiceNumber,
        details_input,
      })
      .then(onClose)
      .catch((err: unknown) => {
        const body = err instanceof ApiError ? (err.body as { code?: string }) : null
        setError(
          body?.code === 'MODULE_DISABLED'
            ? 'El módulo de compras no está habilitado para tu negocio.'
            : 'No se pudo crear la orden de compra.',
        )
      })
  }

  return (
    <Modal title="Nueva orden de compra" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="po-supplier">Proveedor</label>
            <select
              id="po-supplier"
              value={supplierId}
              onChange={(event) => setSupplierId(Number(event.target.value) || '')}
            >
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.company_name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="po-warehouse">Almacén de destino</label>
            <select
              id="po-warehouse"
              value={warehouseId}
              onChange={(event) => setWarehouseId(Number(event.target.value) || '')}
            >
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="po-invoice">N° de factura/boleta (opcional)</label>
          <input
            id="po-invoice"
            value={invoiceNumber}
            onChange={(event) => setInvoiceNumber(event.target.value)}
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label>Líneas</label>
            <button type="button" className="btn btn-ghost" onClick={addLine}>
              + Agregar línea
            </button>
          </div>

          {lines.map((line, index) => (
            <div key={index} style={{ display: 'flex', gap: 6, marginBottom: 8, alignItems: 'flex-end' }}>
              <div style={{ flex: 3 }}>
                {index === 0 && <label htmlFor={`po-variant-${index}`}>Variante</label>}
                <select
                  id={`po-variant-${index}`}
                  value={line.variant_id}
                  onChange={(event) => updateLine(index, 'variant_id', event.target.value)}
                >
                  <option value="">Selecciona...</option>
                  {variantOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                {index === 0 && <label htmlFor={`po-qty-${index}`}>Cantidad</label>}
                <input
                  id={`po-qty-${index}`}
                  value={line.quantity}
                  onChange={(event) => updateLine(index, 'quantity', toTwoDecimals(event.target.value))}
                  placeholder="0"
                  inputMode="decimal"
                />
              </div>
              <div style={{ flex: 1 }}>
                {index === 0 && <label htmlFor={`po-cost-${index}`}>Costo unit.</label>}
                <input
                  id={`po-cost-${index}`}
                  value={line.unit_cost}
                  onChange={(event) => updateLine(index, 'unit_cost', toTwoDecimals(event.target.value))}
                  placeholder={line.entered === 'subtotal' ? derivedUnitCost(line) || '0.00' : '0.00'}
                  inputMode="decimal"
                />
              </div>
              <div style={{ flex: 1 }}>
                {index === 0 && <label htmlFor={`po-subtotal-${index}`}>Subtotal</label>}
                <input
                  id={`po-subtotal-${index}`}
                  value={line.subtotal}
                  onChange={(event) => updateLine(index, 'subtotal', toTwoDecimals(event.target.value))}
                  placeholder={lineSubtotal(line) ? lineSubtotal(line).toFixed(2) : '0.00'}
                  inputMode="decimal"
                  title="Escribe el total de la línea tal como viene en la factura: el costo unitario se calcula."
                />
              </div>
              {lines.length > 1 && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => removeLine(index)}
                  aria-label="Quitar línea"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        <p className="core-page-subtitle" style={{ margin: 0 }}>
          Total: <strong style={{ color: 'var(--text-primary)' }}>{total.toFixed(2)}</strong>
        </p>

        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn btn-primary" disabled={createPurchaseOrder.isPending}>
          {createPurchaseOrder.isPending ? 'Guardando...' : 'Crear orden'}
        </button>
      </form>
    </Modal>
  )
}
