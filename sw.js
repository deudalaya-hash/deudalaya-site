/* Deudalaya service worker
   Purpose: lets browsers treat the site as an installable app.
   It does NOT cache anything and does NOT intercept requests, so the feed,
   Supabase calls, uploads and the version.json update check behave exactly
   as they do today. */

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

// Present so the app qualifies as installable. No respondWith() call,
// so every request goes to the network exactly as normal.
self.addEventListener('fetch', () => {});
