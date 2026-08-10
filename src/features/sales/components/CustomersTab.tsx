import { Pencil, Plus, Receipt, Search, Trash2, Users } from 'lucide-react'
import { useState } from 'react'
import { EmptyState } from '../../../shared/components/EmptyState'
import { formatCurrency } from '../../../shared/utils/format'
import type { Customer } from '../api'
import { useCustomers, useDeleteCustomer } from '../hooks/useCustomers'
import { AccountStatementModal } from './AccountStatementModal'
import { CustomerFormModal } from './CustomerFormModal'

export function CustomersTab({ canManage }: { canManage: boolean }) {
  const [search, setSearch] = useState('')
  const { data: customers, isLoading } = useCustomers(search)
  const deleteCustomer = useDeleteCustomer()
  const [editingCustomer, setEditingCustomer] = useState<Customer | null | undefined>(undefined)
  const [statementFor, setStatementFor] = useState<Customer | null>(null)

  return (
    <div className="card core-table-card">
      <div className="table-toolbar">
        <div className="search-input">
          <Search />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por documento, nombre o teléfono..."
          />
        </div>
        {canManage && (
          <button type="button" className="btn btn-primary" onClick={() => setEditingCustomer(null)}>
            <Plus size={14} strokeWidth={2} />
            Nuevo cliente
          </button>
        )}
      </div>

      {isLoading && (
        <div className="loading-row">
          <span className="spinner" />
          Cargando...
        </div>
      )}
      {customers && customers.length === 0 && (
        <EmptyState
          icon={<Users />}
          title={search ? 'Sin resultados' : 'Todavía no hay clientes'}
          subtitle={
            search
              ? 'Prueba con otro término de búsqueda.'
              : canManage
                ? 'Crea el primero con "Nuevo cliente".'
                : 'Cuando se registren clientes, aparecerán aquí.'
          }
        />
      )}
      {customers && customers.length > 0 && (
        <table className="core-table">
          <thead>
            <tr>
              <th>Documento</th>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Deuda</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>
                  {customer.document_type} {customer.document_number}
                </td>
                <td className="core-table-strong">{customer.name}</td>
                <td>{customer.phone || '—'}</td>
                <td>
                  {Number(customer.current_debt) > 0 ? (
                    <span className="badge badge-danger">
                      <span className="dot" />
                      {formatCurrency(customer.current_debt)}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm btn-icon"
                      aria-label={`Estado de cuenta de ${customer.name}`}
                      onClick={() => setStatementFor(customer)}
                    >
                      <Receipt />
                    </button>
                    {canManage && (
                      <>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm btn-icon"
                          aria-label={`Editar ${customer.name}`}
                          onClick={() => setEditingCustomer(customer)}
                        >
                          <Pencil />
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger-ghost btn-sm btn-icon"
                          aria-label={`Eliminar ${customer.name}`}
                          onClick={() => {
                            if (confirm(`¿Dar de baja a ${customer.name}?`)) {
                              deleteCustomer.mutate(customer.id)
                            }
                          }}
                        >
                          <Trash2 />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editingCustomer !== undefined && (
        <CustomerFormModal
          editingCustomer={editingCustomer}
          onClose={() => setEditingCustomer(undefined)}
        />
      )}

      {statementFor && (
        <AccountStatementModal customer={statementFor} onClose={() => setStatementFor(null)} />
      )}
    </div>
  )
}
