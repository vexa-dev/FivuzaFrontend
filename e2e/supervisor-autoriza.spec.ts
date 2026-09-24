import { expect, test, type Page } from '@playwright/test'
import { E2E, fillCart, login, loginAs, openSalesTab, payInCash } from './fixtures'

// Bloque C (Plan de Mejoras Operativas): el cajero pide y un supervisor
// autoriza desde el mismo equipo, sin cerrar la sesion del cajero. El
// cajero sembrado (rol seller) tiene tope de descuento 0% y no puede anular;
// el admin sembrado hace de supervisor.
// Serial: la anulacion trabaja sobre la venta con descuento del paso anterior.
test.describe.serial('Autorización de supervisor', () => {
  /** El E2E de dos cajeros deja abierta la caja del segundo; si este archivo
   * corre solo, la abre aqui. */
  async function ensureTillOpen(page: Page) {
    await page.goto('/ventas')
    await openSalesTab(page, 'Caja actual')
    const till = page.getByRole('button', { name: new RegExp(E2E.cashierTwoRegister) })
    const openForm = page.getByLabel('Monto inicial')
    await expect(till.or(openForm)).toBeVisible()
    if (await openForm.isVisible()) {
      await page.getByLabel('Caja', { exact: true }).selectOption({ label: E2E.cashierTwoRegister })
      await openForm.fill('30')
      await page.getByRole('button', { name: 'Abrir caja' }).click()
      await expect(till).toBeVisible()
    }
  }

  async function authorizeAsAdmin(page: Page) {
    const modal = page.getByRole('dialog', { name: 'Autorización de supervisor' })
    await expect(modal).toBeVisible()
    await modal.getByLabel('Correo del supervisor').fill(E2E.email)
    await modal.getByRole('textbox', { name: 'Contraseña del supervisor' }).fill(E2E.password)
    await modal.getByRole('button', { name: 'Autorizar' }).click()
    await expect(modal).toBeHidden()
  }

  test('un descuento sobre el tope del cajero se cobra con autorización', async ({ page }) => {
    await loginAs(page, E2E.cashierTwo)
    await ensureTillOpen(page)
    await openSalesTab(page, 'Vender')

    await fillCart(page)
    await page.getByRole('button', { name: `Dar descuento a ${E2E.productName}` }).click()
    await page.getByLabel(`Descuento de ${E2E.productName} en %`).fill('10')
    await expect(page.getByText('Requiere autorización')).toBeVisible()

    await payInCash(page, '18.00')
    await authorizeAsAdmin(page)

    const done = page.getByRole('dialog', { name: 'Venta registrada' })
    await expect(done).toBeVisible()
    await done.getByRole('button', { name: 'Nueva venta' }).click()
  })

  test('el cajero anula su venta con la clave del supervisor', async ({ page }) => {
    await loginAs(page, E2E.cashierTwo)
    await page.goto('/ventas')
    await openSalesTab(page, 'Ventas')

    const row = page.getByRole('row').filter({ hasText: '18.00' })
    await row.getByRole('button', { name: /Ver detalle de/ }).click()
    await page.getByRole('button', { name: 'Anular venta' }).click()

    const voidModal = page.getByRole('dialog', { name: /^Anular V-/ })
    await expect(voidModal.getByText(/un supervisor tendrá que autorizarla/)).toBeVisible()
    await voidModal.getByLabel('Motivo (obligatorio)').fill('Cobro de prueba')
    await voidModal.getByRole('button', { name: 'Confirmar anulación' }).click()
    await authorizeAsAdmin(page)
    await expect(voidModal).toBeHidden()

    const detail = page.getByRole('dialog', { name: /^V-/ })
    await detail.getByRole('button', { name: 'Cerrar' }).click()
    await expect(row.getByText('ANULADA')).toBeVisible()
  })

  test('la bitácora muestra quién pidió y quién autorizó', async ({ page }) => {
    await login(page)
    await page.goto('/actividad')
    await page.getByLabel('Acción').selectOption({ label: 'Anuló una venta' })

    const row = page
      .getByRole('row')
      .filter({ hasText: E2E.cashierTwo })
      .filter({ hasText: 'Anuló una venta' })
    await expect(row).toHaveCount(1)
    await row.getByRole('button', { name: 'Ver detalle' }).click()
    await expect(page.getByText('Autorizado por')).toBeVisible()
    await expect(page.getByRole('definition').filter({ hasText: E2E.email })).toBeVisible()
  })
})
