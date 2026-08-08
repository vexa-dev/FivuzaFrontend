import { Download } from 'lucide-react'
import { useState } from 'react'

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

interface ExportButtonsProps {
  disabled?: boolean
  onDownload: (format: 'csv' | 'xlsx') => Promise<Blob>
  filename: string
}

/** Botones "Exportar CSV/Excel" compartidos entre todas las pantallas de
 * listado y reporte (Sprint 25, API Spec §4.16) -mismo componente, cada
 * pantalla solo provee su propia función de descarga contra el reporte
 * correspondiente. */
export function ExportButtons({ disabled, onDownload, filename }: ExportButtonsProps) {
  const [downloading, setDownloading] = useState<'csv' | 'xlsx' | null>(null)

  const handleDownload = async (format: 'csv' | 'xlsx') => {
    setDownloading(format)
    try {
      const blob = await onDownload(format)
      triggerDownload(blob, `${filename}.${format}`)
    } finally {
      setDownloading(null)
    }
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        disabled={disabled || downloading !== null}
        onClick={() => handleDownload('csv')}
      >
        <Download size={13} strokeWidth={2} />
        {downloading === 'csv' ? 'Descargando...' : 'CSV'}
      </button>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        disabled={disabled || downloading !== null}
        onClick={() => handleDownload('xlsx')}
      >
        <Download size={13} strokeWidth={2} />
        {downloading === 'xlsx' ? 'Descargando...' : 'Excel'}
      </button>
    </>
  )
}
