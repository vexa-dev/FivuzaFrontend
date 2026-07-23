# Fivuza — Frontend

[![Frontend CI](https://github.com/vexa-dev/FivuzaFrontend/actions/workflows/ci.yml/badge.svg)](https://github.com/vexa-dev/FivuzaFrontend/actions/workflows/ci.yml)

Frontend del **ERP SaaS multi-tenant** de Fivuza, orientado a pequeños y medianos negocios (bodegas, gimnasios, tiendas de retail). Construido con React + TypeScript + Vite.

> Proyecto privado. Repositorio complementario: [FivuzaBackend](https://github.com/vexa-dev/FivuzaBackend) (Django + DRF).

---

## Tabla de contenidos

- [Stack técnico](#stack-técnico)
- [Arquitectura](#arquitectura)
- [Sistema de diseño](#sistema-de-diseño)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Primeros pasos](#primeros-pasos)
- [Variables de entorno](#variables-de-entorno)
- [Scripts disponibles](#scripts-disponibles)
- [Convenciones de contribución](#convenciones-de-contribución)
- [Estado del proyecto](#estado-del-proyecto)

---

## Stack técnico

| Categoría | Tecnología |
|---|---|
| Framework | React 19 + TypeScript, [Vite](https://vite.dev/) |
| Ruteo | React Router 7 |
| Estado de servidor | [TanStack Query](https://tanstack.com/query) (caché/invalidación de datos de la API) |
| Estado de UI | Context API + hooks nativos |
| Observabilidad | Sentry (`@sentry/react`) |
| Linting | [oxlint](https://oxc.rs/) |
| CI | GitHub Actions (lint → test → build) |
| Contenedores | Docker (build multi-stage: Node → Nginx) |

> **Nota:** el proyecto no usa un panel de administración por separado — el panel interno de Fivuza (`platform_staff`) y el ERP de cada tenant conviven en el **mismo proyecto React**, diferenciados por ruta (`/admin/*` para el panel interno). Ver [Arquitectura](#arquitectura).

## Arquitectura

Este frontend sirve a dos audiencias completamente separadas por autenticación, pero dentro del **mismo código base**:

- **`/admin/*`** — panel interno de Fivuza, usado por `platform_staff` (el equipo de Fivuza) para gestionar tenants, planes y suscripciones. Se autentica contra `POST /api/v1/platform/auth/login/`.
- **El resto de rutas** (pendiente de construir) — el ERP real que usa cada negocio cliente (inventario, ventas, caja), resuelto por subdominio de tenant. Se autentica contra `POST /api/v1/auth/login/`.

Ambos flujos usan JWT, pero nunca comparten token ni lógica de autenticación entre sí.

### Organización por feature, no por tipo de archivo

```
src/features/<modulo>/
  api.ts               llamadas a la API del modulo
  <Modulo>Page.tsx      la vista (solo JSX/layout)
  components/            componentes propios del modulo
  hooks/                    logica de negocio del modulo (useX.ts)
```

Cuando un módulo agrupa varias pantallas (ej. Inventario: catálogo, categorías, proveedores, sucursales, Kardex), cada pantalla vive en su propia subcarpeta dentro del feature, con su propio `components/`/`hooks/`, en vez de amontonar todo en una sola carpeta plana.

## Sistema de diseño

- **Colores:** paleta de variables CSS (`src/theme/theme.css`) con soporte claro/oscuro vía `[data-theme]`, tokens semánticos (`bg-app`, `bg-surface`, `primary`, `success`/`warning`/`danger`, etc.) — nunca un hex hardcodeado en un componente.
- **Tipografía:** familia única [Satoshi](https://www.fontshare.com/fonts/satoshi) (variable, `src/theme/fonts.css`), archivos en `public/fonts/`.
- **Tema claro/oscuro:** `ThemeProvider` (`src/theme/ThemeContext.tsx`) con persistencia en `localStorage` y detección de `prefers-color-scheme`.
- **Componentes base:** botones, badges, cards, inputs reutilizables en `src/shared/styles/components.css` y `src/shared/components/`.
- **Mobile-first:** todo componente se diseña primero para pantalla chica y se expande hacia tablet/escritorio.

## Estructura del proyecto

```
FivuzaFrontend/
  public/
    fonts/                    Satoshi (.woff2), servidos con ruta absoluta
  src/
    features/
      core/                   panel interno de platform_staff (/admin/*)
      inventory/              ERP del tenant (pendiente)
      sales/                  ERP del tenant (pendiente)
      users/                  ERP del tenant (pendiente)
      dashboard/              ERP del tenant (pendiente)
    shared/
      components/             componentes genericos (Logo, ThemeToggle...)
      styles/                  CSS compartido (botones, badges, cards)
      utils/                    apiClient.ts, helpers
    theme/                    paleta, tipografia, ThemeProvider
    App.tsx                   definicion de rutas
    main.tsx                  entrypoint, providers globales
  Dockerfile                  build multi-stage (Node -> Nginx)
```

## Primeros pasos

### Requisitos

- Node.js 20+
- El [backend](https://github.com/vexa-dev/FivuzaBackend) corriendo localmente (necesario para que el login funcione)

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/vexa-dev/FivuzaFrontend.git
cd FivuzaFrontend
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Por defecto `VITE_API_URL` apunta a `http://localhost:8000/api/v1`. Como el backend usa multi-tenancy por subdominio, para probar el panel interno (`/admin/*`) normalmente necesitas apuntar a `http://public.localhost:8000/api/v1` (ver el README del backend).

### 3. Levantar el servidor de desarrollo

```bash
npm run dev
```

Abre `http://localhost:5173/admin/login`.

> Si corres el backend con Docker Compose, revisa que `CORS_ALLOWED_ORIGINS` en el `.env` del backend incluya `http://localhost:5173` — si no, el navegador bloquea las peticiones a la API.

## Variables de entorno

| Variable | Descripción | Default local |
|---|---|---|
| `VITE_API_URL` | URL base de la API del backend | `http://localhost:8000/api/v1` |
| `VITE_SENTRY_DSN` | DSN del proyecto en Sentry (vacío = Sentry desactivado) | — |
| `VITE_SENTRY_ENVIRONMENT` | Nombre de entorno reportado a Sentry | `development` |

## Scripts disponibles

```bash
npm run dev        # servidor de desarrollo con HMR (Vite)
npm run build       # type-check (tsc -b) + build de produccion
npm run preview      # sirve el build de produccion localmente
npm run lint           # oxlint
```

El pipeline de CI (`.github/workflows/ci.yml`) corre `lint → test → build` en cada Pull Request y en cada push a `main` (el job de `test` está deshabilitado hasta que se agreguen pruebas de componentes con Jest + React Testing Library).

## Convenciones de contribución

- **Ramas:** `feature/`, `fix/`, `chore/`, `hotfix/`, `docs/` + módulo afectado (ej. `feature/core-platform-admin-login`).
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/), tipo en inglés, descripción en español imperativo.
- **Pull Requests:** `main` protegida, mínimo 1 revisor distinto al autor, CI en verde obligatorio antes de mergear.
- **Estado de servidor vs. estado de UI:** cualquier dato que venga de la API se maneja con TanStack Query, nunca con `useState`/Context manual — Context API queda reservado para estado puramente de interfaz (modales abiertos, tema activo, etc.).
- **Mobile-first:** todo componente nuevo se construye primero para pantalla chica.

Estas y otras reglas están detalladas en la Guía de Convenciones de Código del proyecto (documento compartido del equipo, fuera de este repositorio).

## Estado del proyecto

Desarrollo guiado por sprints semanales, en paralelo con el backend. Estado actual:

- ✅ **Sprint 0** — scaffold del proyecto, Sentry SDK integrado.
- ✅ **Sprint 1** — sin tareas de frontend (el sprint del backend solo cubría la app `core`, sin pantallas de usuario final).
- 🔄 **Panel interno (`/admin/*`)** — login de `platform_staff`, listado de tenants, logout, tema claro/oscuro, sistema de diseño aplicado.
- ⏳ **Sprint 2 (en curso)** — pantalla de login del ERP de `tenant.users`, configuración de TanStack Query y Dexie.js para persistencia offline, primeras pruebas con Jest + React Testing Library.

Meta: MVP del módulo de Inventario funcional de punta a punta para el piloto.
