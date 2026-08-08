import { Trash2 } from 'lucide-react'
import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Modal } from '../../../shared/components/Modal'
import { requestVariantImageUploadUrl, type ProductVariant } from '../api'
import { useUpdateVariant } from '../hooks/useProducts'
import {
  useCreateVolumePricingTier,
  useDeleteVolumePricingTier,
  useVolumePricingTiers,
} from '../hooks/useVolumePricingTiers'

interface VariantEditModalProps {
  variant: ProductVariant
  onClose: () => void
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function VariantEditModal({ variant, onClose }: VariantEditModalProps) {
  const [sku, setSku] = useState(variant.sku)
  const [barcode, setBarcode] = useState(variant.barcode ?? '')
  const [cost, setCost] = useState(variant.cost)
  const [price, setPrice] = useState(variant.price)
  const [minStock, setMinStock] = useState(variant.min_stock)
  const [imageUrl, setImageUrl] = useState(variant.image_url)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateVariant = useUpdateVariant()

  const { data: pricingTiers } = useVolumePricingTiers(variant.id)
  const createTier = useCreateVolumePricingTier(variant.id)
  const deleteTier = useDeleteVolumePricingTier(variant.id)
  const [tierMinQuantity, setTierMinQuantity] = useState('')
  const [tierUnitPrice, setTierUnitPrice] = useState('')
  const [tierError, setTierError] = useState<string | null>(null)

  const handleAddTier = () => {
    setTierError(null)
    if (!tierMinQuantity || !tierUnitPrice) {
      setTierError('Indica la cantidad mínima y el precio del tramo.')
      return
    }
    createTier
      .mutateAsync({
        variant: variant.id,
        min_quantity: tierMinQuantity,
        unit_price: tierUnitPrice,
      })
      .then(() => {
        setTierMinQuantity('')
        setTierUnitPrice('')
      })
      .catch(() => setTierError('No se pudo agregar el tramo (¿ya existe uno con esa cantidad?).'))
  }

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError('Formato de imagen no permitido (usa JPG, PNG o WEBP).')
      return
    }

    setUploading(true)
    setError(null)
    try {
      const { upload_url, image_url } = await requestVariantImageUploadUrl(
        variant.id,
        file.type,
      )
      const uploadResponse = await fetch(upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!uploadResponse.ok) throw new Error('upload_failed')
      setImageUrl(image_url)
    } catch {
      setError('No se pudo subir la imagen.')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!sku.trim()) {
      setError('El SKU es requerido.')
      return
    }

    updateVariant
      .mutateAsync({
        id: variant.id,
        data: {
          sku,
          barcode: barcode || null,
          cost,
          price,
          min_stock: minStock,
          image_url: imageUrl,
        },
      })
      .then(onClose)
      .catch(() => setError('No se pudo guardar la variante.'))
  }

  return (
    <Modal title={`Editar variante ${variant.sku}`} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <label htmlFor="variant-edit-sku">SKU</label>
          <input id="variant-edit-sku" value={sku} onChange={(event) => setSku(event.target.value)} />
        </div>

        <div>
          <label htmlFor="variant-edit-barcode">Código de barras</label>
          <input
            id="variant-edit-barcode"
            value={barcode}
            onChange={(event) => setBarcode(event.target.value)}
            placeholder="Escanea o escribe"
            autoComplete="off"
          />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="variant-edit-cost">Costo</label>
            <input
              id="variant-edit-cost"
              value={cost}
              onChange={(event) => setCost(event.target.value)}
              inputMode="decimal"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="variant-edit-price">Precio</label>
            <input
              id="variant-edit-price"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              inputMode="decimal"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="variant-edit-min-stock">Stock mínimo</label>
            <input
              id="variant-edit-min-stock"
              value={minStock}
              onChange={(event) => setMinStock(event.target.value)}
              inputMode="decimal"
            />
          </div>
        </div>

        <div>
          <label htmlFor="variant-edit-image">Imagen</label>
          {imageUrl && (
            <img
              src={imageUrl}
              alt={sku}
              style={{ display: 'block', maxWidth: 120, marginBottom: 6, borderRadius: 6 }}
            />
          )}
          <input
            id="variant-edit-image"
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(',')}
            onChange={handleImageChange}
            disabled={uploading}
          />
          {uploading && <p className="core-page-subtitle">Subiendo...</p>}
        </div>

        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn btn-primary" disabled={updateVariant.isPending || uploading}>
          {updateVariant.isPending ? 'Guardando...' : 'Guardar'}
        </button>
      </form>

      <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 16, paddingTop: 12 }}>
        <p className="core-page-subtitle" style={{ margin: '0 0 8px' }}>
          Precios por volumen (mayoreo)
        </p>

        {pricingTiers && pricingTiers.length === 0 && (
          <p className="core-state-message">Sin tramos configurados.</p>
        )}
        {pricingTiers && pricingTiers.length > 0 && (
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 0, margin: 0 }}>
            {pricingTiers
              .slice()
              .sort((a, b) => Number(a.min_quantity) - Number(b.min_quantity))
              .map((tier) => (
                <li
                  key={tier.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    listStyle: 'none',
                  }}
                >
                  <span>
                    Desde {tier.min_quantity} unidades → S/ {tier.unit_price}
                  </span>
                  <button
                    type="button"
                    className="btn btn-danger-ghost btn-sm btn-icon"
                    aria-label="Quitar tramo"
                    onClick={() => deleteTier.mutate(tier.id)}
                  >
                    <Trash2 />
                  </button>
                </li>
              ))}
          </ul>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <input
            value={tierMinQuantity}
            onChange={(event) => setTierMinQuantity(event.target.value)}
            inputMode="decimal"
            placeholder="Cantidad mínima"
            style={{ flex: 1 }}
          />
          <input
            value={tierUnitPrice}
            onChange={(event) => setTierUnitPrice(event.target.value)}
            inputMode="decimal"
            placeholder="Precio unitario"
            style={{ flex: 1 }}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleAddTier}
            disabled={createTier.isPending}
          >
            Agregar
          </button>
        </div>
        {tierError && (
          <p className="login-error" role="alert" style={{ marginTop: 8 }}>
            {tierError}
          </p>
        )}
      </div>
    </Modal>
  )
}
