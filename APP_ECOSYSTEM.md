# Deudalaya app ecosystem

The custom domain is a hosting arrangement. The root experience is currently focused on Deudalaya alone; the other app destinations and their independent source remain available at their own paths.

| App | URL and source | Manifest / worker scope |
| --- | --- | --- |
| लयपुर | `/index2.html` | `/layapur.webmanifest` / `/` (existing root scope) |
| देउडालय | `/` (existing root app) | `/` |
| शब्दलय | `/sabdalaya/` | `/sabdalaya/` |
| चलचित्रलय | `/chalchitralaya/` | `/chalchitralaya/` |
| phoneलय | `/phonelaya/` | `/phonelaya/` |
| कक्षालय | `/kakchhayalaya/` | `/kakchhayalaya/` |

लयपुर is the existing `/index2.html` application and keeps its existing root-scoped manifest and service-worker registration. The gateway links to that page; it does not create a second copy or change the Deudalaya–लयपुर in-app switch.

The Deudalaya gateway shell is in the root page, with its own `ecosystem-gateway.css` and `ecosystem-gateway.js`. A normal visit to `/` presents Deudalaya as the only app. The other app cards remain in source but are hidden; their directories, routes, manifests, workers, and installation flows are retained. The Deudalaya PWA starts at `/?app=deudalaya`; `/?gateway=1` is the explicit route back to the Deudalaya home screen, including from a standalone window.

Each app owns its interface, styles, JavaScript, manifest, icon, worker, install gate, and future backend integration boundary. The child apps do not import the gateway or each other. They link back to the Deudalaya home screen; no app shares a runtime bundle or application data store.

To move an app to another host, deploy that app directory as its own static site, update its manifest origin and service-worker start/scope paths for that host, and update the gateway's destination and manifest relationship entries. The app's UI and business logic remain in that app's source directory. Backend credentials and integrations should be configured independently per app when those services are introduced.

PWA install prompts require a user action. `getInstalledRelatedApps()` is optional and browser-limited. Install gates enable Open App only after a browser installation event or an available related-app check confirms installation. When neither check is available, the page explains that installation cannot be verified and directs users to browser-specific instructions. These UI gates guide normal navigation; static GitHub Pages files are not an access-control boundary.
