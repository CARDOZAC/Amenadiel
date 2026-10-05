/**
 * Service Worker - Offline-First Strategy
 * Simple, sin librerías externas. Al estilo Linus: código que funciona.
 */

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `dle-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dle-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `dle-images-${CACHE_VERSION}`;

// Assets críticos para cachear inmediatamente
const STATIC_ASSETS = [
  '/',
  '/login',
  '/collector',
  '/owner',
  '/accounting',
  '/offline.html',
  '/manifest.json',
];

// Install: cachear assets estáticos
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');

  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        // No fallar si algún asset no existe aún
        console.warn('[SW] Some assets failed to cache:', err);
      });
    }).then(() => {
      // Activar inmediatamente sin esperar
      return self.skipWaiting();
    })
  );
});

// Activate: limpiar caches viejos
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return name.startsWith('dle-') &&
                   name !== STATIC_CACHE &&
                   name !== DYNAMIC_CACHE &&
                   name !== IMAGE_CACHE;
          })
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      // Tomar control inmediato
      return self.clients.claim();
    })
  );
});

// Fetch: estrategia híbrida
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests que no sean GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignorar requests a APIs externas (Supabase, etc)
  if (!url.origin.includes(self.location.origin)) {
    return;
  }

  // Estrategia para imágenes: Cache-First
  if (request.destination === 'image') {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
    return;
  }

  // Estrategia para páginas/scripts: Network-First con fallback
  if (request.destination === 'document' ||
      request.destination === 'script' ||
      request.destination === 'style') {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Default: Network-First
  event.respondWith(networkFirstStrategy(request));
});

// Network-First: intenta red, fallback a cache
async function networkFirstStrategy(request) {
  try {
    const response = await fetch(request);

    // Solo cachear respuestas exitosas
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // Sin conexión: buscar en cache
    const cached = await caches.match(request);

    if (cached) {
      return cached;
    }

    // Si es una página y no hay cache, mostrar offline page
    if (request.destination === 'document') {
      return caches.match('/offline.html') ||
             new Response('Offline', { status: 503 });
    }

    return new Response('Offline', { status: 503 });
  }
}

// Cache-First: usa cache, fallback a red
async function cacheFirstStrategy(request, cacheName) {
  const cached = await caches.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);

    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    return new Response('Image not available', { status: 503 });
  }
}

// Background Sync: sincronizar cobros pendientes
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-collections') {
    console.log('[SW] Background sync triggered');
    event.waitUntil(syncPendingCollections());
  }
});

async function syncPendingCollections() {
  // Esta función será llamada por el hook useSyncQueue
  // El SW solo registra el evento, la lógica está en el cliente
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({
      type: 'SYNC_REQUESTED',
      timestamp: Date.now(),
    });
  });
}

// Notificación de updates disponibles
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] Loaded successfully');
