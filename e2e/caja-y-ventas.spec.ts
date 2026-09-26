import { expect, test } from '@playwright/test'
import { E2E, fillCart, login, openSalesTab, payInCash } from './fixtures'

// Flujo completo de un turno de caja (TRD §7.1, E2E): abrir caja, vender
// en linea, vender sin conexion, sincronizar y cerrar con arqueo cuadrado.
// Serial: cada paso depende del estado que deja el anterior.
test.describe.serial('Turno de caja', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto('/ventas')
  })

  test('abre la caja con monto inicial', async ({ page }) => {
    await openSalesTab(page, 'Caja actual')
    await page.getByLabel('Caja', { exact: true }).selectOption({ label: E2E.cashRegister })
    await page.getByLabel('Monto inicial').fill('50')
    await page.getByRole('button', { name: 'Abrir caja' }).click()

    await expect(page.getByRole('button', { name: new RegExp(E2E.cashRegister) })).toBeVisible()
  })

  test('cobra una venta en efectivo', async ({ page }) => {
    await fillCart(page)
    await payInCash(page, '20.00')

    const done = page.getByRole('dialog', { name: 'Venta registrada' })
    await expect(done).toBeVisible()
    await done.getByRole('button', { name: 'Nueva venta' }).click()
    await expect(done).toBeHidden()
  })

  test('guarda una venta sin conexion y la sincroniza al volver', async ({ page, context }) => {
    // Primero una busqueda en linea para que catalogo y cliente queden en
    // cache, como pasa en un turno real antes de que se corte la red.
    await fillCart(page)
    await page.getByRole('button', { name: `Quitar ${E2E.productName}` }).click()

    await context.setOffline(true)
    await fillCart(page)
    await payInCash(page, '20.00')

    const queued = page.getByRole('dialog', { name: 'Venta guardada sin conexión' })
    await expect(queued).toBeVisible()
    await queued.getByRole('button').last().click()
    await expect(page.getByText('1 venta pendiente')).toBeVisible()

    await context.setOffline(false)
    await expect(page.getByText('1 venta pendiente')).toBeHidden({ timeout: 20_000 })

    // La venta sincronizada aparece en el historial junto a la de en linea.
    await openSalesTab(page, 'Ventas')
    await expect(page.getByRole('cell', { name: /^V-\d+$/ })).toHaveCount(2)
  })

  test('cierra la caja con el arqueo cuadrado', async ({ page }) => {
    await openSalesTab(page, 'Caja actual')
    await page.getByRole('button', { name: new RegExp(E2E.cashRegister) }).click()
    await page.getByRole('button', { name: 'Cerrar caja' }).click()

    const close = page.getByRole('dialog', { name: /Cerrar caja/ })
    // 50 de apertura + 2 ventas en efectivo de 20 = 90 esperado.
    await expect(close.getByText('Ventas en efectivo').locator('xpath=following-sibling::dd[1]')).toHaveText(
      '40.00',
    )
    await expect(close.getByText('Esperado (estimado)').locator('xpath=following-sibling::dd[1]')).toHaveText(
      '90.00',
    )

    await close.getByLabel(/Monto contado/).fill('90')
    await close.getByRole('button', { name: 'Cerrar caja' }).click()

    const closed = page.getByRole('dialog', { name: 'Caja cerrada' })
    await expect(closed).toBeVisible()
    const valueOf = (label: string) => closed.getByText(label, { exact: true }).locator('xpath=following-sibling::dd[1]')
    await expect(valueOf('Esperado')).toHaveText('90.00')
    await expect(valueOf('Contado')).toHaveText('90.00')
    await expect(valueOf('Diferencia')).toHaveText('0.00')
  })
})
