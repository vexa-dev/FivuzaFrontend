import { expect, test, type Page } from '@playwright/test'
import { E2E, fillCart, login, loginAs, openSalesTab, payInCash } from './fixtures'

// Bloque A (Plan de Mejoras Operativas): dos cajeros en el mismo turno, cada
// uno en su caja. Prueba que no se pisan -ni ven ni operan la caja del otro-
// y que el cierre va en dos pasos: el cajero entrega a ciegas y el
// supervisor revisa y cierra.
// Serial: cada paso depende del estado que deja el anterior.
test.describe.serial('Dos cajeros en el mismo turno', () => {
  async function openTill(page: Page, register: string, amount: string) {
    await page.goto('/ventas')
    await openSalesTab(page, 'Caja actual')
    await page.getByLabel('Caja', { exact: true }).selectOption({ label: register })
    await page.getByLabel('Monto inicial').fill(amount)
    await page.getByRole('button', { name: 'Abrir caja' }).click()
    await expect(page.getByRole('button', { name: new RegExp(register) })).toBeVisible()
  }

  test('cada cajero abre su propia caja', async ({ page }) => {
    await loginAs(page, E2E.cashierOne)
    await openTill(page, E2E.cashierOneRegister, '50')

    // La caja del otro cajero no esta ni en el selector de apertura.
    await expect(
      page.getByRole('option', { name: E2E.cashierTwoRegister }),
    ).toHaveCount(0)
  })

  test('el segundo cajero abre la suya sin ver la del primero', async ({ page }) => {
    await loginAs(page, E2E.cashierTwo)
    await openTill(page, E2E.cashierTwoRegister, '30')

    await expect(
      page.getByRole('button', { name: new RegExp(E2E.cashierOneRegister) }),
    ).toHaveCount(0)
  })

  test('vende contra su propia caja', async ({ page }) => {
    await loginAs(page, E2E.cashierOne)
    await page.goto('/ventas')
    await fillCart(page)
    await payInCash(page, '20.00')

    const done = page.getByRole('dialog', { name: 'Venta registrada' })
    await expect(done).toBeVisible()
    await done.getByRole('button', { name: 'Nueva venta' }).click()
  })

  test('entrega su caja sin ver el esperado', async ({ page }) => {
    await loginAs(page, E2E.cashierOne)
    await page.goto('/ventas')
    await openSalesTab(page, 'Caja actual')
    await page.getByRole('button', { name: new RegExp(E2E.cashierOneRegister) }).click()
    await page.getByRole('button', { name: 'Cerrar caja' }).click()

    const modal = page.getByRole('dialog', { name: 'Entregar caja' })
    await expect(modal).toBeVisible()
    // Arqueo a ciegas (A.3): ni el esperado ni las ventas en efectivo.
    await expect(modal.getByText('Esperado (estimado)')).toHaveCount(0)
    await expect(modal.getByText('Ventas en efectivo')).toHaveCount(0)

    await modal.getByLabel(/Monto contado/).fill('70')
    await modal.getByRole('button', { name: 'Entregar caja' }).click()

    const handed = page.getByRole('dialog', { name: 'Caja entregada' })
    await expect(handed).toBeVisible()
    await expect(handed.getByText(/revisará el arqueo/)).toBeVisible()
    await handed.getByRole('button', { name: 'Listo' }).click()

    await expect(page.getByText('Esperando aprobación')).toBeVisible()
  })

  test('el supervisor revisa el arqueo y cierra la caja entregada', async ({ page }) => {
    await login(page)
    await page.goto('/ventas')
    await openSalesTab(page, 'Caja actual')
    await page.getByRole('button', { name: new RegExp(E2E.cashierOneRegister) }).click()
    await page.getByRole('button', { name: 'Revisar caja' }).click()

    const review = page.getByRole('dialog', { name: 'Revisar caja entregada' })
    await expect(review).toBeVisible()
    // 50 de apertura + 20 de la venta en efectivo = 70 esperado.
    await expect(
      review.getByText('Esperado (estimado)').locator('xpath=following-sibling::dd[1]'),
    ).toHaveText('70.00')
    await expect(
      review.getByText('Contado por el cajero').locator('xpath=following-sibling::dd[1]'),
    ).toHaveText('S/ 70.00')

    await review.getByRole('button', { name: 'Confirmar cierre' }).click()

    const closed = page.getByRole('dialog', { name: 'Caja cerrada' })
    await expect(closed).toBeVisible()
    const valueOf = (label: string) =>
      closed.getByText(label, { exact: true }).locator('xpath=following-sibling::dd[1]')
    await expect(valueOf('Esperado')).toHaveText('70.0000')
    await expect(valueOf('Contado')).toHaveText('70.0000')
    await expect(valueOf('Diferencia')).toHaveText('0.0000')
  })

  test('la caja del segundo cajero sigue abierta y es solo suya', async ({ page }) => {
    await loginAs(page, E2E.cashierTwo)
    await page.goto('/ventas')
    await openSalesTab(page, 'Caja actual')

    await expect(
      page.getByRole('button', { name: new RegExp(E2E.cashierTwoRegister) }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: new RegExp(E2E.cashierOneRegister) }),
    ).toHaveCount(0)
  })
})
