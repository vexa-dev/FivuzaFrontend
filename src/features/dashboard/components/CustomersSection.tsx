import { Banknote, PiggyBank, Users } from 'lucide-react'
import { useMemo } from 'react'
import { EmptyState } from '../../../shared/components/EmptyState'
import { formatCurrency } from '../../../shared/utils/format'
import { useCustomers } from '../../sales/hooks/useCustomers'
import { RankingBars } from './ChartPrimitives'
import { MiniStat, SectionHeader } from './DashboardSection'

/** Clientes: saldo a favor total, quien concentra la deuda, y quien ya
 * pasó su límite de crédito -antes solo se veia "cuantos clientes deben"
 * en Pendientes, sin poder distinguir un cliente con S/20 de uno con
 * S/2000 sin entrar al modulo de Ventas &gt; Clientes uno por uno. */
export function CustomersSection() {
  const { data: customers } = useCustomers()

  const { totalBalance, topDebtors, overLimitCount } = useMemo(() => {
    const list = customers ?? []
    const totalBalance = list.reduce((sum, customer) => sum + Number(customer.current_balance), 0)
    const topDebtors = list
      .filter((customer) => Number(customer.current_debt) > 0)
      .slice()
      .sort((a, b) => Number(b.current_debt) - Number(a.current_debt))
      .slice(0, 5)
    const overLimitCount = list.filter(
      (customer) =>
        customer.credit_limit !== null && Number(customer.current_debt) > Number(customer.credit_limit),
    ).length
    return { totalBalance, topDebtors, overLimitCount }
  }, [customers])

  return (
    <div className="dashboard-section">
      <SectionHeader icon={<Users size={15} strokeWidth={2} />} title="Clientes" />

      <div className="dashboard-mini-stats-grid">
        <MiniStat
          icon={<PiggyBank size={13} strokeWidth={2} />}
          label="Saldo a favor total"
          value={formatCurrency(totalBalance)}
          caption="Por devoluciones, disponible para usar en próximas compras"
        />
        <MiniStat
          icon={<Banknote size={13} strokeWidth={2} />}
          label="Clientes con crédito excedido"
          value={String(overLimitCount)}
          caption="Deuda actual por encima de su límite de crédito"
        />
      </div>

      <div className="card">
        <div style={{ padding: '12px 16px 0' }}>
          <h3 className="card-title">Clientes con mayor deuda</h3>
        </div>
        {topDebtors.length === 0 ? (
          <EmptyState icon={<Banknote />} title="Ningún cliente tiene deuda pendiente" />
        ) : (
          <RankingBars
            items={topDebtors.map((customer) => ({
              key: customer.id,
              label: customer.name,
              value: Number(customer.current_debt),
              sublabel:
                customer.credit_limit !== null
                  ? `Límite: ${formatCurrency(customer.credit_limit)}`
                  : 'Sin límite de crédito',
            }))}
            valueFormatter={formatCurrency}
            colorFor={(item) => {
              const customer = topDebtors.find((c) => c.id === item.key)
              const overLimit =
                customer?.credit_limit !== null &&
                customer !== undefined &&
                Number(customer.current_debt) > Number(customer.credit_limit)
              return overLimit ? 'var(--danger)' : 'var(--warning)'
            }}
          />
        )}
      </div>
    </div>
  )
}
