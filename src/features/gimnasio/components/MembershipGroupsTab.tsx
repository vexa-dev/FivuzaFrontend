import { Users } from 'lucide-react'
import { useState } from 'react'
import { EmptyState } from '../../../shared/components/EmptyState'
import { useCustomers } from '../../sales/hooks/useCustomers'
import { useMembershipPlans } from '../hooks/useMembershipPlans'
import { useCreateMembershipGroup, useMembershipGroups } from '../hooks/useMembershipGroups'
import { useMemberships } from '../hooks/useMemberships'

export function MembershipGroupsTab() {
  const { data: groups, isLoading } = useMembershipGroups()
  const { data: plans } = useMembershipPlans()
  const createGroup = useCreateMembershipGroup()

  const [holderSearch, setHolderSearch] = useState('')
  const [holderId, setHolderId] = useState<number | ''>('')
  const { data: holderCandidates } = useCustomers(holderSearch)
  const selectedHolder = holderCandidates?.find((c) => c.id === holderId)

  const [name, setName] = useState('')
  const [memberSearch, setMemberSearch] = useState('')
  const { data: memberCandidates } = useCustomers(memberSearch)
  const [pickingCustomerId, setPickingCustomerId] = useState<number | ''>('')
  const { data: pickingMemberships } = useMemberships(
    pickingCustomerId ? { customer: pickingCustomerId, status: 'ACTIVE' } : undefined,
  )
  const [selectedMembershipIds, setSelectedMembershipIds] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)

  const planName = (id: number) => plans?.find((p) => p.id === id)?.name ?? `#${id}`

  const handleCreate = () => {
    setError(null)
    if (!holderId || selectedMembershipIds.length < 2) {
      setError('Selecciona un titular y al menos 2 membresías.')
      return
    }
    createGroup
      .mutateAsync({
        holder_customer_id: holderId,
        name,
        membership_ids: selectedMembershipIds,
      })
      .then(() => {
        setHolderId('')
        setName('')
        setSelectedMembershipIds([])
      })
      .catch(() => setError('No se pudo crear el grupo.'))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h4 style={{ margin: 0 }}>Nueva membresía familiar/grupal</h4>

        <div>
          <label htmlFor="group-holder">Titular de pago</label>
          <input
            id="group-holder"
            value={selectedHolder ? selectedHolder.name : holderSearch}
            onChange={(event) => {
              setHolderSearch(event.target.value)
              setHolderId('')
            }}
            placeholder="Buscar socio titular..."
            autoComplete="off"
          />
          {!selectedHolder && holderSearch.trim() && holderCandidates && holderCandidates.length > 0 && (
            <div className="card" style={{ marginTop: 4, maxHeight: 140, overflowY: 'auto' }}>
              {holderCandidates.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  className="btn btn-ghost"
                  style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 0 }}
                  onClick={() => {
                    setHolderId(customer.id)
                    setHolderSearch('')
                  }}
                >
                  {customer.name} · {customer.document_number}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="group-name">Nombre del grupo (opcional)</label>
          <input
            id="group-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Familia Rojas"
          />
        </div>

        <div>
          <label htmlFor="group-member-search">Agregar membresía por socio</label>
          <input
            id="group-member-search"
            value={memberSearch}
            onChange={(event) => {
              setMemberSearch(event.target.value)
              setPickingCustomerId('')
            }}
            placeholder="Buscar socio a vincular..."
            autoComplete="off"
          />
          {memberSearch.trim() && memberCandidates && memberCandidates.length > 0 && (
            <div className="card" style={{ marginTop: 4, maxHeight: 140, overflowY: 'auto' }}>
              {memberCandidates.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  className="btn btn-ghost"
                  style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 0 }}
                  onClick={() => {
                    setPickingCustomerId(customer.id)
                    setMemberSearch('')
                  }}
                >
                  {customer.name} · {customer.document_number}
                </button>
              ))}
            </div>
          )}
        </div>

        {pickingCustomerId !== '' && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {pickingMemberships && pickingMemberships.length === 0 && (
              <p className="core-page-subtitle" style={{ margin: 0 }}>
                Este socio no tiene membresías activas.
              </p>
            )}
            {pickingMemberships?.map((membership) => (
              <button
                key={membership.id}
                type="button"
                className={`btn btn-sm ${
                  selectedMembershipIds.includes(membership.id) ? 'btn-primary' : 'btn-ghost'
                }`}
                onClick={() =>
                  setSelectedMembershipIds((ids) =>
                    ids.includes(membership.id)
                      ? ids.filter((id) => id !== membership.id)
                      : [...ids, membership.id],
                  )
                }
              >
                {planName(membership.plan)} (#{membership.id})
              </button>
            ))}
          </div>
        )}

        {selectedMembershipIds.length > 0 && (
          <p className="core-page-subtitle" style={{ margin: 0 }}>
            {selectedMembershipIds.length} membresía(s) seleccionada(s).
          </p>
        )}

        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          className="btn btn-primary"
          style={{ alignSelf: 'flex-start' }}
          onClick={handleCreate}
          disabled={createGroup.isPending}
        >
          {createGroup.isPending ? 'Creando...' : 'Crear grupo'}
        </button>
      </div>

      <div className="card core-table-card">
        {isLoading && (
          <div className="loading-row">
            <span className="spinner" />
            Cargando...
          </div>
        )}
        {groups && groups.length === 0 && (
          <EmptyState icon={<Users />} title="Todavía no hay grupos familiares/grupales" />
        )}
        {groups && groups.length > 0 && (
          <table className="core-table">
            <thead>
              <tr>
                <th>Grupo</th>
                <th>Titular</th>
                <th>Membresías</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <tr key={group.id}>
                  <td className="core-table-strong">{group.name || `Grupo #${group.id}`}</td>
                  <td>#{group.holder_customer}</td>
                  <td>{group.memberships.map((m) => planName(m.plan)).join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
