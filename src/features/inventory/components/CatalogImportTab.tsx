import { CheckCircle2, Download, FileSpreadsheet, Upload, XCircle } from 'lucide-react'
import { useState, type ChangeEvent } from 'react'
import { downloadCatalogImportTemplate, type CatalogImportReport } from '../api'
import { useImportCatalog } from '../hooks/useCatalogImport'

export function CatalogImportTab() {
  const [file, setFile] = useState<File | null>(null)
  const [report, setReport] = useState<CatalogImportReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [downloadingTemplate, setDownloadingTemplate] = useState(false)

  const importCatalog = useImportCatalog()

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] ?? null)
    setReport(null)
    setError(null)
  }

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true)
    try {
      const blob = await downloadCatalogImportTemplate()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'plantilla_catalogo.csv'
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('No se pudo descargar la plantilla.')
    } finally {
      setDownloadingTemplate(false)
    }
  }

  const handleUpload = () => {
    if (!file) {
      setError('Selecciona un archivo CSV primero.')
      return
    }
    setError(null)
    importCatalog
      .mutateAsync(file)
      .then(setReport)
      .catch(() => setError('No se pudo procesar el archivo.'))
  }

  return (
    <div className="card" style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <p className="core-page-subtitle" style={{ marginTop: 0 }}>
          Sube un CSV con tu catálogo (nombre, categoría, SKU, código de barras, costo, precio,
          stock mínimo y cantidad inicial). Cada fila se valida por separado -si una fila tiene un
          error, el resto del archivo se procesa igual.
        </p>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={handleDownloadTemplate}
          disabled={downloadingTemplate}
        >
          <Download size={15} strokeWidth={2} />
          {downloadingTemplate ? 'Descargando...' : 'Descargar plantilla CSV'}
        </button>
      </div>

      <div>
        <label htmlFor="catalog-file">Archivo CSV</label>
        <input id="catalog-file" type="file" accept=".csv,text/csv" onChange={handleFileChange} />
      </div>

      {error && (
        <p className="login-error" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        className="btn btn-primary"
        onClick={handleUpload}
        disabled={!file || importCatalog.isPending}
        style={{ alignSelf: 'flex-start' }}
      >
        <Upload size={15} strokeWidth={2.5} />
        {importCatalog.isPending ? 'Procesando...' : 'Importar catálogo'}
      </button>

      {report && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
            <span className="badge badge-success">
              <span className="dot" />
              {report.created} creados
            </span>
            {report.errors > 0 && (
              <span className="badge badge-danger">
                <span className="dot" />
                {report.errors} con error
              </span>
            )}
            <span className="badge badge-neutral">
              <span className="dot" />
              {report.total} filas totales
            </span>
          </div>

          <div style={{ maxHeight: 320, overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
            <table className="core-table">
              <thead>
                <tr>
                  <th>Fila</th>
                  <th>SKU</th>
                  <th>Resultado</th>
                </tr>
              </thead>
              <tbody>
                {report.rows.map((row) => (
                  <tr key={row.row}>
                    <td>{row.row}</td>
                    <td className="core-table-strong">{row.sku || '—'}</td>
                    <td>
                      {row.status === 'created' ? (
                        <span style={{ color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <CheckCircle2 size={14} strokeWidth={2} />
                          Creado
                        </span>
                      ) : (
                        <span style={{ color: 'var(--danger)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <XCircle size={14} strokeWidth={2} />
                          {row.error}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!report && !file && (
        <div className="empty-state" style={{ padding: '24px 0' }}>
          <FileSpreadsheet />
          <p className="empty-state-title">Sin archivo seleccionado</p>
          <p className="empty-state-subtitle">Descarga la plantilla, complétala y súbela aquí.</p>
        </div>
      )}
    </div>
  )
}
