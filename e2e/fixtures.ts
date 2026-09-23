import { expect, type Page } from '@playwright/test'

// Datos fijos que siembra `manage.py seed_e2e` en el backend.
export const E2E = {
  email: 'admin@e2e.fivuza.test',
  password: 'Clave-E2E-2026',
  productName: 'Camiseta E2E',
  productSku: 'E2E-001',
  // Producto con promoción vigente de -20% sobre S/ 25.00.
  promoProductName: 'Gorra Promo E2E',
  promoProductSku: 'E2E-PROMO',
  customerName: 'Cliente E2E',
  customerDocument: '70000001',
  cashRegister: 'Caja Principal',
  // Bloque A: dos cajeros, cada uno con su caja asignada.
  cashierOne: 'cajero1@e2e.fivuza.test',
  cashierTwo: 'cajero2@e2e.fivuza.test',
  cashierPassword: 'Clave-E2E-2026',
  cashierOneRegister: 'Caja Cajero 1',
  cashierTwoRegister: 'Caja Cajero 2',
}

export async function login(page: Page) {
  await loginAs(page, E2E.email, E2E.password)
}

/** Inicia sesion con cualquiera de los usuarios sembrados; la contraseña es
 * la misma para todos en el tenant de pruebas. */
export async function loginAs(page: Page, email: string, password = E2E.cashierPassword) {
  await page.goto('/login')
  await page.getByLabel('Correo').fill(email)
  await page.getByRole('textbox', { name: 'Contraseña' }).fill(password)
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page).toHaveURL(/\/dashboard/)
}

export async function openSalesTab(page: Page, tab: string) {
  await page.getByRole('button', { name: tab, exact: true }).click()
}

/** Agrega el producto de prueba al carrito y elige el cliente de prueba.
 * La busqueda de cliente usa siempre el mismo texto: offline, TanStack
 * Query responde desde el cache de la busqueda anterior. */
export async function fillCart(page: Page) {
  await page.getByPlaceholder(/Escanea un código de barras/).fill(E2E.productSku)
  await page.getByRole('button', { name: new RegExp(E2E.productName) }).click()
  await page.getByLabel('Cliente').fill(E2E.customerDocument)
  await page.getByRole('button', { name: `${E2E.customerName} · ${E2E.customerDocument}` }).click()
}

/** Abre el cobro, agrega un pago en efectivo por el total y confirma. */
export async function payInCash(page: Page, total: string) {
  await page.getByRole('button', { name: `Cobrar S/ ${total}` }).click()
  const checkout = page.getByRole('dialog', { name: 'Cobrar' })
  await checkout.getByRole('button', { name: 'Agregar pago' }).click()
  await checkout.getByRole('button', { name: `Confirmar cobro de S/ ${total}` }).click()
}
