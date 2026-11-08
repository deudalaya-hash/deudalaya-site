---
name: pwa-protection
description: Required guardrails for any Deudalaya work that may touch the install gate, manifest, service worker, or PWA assets.
metadata:
  short-description: Protect the Deudalaya install system
---

# Deudalaya PWA Protection

Use this skill before every Deudalaya development task. It does not grant permission to change protected code.

## Protected system

The source of truth for protected paths is `scripts/check-pwa-protection.js`. It covers the root Deudalaya entry and its inline installation gate, install UI code and styles, manifest, root service worker, install-gate stylesheet, PWA artwork/icons, PWA regression tests, and the protection workflow itself. Review that list and all references from `index.html`, `manifest.webmanifest`, `sw.js`, `ecosystem-gateway.js`, `ecosystem-gateway.css`, and `install-gate.css` before planning a change. Never infer that an asset or file is obsolete from its name alone.

## Authorization

1. Inspect current Git status and the applicable repository instructions.
2. If the task would modify a protected path or weaken installation behavior, explain the exact change, reason, and affected files to the project owner.
3. Wait for explicit approval of that scoped change before editing. General requests to improve, optimize, fix, or refactor the site are not authorization.
4. Preserve the mandatory install gate, browser confirmation, Android prompt capture, iOS manual guidance, standalone detection, manifest identity, service-worker scope, and existing cache policy unless the owner specifically authorizes an affected behavior.
5. Never silently install, bypass browser confirmation, expose the feed in browser mode, precache large videos, or unregister/clear an existing worker or cache.

## Checks

- Run `node scripts/check-pwa-protection.js` before committing ordinary work.
- A protected diff is a stop signal. Inspect it; never auto-restore it. For a change explicitly authorized by the owner, document that approval and use the local-only `--allow-authorized` flag. Do not pass that flag from CI.
- Run the relevant install-flow, install-guidance, manifest, entry-gate, and service-worker regression tests. Add a regression test for behavior changes.
- CI must compare the full PR base and head. The `PWA protection` check should be required for `main`; repository branch settings are necessary for enforcement.
- Report when physical Android Chrome or iOS Safari testing was unavailable. A simulated unit test is not a device test.
