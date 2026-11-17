/*
 * Hi there, QR! service worker.
 * - Pages: network first, falling back to the cached app shell when offline.
 * - Hashed build assets (/assets/*): cache first; their names change on every release.
 * - Other static files: stale-while-revalidate.
 * - The API and anything cross-origin are never cached.
 */
const CACHE = 'hi-there-qr-v1';
const SHELL = [
  '/',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/theme-init.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function putIfOk(request, response) {
  if (response.ok && response.type === 'basic') {
    const cache = await caches.open(CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => putIfOk('/', response))
        .catch(() => caches.match('/').then((cached) => cached || Response.error())),
    );
    return;
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches
        .match(request)
        .then((cached) => cached || fetch(request).then((response) => putIfOk(request, response))),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => putIfOk(request, response))
        .catch(() => cached);
      return cached || network;
    }),
  );
});
