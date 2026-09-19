import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Backend al que el servidor de desarrollo reenvia /api y /ws. En Docker
// Compose es http://web:8000; corriendo todo local, http://localhost:8000.
const DEV_API_TARGET = process.env.VITE_DEV_API_TARGET ?? 'http://localhost:8000'

// https://vite.dev/config/
export default defineConfig({
  server: {
    // Mismo esquema que produccion (nginx): la API es del mismo origen.
    // changeOrigin:false conserva el Host (tenant1.localhost:5173), que es
    // con lo que django-tenants resuelve el esquema del negocio.
    proxy: {
      '/api': { target: DEV_API_TARGET, changeOrigin: false },
      '/ws': { target: DEV_API_TARGET, changeOrigin: false, ws: true },
    },
  },
  plugins: [
    react(),
    // Reporte del bundle solo a pedido (ANALYZE=1 npm run build): si se
    // generara siempre, dist/bundle-stats.html quedaria publicado por nginx.
    process.env.ANALYZE
      ? visualizer({
          filename: 'dist/bundle-stats.html',
          gzipSize: true,
          brotliSize: true,
        })
      : null,
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-router-dom')) {
            return 'vendor'
          }
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'query'
          }
        },
      },
    },
  },
})
