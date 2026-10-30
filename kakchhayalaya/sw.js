// कक्षालय manages only its shell and cache under /kakchhayalaya/.
const CACHE_NAME = 'kakchhayalaya-shell-v1';
const APP_SHELL = [
  '/kakchhayalaya/',
  '/kakchhayalaya/styles.css',
  '/kakchhayalaya/app.js',
  '/kakchhayalaya/manifest.webmanifest',
  '/kakchhayalaya/icon-192.png',
  '/kakchhayalaya/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith('kakchhayalaya-') && key !== CACHE_NAME).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith('/kakchhayalaya/')) return;
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response.ok && APP_SHELL.includes(url.pathname)) {
      caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
    }
    return response;
  }).catch(() => request.mode === 'navigate' ? caches.match('/kakchhayalaya/') : Response.error())));
});
