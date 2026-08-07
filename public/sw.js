// Service worker minimo (Sprint 20): sin Workbox ni build-time precaching
// de los assets hasheados de Vite -"network falling back to cache" alcanza
// para el objetivo de este sprint (que el POS abra como app instalada y
// no se quede en blanco si la red se corta a mitad de una recarga), sin
// agregar una dependencia de build nueva al proyecto.
const CACHE_NAME = 'fivuza-shell-v1'

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(['/', '/manifest.json', '/favicon.svg'])),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  // Solo GET propio origen -las llamadas a la API (otro origen/puerto, ver
  // tenantApiClient.ts) nunca pasan por este cache: la cola offline de
  // ventas (IndexedDB) ya resuelve ese caso con su propia logica.
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
    return
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
        return response
      })
      .catch(() => caches.match(request).then((cached) => cached ?? caches.match('/'))),
  )
})
