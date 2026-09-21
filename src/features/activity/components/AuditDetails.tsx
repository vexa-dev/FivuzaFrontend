type Change = { before: unknown; after: unknown }

function isChange(value: unknown): value is Change {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    'before' in value &&
    'after' in value &&
    Object.keys(value).length === 2
  )
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/** Detalle expandible de un registro de la bitácora. Si el backend guardó
 * JSON, se muestra campo por campo (y "antes → después" en una edición);
 * si es texto libre (registros previos al Bloque B), tal cual. */
export function AuditDetails({ details }: { details: string }) {
  let parsed: unknown
  try {
    parsed = JSON.parse(details)
  } catch {
    return <pre className="audit-log-details">{details}</pre>
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return <pre className="audit-log-details">{details}</pre>
  }

  const entries = Object.entries(parsed as Record<string, unknown>)
  if (entries.length === 0) return <p className="core-state-message">Sin detalle.</p>

  return (
    <dl className="activity-details">
      {entries.map(([field, value]) => (
        <div key={field} className="activity-details-row">
          <dt>{field}</dt>
          <dd>
            {isChange(value) ? (
              <>
                <span className="activity-details-before">{formatValue(value.before)}</span>
                {' → '}
                <span className="activity-details-after">{formatValue(value.after)}</span>
              </>
            ) : (
              formatValue(value)
            )}
          </dd>
        </div>
      ))}
    </dl>
  )
}
