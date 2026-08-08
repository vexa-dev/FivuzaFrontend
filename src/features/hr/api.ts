import { getAccessToken } from '../auth/hooks/session'
import { tenantApiFetch, tenantApiFetchBlob } from '../../shared/utils/tenantApiClient'

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

export interface EmployeePayroll {
  id: number
  employee: number
  period_start: string
  period_end: string
  base_salary: string
  bonuses: string
  deductions: string
  net_amount: string
  status: 'PENDING' | 'PAID'
  payment_date: string | null
  created_at: string
}

export interface AttendanceReportRow {
  employee_id: number
  full_name: string
  on_time_count: number
  late_count: number
  absence_justified_count: number
  absence_unjustified_count: number
  total_worked_hours: string
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

// Planilla
export const fetchPayroll = (employeeId?: number) =>
  authed<EmployeePayroll[]>(
    `/usuarios/employee-payroll/${employeeId ? `?employee=${employeeId}` : ''}`,
  )

export const generatePayroll = (data: {
  employee_id: number
  period_start: string
  period_end: string
  bonuses?: string
  deductions?: string
}) => authed<EmployeePayroll>('/usuarios/employee-payroll/generate/', { method: 'POST', body: data })

export const markPayrollPaid = (id: number, paymentDate?: string) =>
  authed<EmployeePayroll>(`/usuarios/employee-payroll/${id}/mark-paid/`, {
    method: 'POST',
    body: paymentDate ? { payment_date: paymentDate } : {},
  })

// Reportes
export const fetchAttendanceReport = (params: { date_from: string; date_to: string; employee?: number }) => {
  const query = new URLSearchParams({ date_from: params.date_from, date_to: params.date_to })
  if (params.employee) query.set('employee', String(params.employee))
  return authed<AttendanceReportRow[]>(`/usuarios/reports/attendance/?${query.toString()}`)
}

export const downloadAttendanceReport = (
  params: { date_from: string; date_to: string; employee?: number },
  format: 'csv' | 'xlsx',
) => {
  const query = new URLSearchParams({ date_from: params.date_from, date_to: params.date_to, export: format })
  if (params.employee) query.set('employee', String(params.employee))
  return tenantApiFetchBlob(`/usuarios/reports/attendance/?${query.toString()}`, getAccessToken())
}

export const fetchPayrollCostReport = (params: { period_start: string; period_end: string }) => {
  const query = new URLSearchParams(params)
  return authed<{ total_net_amount: string; rows: Record<string, string>[] }>(
    `/usuarios/reports/payroll-cost/?${query.toString()}`,
  )
}

export const downloadPayrollCostReport = (
  params: { period_start: string; period_end: string },
  format: 'csv' | 'xlsx',
) => {
  const query = new URLSearchParams({ ...params, export: format })
  return tenantApiFetchBlob(`/usuarios/reports/payroll-cost/?${query.toString()}`, getAccessToken())
}
