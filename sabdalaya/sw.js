// Sabdalaya's worker is deliberately scoped to /sabdalaya/ and does not cache
// requests yet. Audio, uploads and account data therefore remain network-owned.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request));
});
