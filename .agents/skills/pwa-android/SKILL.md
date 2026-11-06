---
name: pwa-android
description: Inspect, test, and improve Deudalaya PWA installation, service-worker behavior, Android Chrome compatibility, and Trusted Web Activity packaging.
metadata:
  short-description: Deudalaya PWA and Android packaging
---

# PWA and Android for Deudalaya

Help maintain Deudalaya's installable website and, when requested, prepare its Android wrapper. Preserve the existing install gate, site identity, video playback, and offline design. This skill does not authorize signing, publishing, uploading an AAB, changing production hosting, pushing, or deploying.

## Inspect first

Read `deudalaya-core`, `deudalaya-frontend`, and `testing-engineer` when available, plus repository `AGENTS.md` and `APP_ECOSYSTEM.md`. Before every PWA change, inspect together:

- `manifest.webmanifest` for name, `id`, `start_url`, `scope`, display, colors, and icon paths.
- `sw.js` for scope, install/activate/fetch handlers, cache version, shell allowlist, and fallback behavior.
- `index.html`, `ecosystem-gateway.js`, `ecosystem-gateway.css`, and `install-gate.css` for service-worker registration, `beforeinstallprompt`, `appinstalled`, install state, and visible install gate.
- Existing PWA tests and asset files. Check current repo state and avoid clearing or unregistering a user's existing service worker/cache as routine cleanup.
- Any existing Android/TWA project, Bubblewrap config, package identity, signing setup, `assetlinks.json`, and release workflow. Do not assume an Android project exists.

The inspected baseline has a root manifest with Nepali Deudalaya identity, standalone display, start URL `/?app=deudalaya`, scope `./`, and local 192/512 px icons including a maskable icon. The root page registers `sw.js` at root scope. The service worker caches a small allowlisted app shell and falls back to cached shell resources when offline; it does not precache videos. The install gate uses `beforeinstallprompt`/`appinstalled` and installation detection. Recheck current files rather than relying on this snapshot.

## Core PWA principles

- Keep the existing website identity, URL structure, install gate, and PWA flow unless the task specifically asks to change them.
- `beforeinstallprompt` is conditional: the browser decides whether and when to fire it. Do not manufacture the event, bypass installability criteria, or promise that every browser exposes the same prompt.
- Keep manifest `id`, start URL, scope, and service-worker scope aligned. A path/scope mistake can create a second app identity or leave navigation uncontrolled.
- Ensure all declared icon paths exist and have correct sizes/types/purpose. Preserve Nepali display and existing launch artwork.
- Cache only resources that improve an understood offline/startup path. Never add full video media, private content, or rapidly changing API responses to the app-shell cache as a shortcut.
- Service-worker updates need deliberate cache versioning and a clear activation/update experience. Do not indiscriminately delete unrelated caches or force activation in a way that loses user work.
- A PWA may be installable without working offline video. Describe the actual offline guarantee precisely.

## PWA installation workflow

1. Confirm the page is served over HTTPS (localhost is suitable for development) and inspect manifest/service-worker URLs and response status.
2. In Android Chrome, inspect installability criteria and browser console. Check the install gate's status text, button state, `beforeinstallprompt` capture, `prompt()` call timing, and `appinstalled` transition.
3. Verify installed detection using standalone display mode and existing related-app logic. Do not rely on user-agent strings alone.
4. Test first load, reload, browser install prompt availability, dismissal, acceptance, already-installed state, and unsupported-browser state.
5. Verify the installed app opens the intended launch URL and that links, back behavior, video playback, share, and app updates remain usable.
6. Test offline shell only after a successful online visit. Confirm video/network errors are understandable; do not imply videos are available offline unless intentionally cached and tested.

Troubleshoot an absent prompt by checking browser support, HTTPS, manifest validity, service-worker control, install criteria, prior dismissal/installation, browser policy, and event timing. The absence of the event alone does not prove the install button is broken.

## Service worker and caching workflow

Before a cache change, identify each URL's role, expected update frequency, offline need, privacy, and byte size. Use a narrow explicit shell allowlist. Keep video requests on their normal network path unless offline video is an approved feature with a storage/eviction design.

Test install/activate/update behavior with a clean isolated browser profile when possible. Also test an existing installation to detect stale HTML, stale JavaScript, mismatched cache versions, and broken old-client behavior. Do not delete user caches or unregister production workers to make a test pass.

Use the existing PWA tests under `tests/` first. Do not assume a build tool, Lighthouse, Playwright, Android Studio, Bubblewrap, emulator, or device is installed. Inspect tooling and use only what exists or what the user approves.

## Android Chrome and device compatibility

- Test current Android Chrome in browser mode and installed standalone mode when a real device or emulator is available. Record Android, Chrome, viewport/orientation, network, and installed state.
- Include narrow phone, larger phone, and landscape layouts; check status/navigation bars and safe-area spacing.
- Verify tap targets, vertical video controls, autoplay-with-mute behavior, keyboard/accessibility where applicable, share sheet, and return/back navigation.
- Check the actual encoded video codecs/MIME, loading and buffering, network interruption, and playback after install. Desktop emulation is not proof of real Android playback.
- Test iPhone Safari separately if requested. Its installation and prompt behavior differs from Android Chrome; do not promise `beforeinstallprompt` support across browsers.

## Trusted Web Activity (TWA) packaging

A Trusted Web Activity wraps the existing HTTPS website in Android Chrome. Its fullscreen trust relationship is verified using Digital Asset Links. It does not bundle the whole site; website quality, network behavior, browser support, and domain ownership still matter.

Before preparing a TWA, confirm with the user and inspect:

- Canonical production origin, manifest URL, launch URL, and whether those URLs are stable.
- The approved Android application ID/package name, app name, icons, versioning, and ownership of the domain.
- Available Node.js, Java/JDK, Android SDK/build tools, Bubblewrap/Gradle versions, and a safe output directory. Keep generated Android output separate from unrelated applications.
- Whether the website already exposes `/.well-known/assetlinks.json` and the exact signing certificate fingerprint needed for the installed Play app.
- The owner and secure storage process for upload keystore, passwords, Play Console access, and Play App Signing. Never print or commit secrets/keystores.

Bubblewrap command examples (CLI options can change; first check the installed version with `bubblewrap --version` and `bubblewrap <command> --help`):

```sh
npm install --global @bubblewrap/cli
bubblewrap doctor
bubblewrap validate --url=https://deudalaya.com/
bubblewrap init --manifest=https://deudalaya.com/manifest.webmanifest --directory=<approved-output-directory>
```

These commands install tooling or generate files, so do not run them unless Android packaging is in scope and the output location/dependency installation is approved. Review every generated file before keeping it. Bubblewrap `update` may regenerate project files; inspect its behavior and diff before use.

A generated TWA project can produce APK/AAB artifacts. Build/test output is not permission to upload or publish. Do not create, access, or rotate signing keys without explicit authorization. Store keys outside source control in an approved secret store; protect backup and recovery procedures.

### Digital Asset Links

For a verified TWA, publish a valid JSON relationship at:

```text
https://<verified-domain>/.well-known/assetlinks.json
```

The relationship must use the approved Android package name and SHA-256 certificate fingerprint from the correct signing identity. The upload certificate and Play App Signing app certificate can differ; check Play Console's current signing details before constructing the file. Never guess fingerprints. Validate the file is served as JSON over HTTPS and exactly matches the package/certificate used by the installed app. If verification fails, Chrome may show browser UI/Custom Tab behavior instead of a trusted fullscreen TWA.

Do not add an `assetlinks.json`, package name, or fingerprint to the production site without user approval and confirmed ownership details.

### Signing and release safety

- Android updates must remain signed consistently. Play App Signing separates Google's app-signing key from the developer's upload key; protect the upload key and follow current Play Console workflow.
- AAB is a distribution artifact, not a publish permission. Validate package identity, version code/name, signing certificate, target SDK requirements, permissions, domain association, and behavior before release.
- Do not upload an AAB, create a Play release, roll out, or publish without explicit permission. Do not include keys, passwords, generated credentials, or release tokens in repository files or logs.
- Verify current Android/Google Play requirements at release time; requirements and supported tool versions change.

## Performance and video preservation

- Measure startup and media loading on representative mobile networks. Distinguish app-shell cache hits from remote video fetches.
- Keep cache entries small and named; inspect cache versioning, quota errors, and update behavior. A cache write failure must not block a successful live response.
- Avoid eager preloading or precaching the full video library. Use existing feed preload behavior and confirm that installation changes do not interfere with streaming/range requests.
- Test playback in online browser, installed PWA, TWA, and offline/error states where available. Confirm a cached shell does not show stale metadata or imply offline media availability.

## Verification checklist

- Manifest parses; identity, scope, start URL, display, colors, and icons are valid and coherent.
- Service worker registers at intended scope; app-shell assets are same-origin, intentional, and cached as designed.
- Existing install gate and event flow remain intact; unsupported/dismissed/already-installed states are clear.
- PWA install, launch URL, standalone navigation, update, and offline shell work in supported test browsers.
- Video loading/playback, share, network errors, and responsive UI work after installation.
- TWA package and Digital Asset Links use verified production origin, package ID, and correct signing fingerprint.
- Existing PWA/feed regression tests pass; report every test not run and why.
- Real-device Android behavior is labeled as tested only when it was tested on a device.

## Troubleshooting

- **No install button/event:** verify HTTPS/localhost, manifest fetch/parse, icon paths, active service worker/scope, browser criteria/support, dismissal state, and event capture before blaming UI.
- **App opens wrong route or duplicates install identity:** check manifest `id`, `start_url`, `scope`, redirect/canonical paths, and worker scope together.
- **Stale page after update:** inspect cache name/version, old-worker lifecycle, update activation, and cached asset allowlist in an isolated profile. Do not clear the user's live cache as the first step.
- **Offline page works but video does not:** this matches a shell-only cache unless video offline support is explicitly implemented. Report actual boundary; do not broaden caching without an approved storage/egress design.
- **TWA shows browser toolbar:** check `assetlinks.json` reachability/content, package name, signing fingerprint, redirects, and Android logcat verification message. Compare the correct Play app-signing certificate, not an assumed upload key.
- **Bubblewrap build fails:** run `doctor` and command-specific `--help`; verify Node/JDK/SDK/build-tools versions, licenses, manifest values, and signing configuration. Do not repeatedly regenerate or change versions without inspecting the failure.
- **AAB rejected or update cannot install:** verify package ID, version code, signing key continuity, Play App Signing configuration, current Play requirements, and artifact signature. Never replace a production signing key casually.

## Handoff

Report the files inspected/changed, install and update checks, exact devices/browsers, video playback results, packaging prerequisites, and limitations. Keep release steps separate from local build steps. Never push/deploy or publish/upload an Android bundle without explicit permission.

## Primary references

Check current documentation before release because browser and Play requirements change:

- Chrome PWA installability: https://developer.chrome.com/docs/lighthouse/pwa/installable-manifest
- Trusted Web Activity overview and setup: https://developer.chrome.com/docs/android/trusted-web-activity
- Bubblewrap CLI: https://github.com/GoogleChromeLabs/bubblewrap/tree/main/packages/cli
- Android app signing: https://developer.android.com/studio/publish/app-signing
- Android App Bundles: https://developer.android.com/guide/app-bundle
