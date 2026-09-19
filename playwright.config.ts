import { defineConfig, devices } from '@playwright/test'

/**
 * Pruebas E2E contra el stack real (backend + frontend levantados con el
 * docker-compose del backend). Antes de correr, global-setup recrea el
 * tenant `e2e` con `manage.py seed_e2e`, así cada corrida parte del mismo
 * estado. Ver e2e/README.md.
 */
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  // Un solo worker: todas las pruebas comparten el tenant e2e (caja, stock).
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://e2e.localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'es-PE',
    timezoneId: 'America/Lima',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
