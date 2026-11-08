# Deudalaya application

**Backend direction update (2026-11-06):** The owner has selected Firebase as Deudalaya's intended backend. No Firebase implementation or project configuration has been verified in this repository. The Supabase calls described below are existing/legacy integration and do not establish the target or production readiness. Read `.codex/knowledge/DEUDALAYA_MASTER_KNOWLEDGE.md` and `.agents/skills/deudalaya-core/SKILL.md` before backend work; do not delete legacy code or alter production data without explicit permission.

Deudalaya is the video-sharing application served from the site root and is one cultural/community space within Layapur. This project documentation covers only Deudalaya's interface, feed, profiles, authentication, installation experience, and existing Supabase integration.

## Application identity

- Canonical site: `https://deudalaya.com/`
- Web app manifest: `/manifest.webmanifest`
- PWA start URL: `/?app=deudalaya`
- Display mode: `standalone`
- Root service worker: `/sw.js`

The root page shows Deudalaya's installation gate on supported mobile browsers when the app is not installed. Android's Install App button invokes the browser prompt only after `beforeinstallprompt` and a user tap; if that event is unavailable, the page gives browser-menu instructions. iPhone and iPad show the Safari Share → Add to Home Screen steps. Desktop users are not gated and can use the browser's own install interface. The installed standalone app opens the video platform directly.

## Boundaries

Keep Deudalaya branding, video feed, profiles, authentication, and existing legacy backend calls within this application. Firebase is the intended target, but no Firebase setup is verified. Do not add cross-application cards, navigation, manifest relationships, or runtime dependencies. Treat existing backend credentials and data as sensitive; never place privileged secrets in client code or commits.

The service worker currently has root scope to support the existing Deudalaya PWA configuration. Avoid unregistering service workers or deleting caches as part of routine UI changes.
