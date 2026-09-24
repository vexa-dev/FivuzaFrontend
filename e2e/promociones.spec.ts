import { expect, test, type Page } from '@playwright/test'
import { E2E, loginAs, openSalesTab, payInCash } from './fixtures'

// El POS cobra el total con la promoción vigente ya descontada: si el
// carrito la ignora, el pago no cuadra con el total que calcula el backend
// y la venta se rechaza (PAYMENT_MISMATCH). Lo cobra el cajero sembrado
// (tope de descuento 0%): una promoción no es descuento manual y no pide
// autorización de supervisor.
test.describe('Promociones en el POS', () => {
  /** El E2E de dos cajeros deja abierta la caja del segundo; si este archivo
   * corre solo, la abre aquí. */
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

  test('cobra un producto con promoción vigente', async ({ page }) => {
    await loginAs(page, E2E.cashierTwo)
    await ensureTillOpen(page)
    await openSalesTab(page, 'Vender')

    await page.getByPlaceholder(/Escanea un código de barras/).fill(E2E.promoProductSku)
    await page.getByRole('button', { name: new RegExp(E2E.promoProductName) }).click()
    await page.getByLabel('Cliente').fill(E2E.customerDocument)
    await page.getByRole('button', { name: `${E2E.customerName} · ${E2E.customerDocument}` }).click()

    // S/ 25.00 con -20%: la línea muestra la promoción y el total ya la descuenta.
    await expect(page.getByText('Promoción -20%')).toBeVisible()
    await expect(page.getByText('Requiere autorización')).toHaveCount(0)

    await payInCash(page, '20.00')

    const done = page.getByRole('dialog', { name: 'Venta registrada' })
    await expect(done).toBeVisible()
    await done.getByRole('button', { name: 'Nueva venta' }).click()
  })
})
