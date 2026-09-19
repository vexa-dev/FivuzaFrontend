// Service worker minimo (Sprint 20): sin Workbox ni build-time precaching
// de los assets hasheados de Vite -"network falling back to cache" alcanza
// para el objetivo de este sprint (que el POS abra como app instalada y
// no se quede en blanco si la red se corta a mitad de una recarga), sin
// agregar una dependencia de build nueva al proyecto.
const CACHE_NAME = 'fivuza-shell-v2'
// Tope de entradas: cada deploy trae assets con hash nuevo y el cache no
// debe crecer sin limite en la tablet del POS.
const MAX_ENTRIES = 150

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
  // Solo GET del propio origen, y NUNCA la API: desde que /api y /ws son del
  // mismo origen (proxy de nginx), sin esta exclusion se cachearian
  // respuestas autenticadas con datos del negocio. La cola offline de ventas
  // (IndexedDB) resuelve el caso sin conexion con su propia logica.
  const url = new URL(request.url)
  if (
    request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/ws/')
  ) {
    return
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone()
        if (response.ok) {
          caches.open(CACHE_NAME).then((cache) =>
            cache.put(request, copy).then(() => trimCache(cache)),
          )
        }
        return response
      })
      .catch(() => caches.match(request).then((cached) => cached ?? caches.match('/'))),
  )
})

function trimCache(cache) {
  return cache.keys().then((keys) =>
    keys.length > MAX_ENTRIES
      ? Promise.all(keys.slice(0, keys.length - MAX_ENTRIES).map((key) => cache.delete(key)))
      : undefined,
  )
}
