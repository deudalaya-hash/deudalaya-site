// चलचित्रलय worker owns only /chalchitralaya/. It currently passes all
// requests through and deliberately creates no caches or app data.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request));
});
