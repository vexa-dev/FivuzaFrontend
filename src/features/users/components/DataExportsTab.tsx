import { Database, Download } from 'lucide-react'
import { useState } from 'react'
import { EmptyState } from '../../../shared/components/EmptyState'
import type { DataExportFormat, DataExportStatus } from '../api'
import { useDataExportDownloadUrl, useDataExports, useRequestDataExport } from '../hooks/useDataExports'

const STATUS_LABELS: Record<DataExportStatus, string> = {
  PENDING: 'Pendiente',
  PROCESSING: 'Procesando',
  COMPLETED: 'Completado',
  FAILED: 'Fallido',
  EXPIRED: 'Expirado',
}

const STATUS_BADGE: Record<DataExportStatus, string> = {
  PENDING: 'badge-neutral',
  PROCESSING: 'badge-neutral',
  COMPLETED: 'badge-success',
  FAILED: 'badge-danger',
  EXPIRED: 'badge-neutral',
}

/** Sprint 33: respaldo completo del negocio -siempre asincrono (Celery ->
 * ZIP/XLSX -> S3), con URL prefirmada de 15 minutos generada al momento de
 * la descarga (no se guarda, por eso se pide fresca en cada click). */
export function DataExportsTab() {
  const { data: exports, isLoading, error } = useDataExports()
  const requestExport = useRequestDataExport()
  const downloadUrl = useDataExportDownloadUrl()
  const [format, setFormat] = useState<DataExportFormat>('XLSX')
  const [requestError, setRequestError] = useState<string | null>(null)

  const formatDate = (value: string | null) =>
    value
      ? new Date(value).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })
      : '—'

  const handleRequest = () => {
    setRequestError(null)
    requestExport.mutate(format, {
      onError: () =>
        setRequestError('Ya se solicitó un respaldo hoy. Vuelve a intentarlo mañana.'),
    })
  }

  const handleDownload = (id: number) => {
    downloadUrl.mutate(id, {
      onSuccess: (data) => window.open(data.download_url, '_blank', 'noopener,noreferrer'),
    })
  }

  return (
    <div className="card core-table-card">
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, padding: 16 }}>
        <div>
          <label htmlFor="export-format">Formato</label>
          <select
            id="export-format"
            value={format}
            onChange={(event) => setFormat(event.target.value as DataExportFormat)}
          >
            <option value="XLSX">Excel (XLSX)</option>
            <option value="ZIP">ZIP (CSV)</option>
          </select>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleRequest}
          disabled={requestExport.isPending}
        >
          {requestExport.isPending ? 'Solicitando...' : 'Solicitar respaldo completo'}
        </button>
      </div>

      {requestError && (
        <p className="login-error" role="alert" style={{ margin: '0 16px 16px' }}>
          {requestError}
        </p>
      )}

      {isLoading && (
        <div className="loading-row">
          <span className="spinner" />
          Cargando...
        </div>
      )}
      {error && (
        <p className="core-state-message" role="alert">
          No se pudo cargar el historial de respaldos.
        </p>
      )}
      {exports && exports.length === 0 && (
        <EmptyState icon={<Database />} title="Todavía no se ha solicitado ningún respaldo" />
      )}
      {exports && exports.length > 0 && (
        <table className="core-table">
          <thead>
            <tr>
              <th>Solicitado</th>
              <th>Formato</th>
              <th>Estado</th>
              <th>Expira</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {exports.map((item) => (
              <tr key={item.id}>
                <td>{formatDate(item.requested_at)}</td>
                <td>{item.format}</td>
                <td>
                  <span className={`badge ${STATUS_BADGE[item.status]}`}>
                    <span className="dot" />
                    {STATUS_LABELS[item.status]}
                  </span>
                </td>
                <td>{formatDate(item.expires_at)}</td>
                <td>
                  {item.status === 'COMPLETED' && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm btn-icon"
                      aria-label="Descargar respaldo"
                      onClick={() => handleDownload(item.id)}
                      disabled={downloadUrl.isPending}
                    >
                      <Download />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
