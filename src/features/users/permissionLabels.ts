/** Traduce los codigos tecnicos de permiso (USERS_MANAGE_ROLES, CASH_MANAGE...)
 * a una frase que un dueño de negocio entiende sin explicacion. El backend no
 * llena Permission.description todavia (queda vacio al sembrarse el
 * catalogo), asi que esta tabla vive en el frontend -mismo criterio que
 * MODULE_LABELS para el nombre del modulo. */
export const PERMISSION_LABELS: Record<string, string> = {
  USERS_MANAGE_ROLES: 'Crear roles y decidir qué puede hacer cada uno',
  USERS_MANAGE: 'Agregar, editar y dar de baja usuarios',
  USERS_VIEW_AUDIT: 'Ver el historial de actividad del negocio',
  HR_MANAGE: 'Gestionar personal: asistencia, horarios y planilla',
  INVENTORY_VIEW: 'Ver el catálogo y el stock disponible',
  INVENTORY_MANAGE: 'Editar el catálogo y ajustar el stock',
  PURCHASES_MANAGE: 'Registrar compras a proveedores',
  CASH_MANAGE: 'Abrir y cerrar caja, registrar ingresos y egresos',
  SALES_MANAGE: 'Vender y gestionar clientes y promociones',
}

export function permissionLabel(code: string): string {
  return PERMISSION_LABELS[code] ?? code
}
