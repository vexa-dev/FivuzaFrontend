import { useState } from 'react'
import '../core/CorePage.css'
import { useWarehouses } from '../inventory/hooks/useWarehouses'
import { useUsers } from '../users/hooks/useUsers'
import { AttendanceTab } from './components/AttendanceTab'
import { EmployeesTab } from './components/EmployeesTab'
import { SchedulesTab } from './components/SchedulesTab'
import { useEmployees } from './hooks/useEmployees'

type Tab = 'trabajadores' | 'horarios' | 'asistencia'

const TABS: [Tab, string][] = [
  ['trabajadores', 'Trabajadores'],
  ['horarios', 'Horarios'],
  ['asistencia', 'Asistencia'],
]

export function HRPage() {
  const [tab, setTab] = useState<Tab>('trabajadores')
  const { data: warehouses } = useWarehouses()
  const { data: users } = useUsers()
  const { data: employees } = useEmployees()

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="core-page-title">Recursos Humanos</h1>
          <p className="core-page-subtitle">Trabajadores, horarios y asistencia</p>
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

      {tab === 'trabajadores' && (
        <EmployeesTab warehouses={warehouses ?? []} users={users ?? []} />
      )}

      {tab === 'horarios' && <SchedulesTab employees={employees ?? []} />}

      {tab === 'asistencia' && <AttendanceTab employees={employees ?? []} />}
    </div>
  )
}
