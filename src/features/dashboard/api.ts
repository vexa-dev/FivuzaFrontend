import { getAccessToken } from '../auth/hooks/session'
import { tenantApiFetch } from '../../shared/utils/tenantApiClient'

export interface SalesRangeMetric {
  total_sales: string
  by_day: { date: string; total: string; transactions: number; discount: string }[]
}

export interface DashboardMetrics {
  today: { total_sales: string; total_transactions: number }
  week: SalesRangeMetric
  month: SalesRangeMetric
  comparison_vs_previous_month: {
    current_total: string
    previous_total: string
    change_pct: string | null
  }
  top_products: { product_name: string; quantity_sold: string; revenue: string }[]
  gross_margin: {
    total_revenue: string
    total_cost: string
    gross_margin: string
    margin_pct: string | null
  }
  critical_stock_count: number
  payment_method_distribution: { method: string; total: string }[]
}

export interface DashboardWidget {
  id: number
  user: number
  widget_code: 'SALES_TODAY' | 'LOW_STOCK' | 'CASH_STATUS' | 'TOP_PRODUCTS' | 'ATTENDANCE_TODAY'
  position: number
  is_visible: boolean
}

function authed<T>(path: string, init: Parameters<typeof tenantApiFetch>[1] = {}) {
  return tenantApiFetch<T>(path, { ...init, token: getAccessToken() })
}

export const fetchDashboardMetrics = (warehouseId?: number) =>
  authed<DashboardMetrics>(
    `/dashboard/metrics/${warehouseId ? `?warehouse=${warehouseId}` : ''}`,
  )

export const fetchDashboardWidgets = () => authed<DashboardWidget[]>('/dashboard/widgets/')

export const createDashboardWidget = (data: Omit<DashboardWidget, 'id' | 'user'>) =>
  authed<DashboardWidget>('/dashboard/widgets/', { method: 'POST', body: data })

export const updateDashboardWidget = (id: number, data: Partial<DashboardWidget>) =>
  authed<DashboardWidget>(`/dashboard/widgets/${id}/`, { method: 'PATCH', body: data })
