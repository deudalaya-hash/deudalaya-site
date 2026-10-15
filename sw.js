/* Deudalaya service worker
   Purpose: supports PWA installation and passes requests straight to network.
   No response is cached; Supabase calls, uploads and update checks continue
   to use their normal network requests. */

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

// Pass requests through to the network without caching them. A real response
// keeps Chromium's installability check from treating this as an empty handler.
self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request));
});
