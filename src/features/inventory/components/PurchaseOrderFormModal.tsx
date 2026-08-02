import { useMemo, useState, type FormEvent } from 'react'
import { Modal } from '../../../shared/components/Modal'
import { ApiError } from '../../../shared/utils/apiClient'
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
}

const emptyLine = (): LineRow => ({ variant_id: '', quantity: '', unit_cost: '' })

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

  const updateLine = (index: number, field: keyof LineRow, value: string) => {
    setLines((rows) =>
      rows.map((row, rowIndex) =>
        rowIndex === index
          ? { ...row, [field]: field === 'variant_id' ? Number(value) || '' : value }
          : row,
      ),
    )
  }

  const addLine = () => setLines((rows) => [...rows, emptyLine()])
  const removeLine = (index: number) =>
    setLines((rows) => rows.filter((_, rowIndex) => rowIndex !== index))

  const total = lines.reduce((sum, line) => {
    const quantity = Number(line.quantity) || 0
    const unitCost = Number(line.unit_cost) || 0
    return sum + quantity * unitCost
  }, 0)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!supplierId || !warehouseId) {
      setError('Proveedor y almacén son requeridos.')
      return
    }
    const validLines = lines.filter((line) => line.variant_id && line.quantity && line.unit_cost)
    if (validLines.length === 0) {
      setError('Agrega al menos una línea con variante, cantidad y costo.')
      return
    }

    const details_input: NewPurchaseOrderLine[] = validLines.map((line) => ({
      variant_id: line.variant_id as number,
      quantity: line.quantity,
      unit_cost: line.unit_cost,
    }))

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
                  onChange={(event) => updateLine(index, 'quantity', event.target.value)}
                  placeholder="0"
                  inputMode="decimal"
                />
              </div>
              <div style={{ flex: 1 }}>
                {index === 0 && <label htmlFor={`po-cost-${index}`}>Costo unit.</label>}
                <input
                  id={`po-cost-${index}`}
                  value={line.unit_cost}
                  onChange={(event) => updateLine(index, 'unit_cost', event.target.value)}
                  placeholder="0.00"
                  inputMode="decimal"
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
