# Pruebas E2E (Playwright)

Recorren la app real (frontend + backend + PostgreSQL + Redis) como lo haría un cajero. Hoy cubren un turno de caja completo (`caja-y-ventas.spec.ts`):

1. Abrir la caja con monto inicial.
2. Cobrar una venta en efectivo.
3. Cobrar sin conexión, ver la venta en cola y sincronizarla al volver.
4. Cerrar la caja: el arqueo muestra las ventas en efectivo y cuadra en 0.

## Correr en local

Con el backend como carpeta hermana (`../FivuzaBackend`) y su Docker Compose levantado:

```bash
cd ../FivuzaBackend
docker compose up -d
docker compose exec web python manage.py migrate_schemas --shared
cd ../FivuzaFrontend
npx playwright install chromium   # solo la primera vez
npm run e2e
```

Antes de cada corrida, `global-setup.ts` recrea el tenant `e2e` (`e2e.localhost`) con `manage.py seed_e2e`: un admin, la caja por defecto, un producto con stock y un cliente. Los datos fijos están en `e2e/fixtures.ts`.

| Variable | Uso |
|---|---|
| `E2E_BASE_URL` | URL del ERP de prueba (por defecto `http://e2e.localhost:5173`) |
| `E2E_SEED_COMMAND` | Comando para sembrar si el backend no corre con el Compose de la carpeta hermana |
| `E2E_SKIP_SEED=1` | No resembrar (tenant ya preparado) |

Si una prueba falla, `test-results/` guarda captura y *trace*: `npx playwright show-trace <ruta>/trace.zip`.

## En CI

El job `e2e` de `.github/workflows/ci.yml` clona el backend (repositorio privado), levanta su Compose, siembra y corre Playwright. Necesita el secreto `BACKEND_REPO_TOKEN`: un token de GitHub con permiso de lectura sobre `vexa-dev/FivuzaBackend`. Sin ese secreto, el job se omite con un aviso.

## Reglas para agregar pruebas

- Selectores por rol y nombre visible (`getByRole`, `getByLabel`), nunca por clases CSS.
- Todo dato que la prueba necesite se siembra en `seed_e2e`, no se crea por la UI salvo que sea lo que se está probando.
- Las pruebas de un archivo comparten el tenant y corren en serie; si una necesita estado limpio, va en su propio archivo y se resiembra.
