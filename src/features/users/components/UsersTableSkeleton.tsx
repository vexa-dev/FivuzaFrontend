export function UsersTableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <table className="core-table">
      <thead>
        <tr>
          <th>Correo</th>
          <th>Rol</th>
          <th>Estado</th>
          <th>Último ingreso</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, index) => (
          <tr className="skeleton-row" key={index}>
            <td>
              <div className="skeleton-avatar-cell">
                <span className="skeleton-avatar" />
                <span className="skeleton-bar" style={{ width: 160 }} />
              </div>
            </td>
            <td>
              <span className="skeleton-bar" style={{ width: 70 }} />
            </td>
            <td>
              <span className="skeleton-bar" style={{ width: 60, borderRadius: 20 }} />
            </td>
            <td>
              <span className="skeleton-bar" style={{ width: 110 }} />
            </td>
            <td>
              <span className="skeleton-bar" style={{ width: 80 }} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
