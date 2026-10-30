# Deudalaya app ecosystem

The custom domain is a hosting arrangement. The gateway introduces three separate PWAs; it does not share application logic or state between them.

| App | URL and source | Manifest / worker scope |
| --- | --- | --- |
| देउडालय | `/` (existing root app) | `/` |
| शब्दलय | `/sabdalaya/` | `/sabdalaya/` |
| चलचित्रलय | `/chalchitralaya/` | `/chalchitralaya/` |

The gateway shell is in the root page, with its own `ecosystem-gateway.css` and `ecosystem-gateway.js`. A normal visit to `/` shows the gateway. The Deudalaya PWA starts at `/?app=deudalaya`; `/?gateway=1` is the explicit route back to the gateway, including from a standalone Deudalaya window.

Each app owns its interface, styles, JavaScript, manifest, icon, worker, install gate, and future backend integration boundary. The child apps do not import the gateway or each other. They only link back to the gateway; the gateway links to their install routes and reads their public app icons. There is no shared runtime bundle or shared application data store.

To move an app to another host, deploy that app directory as its own static site, update its manifest origin and service-worker start/scope paths for that host, and update the gateway's destination and manifest relationship entries. The app's UI and business logic remain in that app's source directory. Backend credentials and integrations should be configured independently per app when those services are introduced.

PWA install prompts require a user action. `getInstalledRelatedApps()` is optional and browser-limited. The gateway uses it when available and may remember a prior browser `appinstalled` event; a remembered state can become stale after uninstall. When neither check is available, the page says installation cannot be verified and directs users to their app launcher. These UI gates guide normal navigation; static GitHub Pages files are not an access-control boundary.
