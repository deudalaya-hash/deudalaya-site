---
name: deudalaya-frontend
description: Design, implement, and verify Deudalaya website frontend changes, including responsive layouts, video interactions, accessibility, performance, and PWA behavior. Use for Deudalaya UI work.
metadata:
  short-description: Deudalaya frontend design and engineering
---

# Deudalaya Frontend

Build clear, maintainable frontends for the Deudalaya site while preserving its established identity and behavior. This skill is for UI work; it does not authorize backend/schema/security-policy changes, broad redesigns, production changes, pushes, or deployments.

## Project context — inspect and recheck

Read and follow `deudalaya-core` and `testing-engineer` when available, plus repository `AGENTS.md` and nested instructions. Read `APP_ECOSYSTEM.md` when PWA, navigation, shared applications, or site identity are affected.

The inspected root site is a static HTML/CSS/JavaScript Deuda cultural video experience. The root `index.html` contains most of the main layout/styles and much feed behavior; `social.js` contains profile and interaction behavior; audio features are in `deudalaya-audio.js` and `deudalaya-audio.css`. The repository contains separate sibling applications—do not style or edit them as part of root Deudalaya work unless asked.

Current visual cues include a near-black base (`#101014`), dark panels, white/muted text, pink accent (`#ff315b`), cyan accent (`#25e5dc`), and DM Sans/system text. The desktop feed uses side navigation, a centered vertical video, and a right-side rail; mobile layouts use dedicated responsive navigation and interactions around a 700px breakpoint. These are observed cues, not a mandate to retain every current layout detail when a user requests a scoped redesign. Inspect the target CSS and actual viewport behavior before making choices.

The root `manifest.webmanifest` defines the Deudalaya Nepali identity, standalone display, and launch icons. The root `sw.js` caches a small shell and claims clients. Keep its scope, install gate, manifest behavior, existing media/content, and app-specific branding intact unless explicitly requested.

## Frontend workflow

1. **Inspect.** Check `git status`, applicable instructions, target page/component, imported scripts/styles, existing responsive rules, relevant content/assets, callers, and current tests. Identify whether styles live inline or in a shared file before editing.
2. **Understand the requested change.** Identify the user task, supported data states, primary device widths, and interactions affected. State assumptions and surface conflicts before material architecture or design changes.
3. **Preserve and scope.** Make the smallest coherent changes in the requested app/files. Avoid a new framework, component system, design system, fonts, icon package, or runtime dependency unless the task requires it and the user approves the cost/impact. Keep code understandable to a beginner maintaining this static site.
4. **Design from the content.** Use Deudalaya's cultural media, language, and video-first purpose as context. Preserve existing palette, typography, spacing character, navigation, and logos where appropriate. Do not replace Nepali identity/content with generic SaaS styling. Do not redesign the full site unless explicitly requested.
5. **Implement semantic UI.** Use meaningful headings/landmarks, native buttons/links/forms, explicit labels, accessible names, and clear status/error copy. Avoid clickable `div`s, unlabeled icon-only controls, and unnecessary motion.
6. **Verify.** Check the affected route and surrounding flows at representative mobile and desktop sizes; run relevant existing regression tests if requested or needed. Review the complete diff and report the exact files, checks, and limitations.

## Responsive layout checklist

- Start with the narrow viewport and preserve a usable video-first experience without clipping controls, captions, or navigation.
- Check at least a compact phone width (about 320–375 CSS px), a larger phone, a tablet/intermediate width, and desktop. Include landscape where video or fixed navigation is affected.
- Account for dynamic mobile browser chrome and safe-area insets when using viewport-fixed UI. Prefer modern dynamic viewport units when compatible with project conventions.
- Avoid page-wide horizontal scrolling. Keep touch targets comfortably usable, separate adjacent controls, and do not make swipe the only way to navigate.
- Test long Nepali and English text, usernames, captions, missing images, and media aspect ratios. Allow content to wrap without covering the action rail.
- Verify sticky/fixed navigation does not obscure focus, modal content, browser controls, or the video itself. Make scroll ownership clear.
- Ensure media respects the intended vertical presentation and does not stretch; handle tall/wide footage deliberately using existing `object-fit` behavior.

## Video experience

- Preserve the existing feed's navigation, autoplay/mute policy, pause/play behavior, progress affordances, sharing, and audio integration when a change touches the player.
- Handle metadata loading, buffering, playback rejection, network failure, missing files, and empty states without showing stale captions or controls for the wrong item.
- Respect browser autoplay restrictions; never assume unmuted autoplay works on mobile. Keep meaningful controls available to keyboard and touch users.
- Avoid downloading the full video eagerly. Reuse current preload behavior, lazy-load where it improves the actual flow, and release object URLs/listeners when the player lifecycle ends.
- Keep media error messages actionable and do not expose private storage paths, tokens, or backend details in user-facing copy.
- Do not alter upload format, duration rules, file-size limits, publication state, backend auth, RLS, or Storage Rules as a frontend-only change. Route backend questions through `video-management` and the relevant backend skill.

## Accessibility checklist

- Use a logical heading structure and landmarks. Give controls clear, consistent accessible names and native semantics.
- Verify keyboard-only operation for feed navigation, menus, forms, modals, video controls, and dismiss actions. Show a visible focus indicator and restore focus after a dialog closes.
- Label search and upload fields; connect validation/error text to inputs. Announce upload/loading/playback failures and important updates with an appropriate live region without excessive announcements.
- Check contrast for muted text, accent buttons, focus rings, overlays on video, and selected states. Never use color alone to convey status.
- Respect reduced motion for transitions, splash animation, autoplay-related movement, and decorative effects. Avoid flashes and unexpectedly moving content.
- Do not suppress browser context menus or native media controls as an assumed security or design measure.
- Test zoom/reflow and screen-reader labels for icon buttons, avatars, video previews, and navigation. Check both English and Nepali text shaping.

## Frontend performance

- Prefer existing local assets and fonts. Avoid adding dependencies for small UI details.
- Inspect image dimensions/format and use appropriate responsive sizing, intrinsic dimensions, and lazy loading for below-the-fold imagery. Preserve supplied brand assets.
- Avoid unnecessary work on every feed render; keep event listeners from accumulating and clean up observers, timers, media elements, and object URLs.
- Keep service worker asset lists deliberate. Do not add large videos or rapidly changing resources to the precache without a specific offline/performance reason.
- Check actual network and browser performance before claiming an optimization. Test cold and warm cache where relevant and distinguish local assets from remote backend/CDN behavior.
- Do not trade away clear error handling, keyboard support, or media quality solely for a synthetic score.

## PWA behavior

- Preserve the existing install gate and prompt flow; browser installation prompts are conditional on browser support and installability requirements.
- When changing app identity, scope, launch URL, icons, shell assets, or service-worker caching, inspect the manifest and worker together and run the existing PWA tests.
- Do not unregister service workers, clear user caches, or replace existing registrations as routine test cleanup. Use an isolated browser profile for cache-sensitive QA.
- Test localhost/HTTPS, installed standalone mode, browser mode, update behavior, offline shell fallback, and media/network failures as appropriate. Do not claim Android/iPhone device coverage from desktop emulation alone.

## Testing and visual QA

Inspect the repository tests before introducing tools. The inspected baseline uses Node's built-in `node:test` with `.test.cjs` tests under `tests/`; do not assume a root npm script, browser automation dependency, or build step. Use the existing browser automation or `webapp-testing` skill if available and appropriate; do not install a new dependency without need and approval.

For a UI change:

1. Check the relevant existing regression tests, especially feed, install/PWA, and responsive behavior affected by the edit.
2. Load the changed page in a real browser when tooling is available. Inspect console errors, failed network requests, and actual layout at phone and desktop widths.
3. Check interaction states: normal, hover where relevant, focus, active/selected, disabled, loading, empty, error, and modal/open state.
4. Verify keyboard and reduced-motion behavior. Run a targeted accessibility check if tooling exists, then manually inspect semantic labels and contrast.
5. Recheck unchanged adjacent flows and inspect the full diff for unrelated styling, content, or asset changes.

If browser/device verification cannot run, report that limitation; do not describe source inspection as visual QA.

## Troubleshooting

- Mobile controls disappear: inspect fixed-position offsets, `100vh` versus dynamic viewport height, safe areas, overflow/scroll containers, and stacking contexts at the target viewport.
- Video overlays collide with captions: check variable text length, right-side action width, bottom navigation, and aspect-ratio behavior with long Nepali and English content.
- Autoplay fails: inspect mute state, user gesture requirements, `playsinline`, media readiness, and rejected `play()` promises. Provide a user-triggered fallback.
- PWA install prompt is absent: verify browser support, HTTPS/localhost, manifest/worker scope, install criteria, and whether the browser has already installed/dismissed the app. Do not force or fake the prompt.
- Offline UI is stale: inspect the current shell allowlist, cache name/version, fetch failure fallback, and whether the changed resource is intentionally cached. Never clear the user's production cache to diagnose it.
- Styles differ between pages: locate the source of inline/shared styles and selector specificity before adding overrides; avoid unrelated global CSS changes.
- A browser test passes but visual behavior is wrong: inspect screenshots and computed layout at the actual viewport; source-pattern checks do not prove rendering.

## Scope and handoff

Do not modify backend security policies or database structure during frontend work. Do not push or deploy without explicit user permission. Summarize what changed, why, exact files, tests/visual checks and results, accessibility/performance observations, and any unverified device/backend behavior.
