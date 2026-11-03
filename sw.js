/* Deudalaya's root-scoped worker caches only its static app shell. */
const CACHE_NAME = 'deudalaya-shell-v1';
const SHELL_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/install-gate.css',
  '/assets/deudalaya-launch-192.png',
  '/assets/deudalaya-launch-512.png',
  '/assets/deudalaya-maskable-512.png'
];
const SHELL_PATHS = new Set(SHELL_ASSETS);

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(SHELL_ASSETS.map(async path => {
      try {
        const response = await fetch(path, { cache: 'reload' });
        if (response.ok && response.type === 'basic') {
          await cache.put(new URL(path, self.location.origin).href, response);
        }
      } catch (_) {
        // Keep the worker installable if a shell asset is temporarily offline.
      }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  // Claim the current page after activation so it is controlled on first visit.
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !SHELL_PATHS.has(url.pathname)) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cacheKey = new URL(url.pathname, self.location.origin).href;
    try {
      const response = await fetch(request);
      if (response.ok && response.type === 'basic') {
        try {
          await cache.put(cacheKey, response.clone());
        } catch (_) {
          // A cache quota or response-cache error must not block the live response.
        }
      }
      return response;
    } catch (error) {
      const cached = await cache.match(cacheKey);
      if (cached) return cached;
      throw error;
    }
  })());
});
