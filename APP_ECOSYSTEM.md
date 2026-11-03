# Deudalaya application

Deudalaya is the video-sharing application served from the site root. This project documentation covers only Deudalaya's interface, feed, profiles, authentication, installation experience, and Supabase integration.

## Application identity

- Canonical site: `https://deudalaya.com/`
- Web app manifest: `/manifest.webmanifest`
- PWA start URL: `/?app=deudalaya`
- Display mode: `standalone`
- Root service worker: `/sw.js`

The root page shows Deudalaya's installation gate in a browser. Its Install App button invokes Chrome's native prompt only after the browser dispatches `beforeinstallprompt`; the installed standalone app opens the video platform directly.

## Boundaries

Keep Deudalaya branding, video feed, profiles, authentication, and Supabase integration within this application. Do not add cross-application cards, navigation, manifest relationships, or runtime dependencies. Treat Supabase credentials and data as production resources; never place secrets in client code or commits.

The service worker currently has root scope to support the existing Deudalaya PWA configuration. Avoid unregistering service workers or deleting caches as part of routine UI changes.
