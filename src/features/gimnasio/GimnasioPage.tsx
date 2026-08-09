import { useState } from 'react'
import '../core/CorePage.css'
import { useAuth } from '../auth/hooks/useAuth'
import { MembershipPlansTab } from './components/MembershipPlansTab'
import { MembersTab } from './components/MembersTab'

type Tab = 'socios' | 'planes'

const TABS: [Tab, string][] = [
  ['socios', 'Socios'],
  ['planes', 'Planes'],
]

export function GimnasioPage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('GYM_MANAGE')
  const [tab, setTab] = useState<Tab>('socios')

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="core-page-title">Gimnasio</h1>
          <p className="core-page-subtitle">Membresías y planes</p>
        </div>
      </div>

      <div className="tabs">
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

      {tab === 'socios' && <MembersTab />}
      {tab === 'planes' && <MembershipPlansTab canManage={canManage} />}
    </div>
  )
}
