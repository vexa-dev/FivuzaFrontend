import { execSync } from 'node:child_process'

/** Recrea el tenant `e2e` antes de la corrida. Por defecto usa el
 * docker-compose del backend como carpeta hermana; en CI se reemplaza con
 * E2E_SEED_COMMAND. Con E2E_SKIP_SEED=1 se omite (tenant ya preparado). */
export default function globalSetup() {
  if (process.env.E2E_SKIP_SEED === '1') return
  const command =
    process.env.E2E_SEED_COMMAND ??
    'docker compose -f ../FivuzaBackend/docker-compose.yml exec -T web python manage.py seed_e2e'
  execSync(command, { stdio: 'inherit' })
}
