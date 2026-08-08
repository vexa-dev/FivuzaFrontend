import { Printer, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { printHtml } from '../../../shared/utils/printHtml'
import type { LabelSize, Product } from '../api'
import { usePrintLabels } from '../hooks/useLabels'

interface LabelsPrintTabProps {
  products: Product[]
}

interface LabelLine {
  variantId: number
  label: string
  quantity: number
}

const SIZE_LABELS: Record<LabelSize, string> = {
  '40x25': '40 x 25 mm',
  '50x30': '50 x 30 mm',
}

export function LabelsPrintTab({ products }: LabelsPrintTabProps) {
  const [search, setSearch] = useState('')
  const [variantId, setVariantId] = useState<number | ''>('')
  const [size, setSize] = useState<LabelSize>('40x25')
  const [lines, setLines] = useState<LabelLine[]>([])
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const printLabels = usePrintLabels()

  const variantOptions = useMemo(() => {
    const term = search.trim().toLowerCase()
    const rows = products.flatMap((product) =>
      product.variants.map((variant) => ({
        id: variant.id,
        label: `${variant.sku} — ${product.name}`,
      })),
    )
    if (!term) return rows.slice(0, 20)
    return rows.filter((row) => row.label.toLowerCase().includes(term)).slice(0, 20)
  }, [products, search])

  const handleAddLine = () => {
    if (!variantId) return
    const option = variantOptions.find((row) => row.id === variantId)
    setLines((prev) => {
      const existing = prev.find((line) => line.variantId === variantId)
      if (existing) {
        return prev.map((line) =>
          line.variantId === variantId ? { ...line, quantity: line.quantity + 1 } : line,
        )
      }
      return [...prev, { variantId, label: option?.label ?? `#${variantId}`, quantity: 1 }]
    })
    setVariantId('')
    setSearch('')
  }

  const handleQuantityChange = (id: number, quantity: number) => {
    setLines((prev) =>
      prev.map((line) => (line.variantId === id ? { ...line, quantity } : line)),
    )
  }

  const handleRemoveLine = (id: number) => {
    setLines((prev) => prev.filter((line) => line.variantId !== id))
  }

  const handleGenerate = () => {
    setError(null)
    setPreviewHtml(null)
    if (lines.length === 0) {
      setError('Agrega al menos una variante.')
      return
    }
    printLabels
      .mutateAsync({
        items: lines.map((line) => ({ variant_id: line.variantId, quantity: line.quantity })),
        size,
      })
      .then((html) => setPreviewHtml(html))
      .catch(() => setError('No se pudo generar la hoja de etiquetas.'))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640 }}>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label htmlFor="labels-search">Buscar variante</label>
          <input
            id="labels-search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setVariantId('')
            }}
            placeholder="SKU o nombre del producto"
            autoComplete="off"
          />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
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
            Agregar
          </button>
        </div>

        <div>
          <label htmlFor="labels-size">Tamaño de etiqueta</label>
          <select
            id="labels-size"
            value={size}
            onChange={(event) => setSize(event.target.value as LabelSize)}
          >
            {(Object.keys(SIZE_LABELS) as LabelSize[]).map((value) => (
              <option key={value} value={value}>
                {SIZE_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        {lines.length === 0 && (
          <p className="core-state-message">Todavía no agregaste variantes.</p>
        )}
        {lines.length > 0 && (
          <table className="core-table">
            <thead>
              <tr>
                <th>Variante</th>
                <th>Cantidad</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.variantId}>
                  <td>{line.label}</td>
                  <td>
                    <input
                      value={line.quantity}
                      onChange={(event) =>
                        handleQuantityChange(
                          line.variantId,
                          Math.max(1, Number(event.target.value) || 1),
                        )
                      }
                      inputMode="numeric"
                      style={{ width: 70 }}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-danger-ghost btn-sm btn-icon"
                      aria-label={`Quitar ${line.label}`}
                      onClick={() => handleRemoveLine(line.variantId)}
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

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleGenerate}
          disabled={printLabels.isPending}
        >
          {printLabels.isPending ? 'Generando...' : 'Generar vista previa'}
        </button>
      </div>

      {previewHtml && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            style={{ maxHeight: 320, overflow: 'auto', border: '1px solid var(--border-subtle)' }}
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => printHtml(previewHtml)}
          >
            <Printer size={15} strokeWidth={2.5} />
            Imprimir etiquetas
          </button>
        </div>
      )}
    </div>
  )
}
