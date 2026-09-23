/** Nombres en español de lo que registra la bitácora (Bloque B). El backend
 * guarda códigos técnicos (CREATE, SALE_VOIDED, ProductVariant...) para
 * poder filtrar por ellos; la pantalla los traduce aquí. Un código que no
 * esté en la tabla se muestra tal cual en vez de esconderse. */

export const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Creó',
  UPDATE: 'Editó',
  DELETE: 'Eliminó',
  LOGIN: 'Inició sesión',
  LOGIN_FAILED: 'Intento de inicio fallido',
  LOGOUT: 'Cerró sesión',
  PASSWORD_RESET: 'Restableció su contraseña',
  SALE_CREATED: 'Registró una venta',
  SALE_VOIDED: 'Anuló una venta',
  SALE_RETURNED: 'Registró una devolución',
  CASH_SESSION_OPENED: 'Abrió caja',
  CASH_SESSION_COUNT_SUBMITTED: 'Entregó su caja',
  CASH_SESSION_CLOSED: 'Cerró caja',
  CASH_SESSION_REPORT_EXPORTED: 'Exportó el reporte de caja',
  DEBT_PAYMENT_REGISTERED: 'Registró un abono de fiado',
  STOCK_ADJUSTED: 'Ajustó stock',
  STOCK_TRANSFERRED: 'Trasladó stock',
  PURCHASE_RECEIVED: 'Recibió una compra',
  CATALOG_IMPORTED: 'Importó el catálogo',
  RESERVATION_CREATED: 'Creó un apartado',
  RESERVATION_CANCELLED: 'Canceló un apartado',
  RESERVATION_CONVERTED: 'Convirtió un apartado en venta',
  QUOTE_CREATED: 'Creó una cotización',
  QUOTE_STATUS_CHANGED: 'Cambió el estado de una cotización',
  QUOTE_CONVERTED: 'Convirtió una cotización en venta',
  MEMBERSHIP_CREATED: 'Creó una membresía',
  MEMBERSHIP_RENEWED: 'Renovó una membresía',
  MEMBERSHIP_FROZEN: 'Congeló una membresía',
  MEMBERSHIP_UNFROZEN: 'Descongeló una membresía',
  MEMBERSHIP_CANCELLED: 'Canceló una membresía',
  MEMBERSHIP_GROUP_CREATED: 'Creó un grupo de membresías',
  CLASS_BOOKED: 'Reservó una clase',
  CLASS_ATTENDANCE_MARKED: 'Marcó asistencia a una clase',
  CLASS_BOOKING_CANCELLED: 'Canceló una reserva de clase',
  EMPLOYEE_CLOCKED_IN: 'Marcó entrada',
  EMPLOYEE_CLOCKED_OUT: 'Marcó salida',
  PAYROLL_GENERATED: 'Generó una planilla',
  PAYROLL_PAID: 'Pagó una planilla',
  USER_ROLE_CHANGED: 'Cambió los permisos de un rol',
  USER_ANONYMIZED: 'Anonimizó a un usuario',
  TENANT_SETTINGS_UPDATED: 'Cambió la configuración',
  DATA_EXPORTED: 'Generó un respaldo completo',
  AUDIT_LOG_EXPORTED: 'Exportó la bitácora',
  SUPPORT_IMPERSONATION_STARTED: 'Soporte Fivuza entró al negocio',
  SUPPORT_IMPERSONATION_ENDED: 'Soporte Fivuza salió del negocio',
}

export const ENTITY_LABELS: Record<string, string> = {
  Product: 'Producto',
  ProductVariant: 'Variante',
  Category: 'Categoría',
  Brand: 'Marca',
  Supplier: 'Proveedor',
  Attribute: 'Atributo',
  AttributeValue: 'Valor de atributo',
  Warehouse: 'Almacén',
  Stock: 'Stock',
  TaxRate: 'Impuesto',
  ProductTax: 'Impuesto de producto',
  PurchaseOrder: 'Orden de compra',
  VolumePricingTier: 'Precio por volumen',
  Customer: 'Cliente',
  Promotion: 'Promoción',
  PromotionProduct: 'Producto en promoción',
  Sale: 'Venta',
  CashRegister: 'Caja',
  CashSession: 'Sesión de caja',
  CashMovement: 'Movimiento de caja',
  ProductReservation: 'Apartado',
  Quote: 'Cotización',
  User: 'Usuario',
  Role: 'Rol',
  UserPermission: 'Permiso de usuario',
  UserWarehouse: 'Acceso a almacén',
  Employee: 'Trabajador',
  EmployeeSchedule: 'Horario',
  EmployeeAttendance: 'Asistencia',
  EmployeePayroll: 'Planilla',
  MembershipPlan: 'Plan de membresía',
  Membership: 'Membresía',
  MembershipGroup: 'Grupo de membresías',
  GymClass: 'Clase',
  ClassSchedule: 'Horario de clase',
  ClassBooking: 'Reserva de clase',
  TenantSettings: 'Configuración',
  TenantImpersonationSession: 'Sesión de soporte',
  AuditLog: 'Bitácora',
}

export function actionLabel(code: string) {
  return ACTION_LABELS[code] ?? code
}

export function entityLabel(code: string) {
  return ENTITY_LABELS[code] ?? code
}

/** Grupos del filtro de acción: los tres del CRUD van primero porque son
 * la mayoría de los registros. */
export const ACTION_FILTER_OPTIONS = Object.keys(ACTION_LABELS)
export const ENTITY_FILTER_OPTIONS = Object.keys(ENTITY_LABELS).sort((a, b) =>
  entityLabel(a).localeCompare(entityLabel(b), 'es'),
)
