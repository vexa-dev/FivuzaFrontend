import { Lock, Plus } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../auth/hooks/useAuth'
import { useCategories } from '../inventory/hooks/useCategories'
import { useProducts } from '../inventory/hooks/useProducts'
import { useWarehouses } from '../inventory/hooks/useWarehouses'
import { AddCashMovementModal } from './components/AddCashMovementModal'
import { CashSessionHistory } from './components/CashSessionHistory'
import { CloseCashSessionModal } from './components/CloseCashSessionModal'
import { CashRegisterAssignments } from './components/CashRegisterAssignments'
import { CollectionsTab } from './components/CollectionsTab'
import { CustomersTab } from './components/CustomersTab'
import { OpenCashSessionForm } from './components/OpenCashSessionForm'
import { POSTab } from './components/POSTab'
import { PromotionsTab } from './components/PromotionsTab'
import { QuotesTab } from './components/QuotesTab'
import { ReservationsTab } from './components/ReservationsTab'
import { SalesHistoryTab } from './components/SalesHistoryTab'
import { formatCurrency } from '../../shared/utils/format'
import type { CashSession } from './api'
import {
  useCashMovements,
  useCashRegisters,
  useCashSessionDetail,
  useOpenCashSessions,
  usePendingApprovalCashSessions,
} from './hooks/useCashSessions'

type Tab =
  | 'vender'
  | 'ventas'
  | 'caja'
  | 'historial'
  | 'clientes'
  | 'cobranzas'
  | 'promociones'
  | 'apartados'
  | 'cotizaciones'

const TABS: [Tab, string][] = [
  ['vender', 'Vender'],
  ['ventas', 'Ventas'],
  ['caja', 'Caja actual'],
  ['historial', 'Historial de caja'],
  ['clientes', 'Clientes'],
  ['cobranzas', 'Cobranzas'],
  ['promociones', 'Promociones'],
  ['apartados', 'Apartados'],
  ['cotizaciones', 'Cotizaciones'],
]

function formatDate(value: string) {
  return new Date(value).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })
}

export function SalesPage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('SALES_MANAGE')
  const [tab, setTab] = useState<Tab>('vender')
  const { data: registers } = useCashRegisters()
  const { data: categories } = useCategories()
  const { data: products } = useProducts()
  const { data: warehouses } = useWarehouses()

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="core-page-title">Ventas</h1>
          <p className="core-page-subtitle">Caja</p>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 16 }}>
        {TABS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`tab ${tab === value ? 'tab-active' : ''}`}
            onClick={() => setTab(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'vender' && <POSTab />}
      {tab === 'ventas' && <SalesHistoryTab />}
      {tab === 'caja' && <CurrentCashTab />}
      {tab === 'historial' && <CashSessionHistory registers={registers ?? []} />}
      {tab === 'clientes' && <CustomersTab canManage={canManage} />}
      {tab === 'cobranzas' && <CollectionsTab />}
      {tab === 'promociones' && (
        <PromotionsTab canManage={canManage} categories={categories ?? []} products={products ?? []} />
      )}
      {tab === 'apartados' && (
        <ReservationsTab products={products ?? []} warehouses={warehouses ?? []} />
      )}
      {tab === 'cotizaciones' && <QuotesTab products={products ?? []} />}
    </div>
  )
}

function CurrentCashTab() {
  const { hasPermission } = useAuth()
  // La asignacion de cajas (Bloque A.2) se edita aqui mismo: es gestion de
  // caja, no de personas. Se pide tambien USERS_MANAGE porque la lista de
  // usuarios a asignar viene del endpoint de usuarios.
  const canAssignRegisters = hasPermission('CASH_MANAGE') && hasPermission('USERS_MANAGE')
  const { data: sessions, isLoading } = useOpenCashSessions()
  const { data: pendingSessions } = usePendingApprovalCashSessions()
  const { data: registers } = useCashRegisters()
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)
  // La sesion que se esta cerrando se guarda aparte de la seleccion: al
  // cerrar, la lista de cajas abiertas se refresca y la sesion desaparece
  // de ella; si el modal dependiera de selectedSession se desmontaria antes
  // de mostrar el resultado del arqueo (esperado, contado, diferencia).
  const [closingSession, setClosingSession] = useState<CashSession | null>(null)
  const [showAddMovement, setShowAddMovement] = useState(false)

  const registerName = (id: number) => registers?.find((r) => r.id === id)?.name ?? `Caja #${id}`

  if (isLoading) {
    return (
      <div className="loading-row">
        <span className="spinner" />
        Cargando...
      </div>
    )
  }

  const openSessions = sessions ?? []
  const pending = pendingSessions ?? []
  const selectedSession =
    [...openSessions, ...pending].find((s) => s.id === selectedSessionId) ?? null

  return (
    <div>
      {openSessions.length === 0 && pending.length === 0 && <OpenCashSessionForm />}

      {pending.length > 0 && !selectedSession && (
        <div className="summary-cards" style={{ marginBottom: 16 }}>
          {pending.map((session) => (
            <button
              key={session.id}
              type="button"
              className="card summary-card"
              onClick={() => setSelectedSessionId(session.id)}
            >
              <div>
                <span className="summary-card-value">
                  {registerName(session.cash_register)}
                </span>
                <span className="summary-card-label">
                  Entregada · contado {formatCurrency(session.counted_closing_amount ?? 0)}
                </span>
                <span className="badge badge-warning" style={{ marginTop: 6 }}>
                  <span className="dot" />
                  Esperando aprobación
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {openSessions.length > 0 && !selectedSession && (
        <div className="summary-cards">
          {openSessions.map((session) => (
            <button
              key={session.id}
              type="button"
              className="card summary-card"
              onClick={() => setSelectedSessionId(session.id)}
            >
              <div>
                <span className="summary-card-value">{registerName(session.cash_register)}</span>
                <span className="summary-card-label">
                  Abierta {formatDate(session.opening_at)} · {formatCurrency(session.opening_amount)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedSession && (
        <CashSessionDetail
          session={selectedSession}
          registerName={registerName(selectedSession.cash_register)}
          onBack={() => setSelectedSessionId(null)}
          onAddMovement={() => setShowAddMovement(true)}
          onClose={() => setClosingSession(selectedSession)}
        />
      )}

      {selectedSession && showAddMovement && (
        <AddCashMovementModal
          sessionId={selectedSession.id}
          onClose={() => setShowAddMovement(false)}
        />
      )}

      {canAssignRegisters && (
        <div style={{ marginTop: 16 }}>
          <CashRegisterAssignments />
        </div>
      )}

      {closingSession && (
        <CloseCashSessionModalContainer
          session={closingSession}
          onClose={() => {
            setClosingSession(null)
            setSelectedSessionId(null)
          }}
        />
      )}
    </div>
  )
}

function CashSessionDetail({
  session,
  registerName,
  onBack,
  onAddMovement,
  onClose,
}: {
  session: CashSession
  registerName: string
  onBack: () => void
  onAddMovement: () => void
  onClose: () => void
}) {
  const { data: movements, isLoading } = useCashMovements(session.id)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card" style={{ padding: 20 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <h2 className="core-page-title" style={{ fontSize: '1.125rem', margin: 0 }}>
              {registerName}
            </h2>
            <p className="core-state-message" style={{ margin: '4px 0 0' }}>
              Abierta {formatDate(session.opening_at)} · Monto inicial{' '}
              {formatCurrency(session.opening_amount)}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onBack}>
              Otra caja
            </button>
            {session.status === 'OPEN' && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={onAddMovement}>
                <Plus size={14} strokeWidth={2} />
                Movimiento
              </button>
            )}
            <button type="button" className="btn btn-primary btn-sm" onClick={onClose}>
              <Lock size={14} strokeWidth={2} />
              {session.status === 'PENDING_APPROVAL' ? 'Revisar caja' : 'Cerrar caja'}
            </button>
          </div>
        </div>
      </div>

      <div className="card core-table-card">
        <div className="table-toolbar">
          <span className="summary-section-title" style={{ margin: 0 }}>
            Movimientos
          </span>
        </div>
        {isLoading && (
          <div className="loading-row">
            <span className="spinner" />
            Cargando...
          </div>
        )}
        {movements && movements.length === 0 && (
          <p className="core-state-message">Todavía no hay movimientos en esta sesión.</p>
        )}
        {movements && movements.length > 0 && (
          <table className="core-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Concepto</th>
                <th>Monto</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((movement) => (
                <tr key={movement.id}>
                  <td>
                    <span
                      className={`badge ${movement.type === 'IN' ? 'badge-success' : 'badge-danger'}`}
                    >
                      <span className="dot" />
                      {movement.type === 'IN' ? 'Ingreso' : 'Egreso'}
                    </span>
                  </td>
                  <td>{movement.concept}</td>
                  <td className="core-table-strong">{formatCurrency(movement.amount)}</td>
                  <td>{formatDate(movement.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// Carga los movimientos una vez mas aqui (React Query reusa el cache de
// CashSessionDetail por queryKey, no duplica el request) para que
// CloseCashSessionModal tenga el estimado en vivo sin acoplar su prop a
// un estado que ya vive en CashSessionDetail.
function CloseCashSessionModalContainer({
  session,
  onClose,
}: {
  session: CashSession
  onClose: () => void
}) {
  const { data: movements } = useCashMovements(session.id)
  // El desglose por metodo (Bloque A.4) vive en el detalle de la sesion, no
  // en el listado: se pasa como prop para que el modal siga siendo una
  // vista tonta, facil de probar sin red.
  const { data: detail } = useCashSessionDetail(session.id)
  return (
    <CloseCashSessionModal
      session={session}
      movements={movements ?? []}
      paymentTotals={detail?.payment_totals}
      onClose={onClose}
    />
  )
}
