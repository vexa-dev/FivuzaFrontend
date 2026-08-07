import { getAccessToken } from '../auth/hooks/session'
import { tenantApiFetch } from '../../shared/utils/tenantApiClient'

export interface Employee {
  id: number
  user: number | null
  full_name: string
  document_number: string
  phone: string
  position: string
  warehouse: number
  salary_type: 'MONTHLY' | 'DAILY' | 'HOURLY'
  salary_amount: string
  currency: string
  hire_date: string
  termination_date: string | null
  is_active: boolean
  created_at: string
}

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY'

export interface EmployeeSchedule {
  id: number
  employee: number
  day_of_week: DayOfWeek
  start_time: string
  end_time: string
  is_active: boolean
}

export interface EmployeeAttendance {
  id: number
  employee: number
  warehouse: number
  check_in: string
  check_out: string | null
  status: 'ON_TIME' | 'LATE' | 'ABSENCE_JUSTIFIED' | 'ABSENCE_UNJUSTIFIED'
  notes: string | null
  worked_hours: string | null
  created_at: string
}

function authed<T>(path: string, init: Parameters<typeof tenantApiFetch>[1] = {}) {
  return tenantApiFetch<T>(path, { ...init, token: getAccessToken() })
}

// Empleados
export const fetchEmployees = (params?: { search?: string; warehouse?: number }) => {
  const query = new URLSearchParams()
  if (params?.search) query.set('search', params.search)
  if (params?.warehouse) query.set('warehouse', String(params.warehouse))
  const qs = query.toString()
  return authed<Employee[]>(`/usuarios/employees/${qs ? `?${qs}` : ''}`)
}

export const createEmployee = (
  data: Omit<Employee, 'id' | 'created_at' | 'is_active' | 'termination_date'> & {
    termination_date?: string | null
  },
) => authed<Employee>('/usuarios/employees/', { method: 'POST', body: data })

export const updateEmployee = (id: number, data: Partial<Employee>) =>
  authed<Employee>(`/usuarios/employees/${id}/`, { method: 'PATCH', body: data })

export const deleteEmployee = (id: number) =>
  authed<void>(`/usuarios/employees/${id}/`, { method: 'DELETE' })

// Horarios
export const fetchEmployeeSchedules = (employeeId?: number) =>
  authed<EmployeeSchedule[]>(
    `/usuarios/employee-schedules/${employeeId ? `?employee=${employeeId}` : ''}`,
  )

export const createEmployeeSchedule = (data: Omit<EmployeeSchedule, 'id'>) =>
  authed<EmployeeSchedule>('/usuarios/employee-schedules/', { method: 'POST', body: data })

export const updateEmployeeSchedule = (id: number, data: Partial<EmployeeSchedule>) =>
  authed<EmployeeSchedule>(`/usuarios/employee-schedules/${id}/`, {
    method: 'PATCH',
    body: data,
  })

export const deleteEmployeeSchedule = (id: number) =>
  authed<void>(`/usuarios/employee-schedules/${id}/`, { method: 'DELETE' })

// Asistencia
export const fetchAttendance = (employeeId?: number) =>
  authed<EmployeeAttendance[]>(
    `/usuarios/employee-attendance/${employeeId ? `?employee=${employeeId}` : ''}`,
  )

export const clockIn = (data: { employee_id: number; warehouse_id: number }) =>
  authed<{ id: number; check_in: string; status: string }>(
    '/usuarios/employee-attendance/clock-in/',
    { method: 'POST', body: data },
  )

export const clockOut = (id: number) =>
  authed<{ id: number; check_out: string }>(`/usuarios/employee-attendance/${id}/clock-out/`, {
    method: 'POST',
  })
