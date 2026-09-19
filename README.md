# Fivuza — Frontend

[![Frontend CI](https://github.com/vexa-dev/FivuzaFrontend/actions/workflows/ci.yml/badge.svg)](https://github.com/vexa-dev/FivuzaFrontend/actions/workflows/ci.yml)

Frontend del **ERP SaaS multi-tenant** de Fivuza, orientado a pequeños y medianos negocios (bodegas, gimnasios, tiendas de retail). Construido con React + TypeScript + Vite.

> Proyecto privado. Repositorios complementarios: [FivuzaBackend](https://github.com/vexa-dev/FivuzaBackend) (Django + DRF) y [Fivuza-Docs](https://github.com/vexa-dev/Fivuza-Docs) (documentación; el contrato vigente está en `FIVUZA_Estado_Implementado_2026-09.md`).

---

## Tabla de contenidos

- [Stack técnico](#stack-técnico)
- [Arquitectura](#arquitectura)
- [Sistema de diseño](#sistema-de-diseño)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Primeros pasos](#primeros-pasos)
- [Variables de entorno](#variables-de-entorno)
- [Scripts disponibles](#scripts-disponibles)
- [Despliegue](#despliegue)
- [Convenciones de contribución](#convenciones-de-contribución)
- [Estado del proyecto](#estado-del-proyecto)

---

## Stack técnico

| Categoría | Tecnología |
|---|---|
| Framework | React 19 + TypeScript, [Vite](https://vite.dev/) |
| Ruteo | React Router 7 (code splitting por ruta) |
| Estado de servidor | [TanStack Query](https://tanstack.com/query) |
| Estado de UI | Context API + hooks nativos |
| Offline | Dexie.js (IndexedDB: cola de ventas y catálogo del POS) + service worker propio (PWA instalable) |
| Gráficos | Recharts (aislado en el chunk del dashboard) |
| Observabilidad | Sentry (`@sentry/react`), `RouteErrorBoundary` |
| Tests | Jest + React Testing Library |
| Linting | [oxlint](https://oxc.rs/) + chequeo de tokens CSS |
| Producción | nginx (SPA + proxy de `/api` y `/ws` al backend), desplegado en Railway |

## Arquitectura

Un mismo código sirve a dos audiencias separadas por autenticación:

- **`/admin/*`** — panel interno de Fivuza (`platform_staff`): tenants, planes, suscripciones, pagos, equipo, actividad, impersonación. Se abre desde un dominio del esquema `public` (`admin.fivuza.com`; en desarrollo `public.localhost:5173`).
- **El resto de rutas** — el ERP de cada negocio (dashboard, inventario, ventas/POS, caja, usuarios, RR. HH., gimnasio y configuración), en el subdominio del negocio (`<negocio>.fivuza.com`).

Ambos flujos usan JWT sin compartir token ni lógica. El refresh vive en una cookie HttpOnly y el access solo en memoria; la sesión se restaura antes de resolver rutas protegidas.

**La API es del mismo origen**: el frontend llama a `/api/v1/...` y abre el WebSocket en `/ws/...` sobre su propio host. En producción nginx reenvía esas rutas al backend y en desarrollo lo hace el proxy de Vite; en ambos casos se conserva el header `Host`, que es con lo que el backend resuelve el tenant.

### Organización por feature

```
src/features/<modulo>/
  api.ts                llamadas a la API del módulo
  <Modulo>Page.tsx      la vista (solo JSX/layout)
  components/           componentes propios del módulo
  hooks/                lógica del módulo (useX.ts)
```

## Sistema de diseño

- **Colores:** variables CSS en `src/theme/theme.css` (claro/oscuro vía `[data-theme]`), con tokens semánticos (`bg-app`, `bg-surface`, `primary`, `success`/`warning`/`danger`...). **Nunca un hex hardcodeado en un componente**: `npm run lint:tokens` falla si se usa un `var(--x)` que no existe.
- **Tipografía:** familia única [Satoshi](https://www.fontshare.com/fonts/satoshi) (`src/theme/fonts.css`, archivos en `public/fonts/`).
- **Tema claro/oscuro:** `ThemeProvider` con persistencia en `localStorage` y detección de `prefers-color-scheme`; color de marca por negocio con `BrandThemeProvider`.
- **Componentes base:** `src/shared/styles/components.css` y `src/shared/components/` (`Modal`, `ConfirmDialog`, `EmptyState`, `RouteErrorBoundary`, `ToastProvider`...).
- Referencia completa: `FIVUZA_Especificacion_UI_v1.md` y `FIVUZA_Mapa_Visual_Prototipo.md` en Fivuza-Docs.

## Estructura del proyecto

```
FivuzaFrontend/
  nginx/                    plantilla de nginx (SPA + proxy /api y /ws) y headers de seguridad
  public/                   fuentes, manifest y service worker (sw.js)
  scripts/                  check-css-tokens.mjs
  src/
    features/
      auth/                 login, recuperación de contraseña, impersonación (ERP)
      core/                 panel interno de platform_staff (/admin/*)
      dashboard/            métricas en tiempo real y personalización
      inventory/            catálogo, stock, Kardex, traslados, compras, etiquetas
      sales/                POS, ventas, caja, clientes, cobranzas, promociones, apartados, cotizaciones
      users/                usuarios, roles, almacenes y respaldo de datos
      hr/                   trabajadores, horarios, asistencia, planilla
      gimnasio/             socios, clases, grupos, check-in, reportes, planes
      settings/             configuración del negocio (color de marca)
    shared/
      components/           componentes genéricos
      offline/              Dexie y sincronización de ventas offline
      styles/               CSS compartido
      utils/                clientes HTTP (apiClient, tenantApiClient), formato, paginación
    theme/                  paleta, tipografía, ThemeProvider, BrandThemeProvider
    App.tsx                 rutas
    main.tsx                entrypoint, providers globales, Sentry, service worker
  Dockerfile                build multi-stage (Node → nginx)
  railway.json              configuración de Railway
```

## Primeros pasos

### Requisitos

- Node.js 22
- El [backend](https://github.com/vexa-dev/FivuzaBackend) corriendo (Docker Compose lo levanta junto con este frontend si ambos repos están como carpetas hermanas)

### 1. Instalar dependencias

```bash
git clone https://github.com/vexa-dev/FivuzaFrontend.git
cd FivuzaFrontend
npm install
```

### 2. Variables de entorno

```bash
cp .env.example .env
```

Por defecto no hace falta cambiar nada: el proxy de Vite reenvía `/api` y `/ws` a `VITE_DEV_API_TARGET` (`http://localhost:8000`).

### 3. Servidor de desarrollo

```bash
npm run dev
```

- ERP de un negocio: `http://tenant1.localhost:5173`
- Panel interno: `http://public.localhost:5173/admin/login`

Usa siempre un subdominio (`tenant1.localhost`, `public.localhost`), no `localhost` a secas: el backend resuelve el tenant por el host.

## Variables de entorno

| Variable | Descripción | Default |
|---|---|---|
| `VITE_DEV_API_TARGET` | Backend al que el proxy de desarrollo reenvía `/api` y `/ws` (en Docker Compose: `http://web:8000`) | `http://localhost:8000` |
| `VITE_API_URL` | Opcional: base fija de la API del panel interno, para saltarse el proxy | `/api/v1` |
| `VITE_API_PORT` | Opcional: puerto del backend para el ERP, para saltarse el proxy | — |
| `VITE_SENTRY_DSN` | DSN de Sentry (vacío = desactivado) | — |
| `VITE_SENTRY_ENVIRONMENT` | Entorno reportado a Sentry | `development` |

En la imagen de producción, nginx lee además `PORT` y `BACKEND_URL` (URL interna del backend) al arrancar.

## Scripts disponibles

```bash
npm run dev           # servidor de desarrollo con HMR y proxy de /api y /ws
npm run build         # type-check (tsc -b) + build de producción
npm run preview       # sirve el build localmente
npm run lint          # oxlint
npm run lint:tokens   # falla si se usa un token CSS no definido
npm test              # Jest + React Testing Library
ANALYZE=1 npm run build   # además genera dist/bundle-stats.html
```

El CI (`.github/workflows/ci.yml`) corre lint, chequeo de tokens, Jest, `tsc` + build y el build de Docker en cada PR y push a `main`.

## Despliegue

Railway construye el `Dockerfile` (Node → nginx) según `railway.json`. Este es el único servicio con dominio público (`*.fivuza.com` y `admin.fivuza.com`); nginx sirve la SPA (con fallback a `index.html`), cachea `/assets` como inmutables y reenvía `/api` y `/ws` a `BACKEND_URL` por la red privada. El service worker nunca cachea `/api` ni `/ws`. Guía completa en `railway/README.md` del backend.

## Convenciones de contribución

- **Ramas:** `feature/`, `fix/`, `chore/`, `hotfix/`, `docs/` + módulo afectado.
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/), tipo en inglés, descripción en español imperativo.
- **Pull Requests:** `main` protegida, mínimo 1 revisor distinto al autor, CI en verde obligatorio antes de mergear.
- **Estado de servidor vs. estado de UI:** datos de la API siempre con TanStack Query; Context solo para estado de interfaz.
- **Mobile-first:** todo componente nuevo se construye primero para pantalla chica.

Detalle en `FIVUZA_Convenciones_Codigo_v1.md` (repo Fivuza-Docs).

## Estado del proyecto

Todas las pantallas de los Sprints 0–35 están construidas (panel interno completo, inventario, POS con modo offline, caja, crédito, RR. HH., dashboard en tiempo real, gimnasio, respaldo de datos). El trabajo en curso es la salida a producción en Railway y el piloto (`FIVUZA_Plan_Implementacion_v2.md` §2.1). Pendiente destacado: tests de componentes del POS, cobro y arqueo, y E2E con Playwright.
