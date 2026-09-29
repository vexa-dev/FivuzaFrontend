import { CheckCircle2, Download, FileSpreadsheet, Upload, XCircle } from 'lucide-react'
import { useState, type ChangeEvent } from 'react'
import { downloadSettlementImportTemplate, type SettlementImportReport } from '../api'
import { useImportSettlement, useSettlementReconciliation } from '../hooks/useSettlements'

/** Bloque D.6: el dueño/admin carga el archivo de liquidación del operador
 * (tarjeta/Yape) y el sistema cruza cada línea contra los cobros ya
 * registrados por número de operación y monto. Mismo patrón que
 * inventory/CatalogImportTab.tsx (validación fila por fila). */
export function SettlementReconciliationTab() {
  const [file, setFile] = useState<File | null>(null)
  const [provider, setProvider] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [totalDeposited, setTotalDeposited] = useState('')
  const [totalFee, setTotalFee] = useState('')
  const [report, setReport] = useState<SettlementImportReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [downloadingTemplate, setDownloadingTemplate] = useState(false)

  const importSettlement = useImportSettlement()
  const reconciliation = useSettlementReconciliation(provider || undefined)

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] ?? null)
    setReport(null)
    setError(null)
  }

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true)
    try {
      const blob = await downloadSettlementImportTemplate()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'plantilla_liquidacion.csv'
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('No se pudo descargar la plantilla.')
    } finally {
      setDownloadingTemplate(false)
    }
  }

  const canUpload =
    file && provider.trim() && periodStart && periodEnd && totalDeposited && totalFee

  const handleUpload = () => {
    if (!canUpload) {
      setError('Completa el proveedor, el período y los totales, y selecciona un archivo.')
      return
    }
    setError(null)
    importSettlement
      .mutateAsync({
        file,
        provider: provider.trim(),
        period_start: periodStart,
        period_end: periodEnd,
        total_deposited: totalDeposited,
        total_fee: totalFee,
      })
      .then(setReport)
      .catch(() => setError('No se pudo procesar el archivo.'))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="card" style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <p className="core-page-subtitle" style={{ marginTop: 0 }}>
            Sube el archivo de liquidación del operador (número de operación, monto, comisión) para
            cruzarlo contra los cobros ya registrados.
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label htmlFor="settlement-provider">Proveedor</label>
            <input
              id="settlement-provider"
              value={provider}
              onChange={(event) => setProvider(event.target.value)}
              placeholder="Ej. Visanet, Yape"
            />
          </div>
          <div>
            <label htmlFor="settlement-total-deposited">Total depositado</label>
            <input
              id="settlement-total-deposited"
              inputMode="decimal"
              value={totalDeposited}
              onChange={(event) => setTotalDeposited(event.target.value)}
              placeholder="0.00"
            />
          </div>
          <div>
            <label htmlFor="settlement-period-start">Período desde</label>
            <input
              id="settlement-period-start"
              type="date"
              value={periodStart}
              onChange={(event) => setPeriodStart(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="settlement-period-end">Período hasta</label>
            <input
              id="settlement-period-end"
              type="date"
              value={periodEnd}
              onChange={(event) => setPeriodEnd(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="settlement-total-fee">Comisión total</label>
            <input
              id="settlement-total-fee"
              inputMode="decimal"
              value={totalFee}
              onChange={(event) => setTotalFee(event.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label htmlFor="settlement-file">Archivo CSV</label>
          <input id="settlement-file" type="file" accept=".csv,text/csv" onChange={handleFileChange} />
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
          disabled={!canUpload || importSettlement.isPending}
          style={{ alignSelf: 'flex-start' }}
        >
          <Upload size={15} strokeWidth={2.5} />
          {importSettlement.isPending ? 'Procesando...' : 'Cargar liquidación'}
        </button>

        {report && (
          <div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
              <span className="badge badge-success">
                <span className="dot" />
                {report.matched} conciliados
              </span>
              {report.unmatched > 0 && (
                <span className="badge badge-neutral">
                  <span className="dot" />
                  {report.unmatched} sin cobro
                </span>
              )}
              {report.errors > 0 && (
                <span className="badge badge-danger">
                  <span className="dot" />
                  {report.errors} con error
                </span>
              )}
            </div>

            <div style={{ maxHeight: 320, overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <table className="core-table">
                <thead>
                  <tr>
                    <th>Fila</th>
                    <th>N.º de operación</th>
                    <th>Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {report.rows.map((row) => (
                    <tr key={row.row}>
                      <td>{row.row}</td>
                      <td className="core-table-strong">{row.operation_number || '—'}</td>
                      <td>
                        {row.status === 'MATCHED' ? (
                          <span style={{ color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <CheckCircle2 size={14} strokeWidth={2} />
                            Conciliado
                          </span>
                        ) : row.status === 'UNMATCHED_DEPOSIT' ? (
                          <span style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            Depósito sin cobro
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

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h3 style={{ margin: 0 }}>Cobros con tarjeta/Yape sin depósito</h3>
        <p className="core-page-subtitle" style={{ margin: 0 }}>
          Cobros de más de 15 días sin conciliar contra ninguna liquidación cargada.
        </p>
        {reconciliation.data?.payments_without_deposit.length ? (
          <table className="core-table">
            <thead>
              <tr>
                <th>Venta</th>
                <th>Proveedor</th>
                <th>N.º de operación</th>
                <th>Monto</th>
              </tr>
            </thead>
            <tbody>
              {reconciliation.data.payments_without_deposit.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.sale_id}</td>
                  <td>{payment.provider}</td>
                  <td>{payment.operation_number}</td>
                  <td>S/ {payment.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="core-page-subtitle" style={{ margin: 0 }}>Sin pendientes.</p>
        )}
      </div>
    </div>
  )
}
