---
name: testing-engineer
description: Plan and run safe functional, regression, browser, backend, security, responsive, PWA, and performance tests for Deudalaya. Use when verifying Deudalaya behavior or designing its test strategy.
metadata:
  short-description: Deudalaya software testing engineering
---

# Testing Engineer for Deudalaya

Help test Deudalaya accurately, safely, and in ways another engineer can repeat. Testing does not imply permission to modify application code, production data, policies, push, or deploy. Read and follow `deudalaya-core`, `video-management`, `admin-dashboard`, `firebase-backend` when applicable, and `security-auditor` for explicitly requested security reviews.

## Deudalaya baseline — verify before relying on it

The inspected repository is mainly a static website/PWA with root `index.html`, browser scripts such as `social.js`, local video assets, `manifest.webmanifest`, `sw.js`, and many Node test files under `tests/`. Tests use Node's built-in `node:test` and `node:assert/strict` in `.test.cjs` files. There is no root package manifest in the inspected baseline; do not assume npm scripts, Playwright, a bundler, or a test runner package.

The site includes a Supabase client and feed integration as existing/legacy code, but `BACKEND_SETUP.md` contains historical setup notes and no Supabase live project, admin identity, or applied migration is verified. The owner has selected Firebase as the target; no Firebase configuration or project is verified. Check current code/configuration and authorized project state before backend tests. A passing local test cannot prove live Auth, RLS/Rules, Storage, or production behavior.

## Test workflow

1. **Inspect.** Check repository status and instructions, target code/callers, test files, manifests/lockfiles, scripts, and the actual environment. Preserve existing user changes. Identify which functionality exists versus placeholder/unavailable behavior.
2. **Plan.** Choose the smallest meaningful set of checks for the requested change. Separate unit, integration, browser, emulator, staging, and production verification. State prerequisites and avoid adding dependencies unless existing tooling cannot test the requirement and the user approves.
3. **Establish a baseline.** Run relevant existing checks before or alongside a change when requested. Record exact commands, environment, expected result, and failures. Do not hide a failure by changing tests without evidence.
4. **Test safely.** Prefer local static fixtures, synthetic accounts/data, and emulator/test projects. Never perform destructive tests or create/delete real production records. Obtain explicit approval before production requests that could affect users, cost, data, service availability, or security posture.
5. **Reproduce failures.** Record preconditions, clear steps, observed versus expected result, console/network/backend error codes, and whether the issue is deterministic. Redact tokens, credentials, personal data, and signed media URLs.
6. **Fix only if authorized.** Keep the fix scoped; add a regression test where appropriate. Rerun the exact failing check and neighboring regressions.
7. **Report.** List test names/commands, pass/fail/skip, environment, warnings, reproducible failures, and unverified boundaries. Never claim a live or device test passed if it was not run.

## Functional test checklist

Use the checklist that matches implemented functionality; do not imply unsupported functionality is live.

- **Authentication:** sign in/out, registration and recovery only if configured, session restoration/expiry, validation, auth errors, redirect handling, and unauthorized state.
- **Video feed:** supported media only, correct ordering/filtering, next/previous, pause/play/autoplay policy, source loading, missing media, empty feed, and playback failure recovery.
- **Upload/moderation:** format and configured byte boundaries, duration boundary if required, preview, duplicate submit, progress, failure, retry/cancel if implemented, metadata persistence, state transitions, and accurate list refresh.
- **Authorization:** anonymous and ordinary users are denied privileged reads/writes; authorized admins can perform only permitted actions. Test backend policy directly in an emulator/local test environment, not only disabled UI controls.
- **Search/categories:** exact, partial, Unicode, empty, no-result, and combined filter behavior using existing supported data.
- **Sharing:** shared links select the intended item, work in supported signed-out context, and do not expose private object access.
- **User interactions:** likes, follows, comments, and profile behavior only if the connected backend actually supports them. Check failure states and prevent fake local success.
- **Admin dashboard:** loading/error/empty states, auth redirect, action confirmation, permission errors, stale data refresh, and unavailable modules.

## Existing repository tests

Discover tests first with `rg --files tests`. These are commonly Node built-in tests and can be run without adding a test framework:

```powershell
node --test tests\deudalaya-video-only-feed.test.cjs
node --test tests\deudalaya-pwa-manifest.test.cjs
```

To run the current root suite, first inspect its size, test prerequisites, and any app-local suites, then use an explicit path/glob supported by the installed Node version, for example:

```powershell
$testFiles = Get-ChildItem tests -Filter '*.test.cjs' | ForEach-Object FullName
node --test $testFiles
```

Do not assume a root `npm test` command exists. A failure caused by unavailable browser binaries, backend configuration, or missing credentials is a blocked check, not a passing test. Report the exact reason.

## Browser, device, and PWA testing

- Inspect available browser automation and app tooling before installing anything. Prefer an existing Playwright/browser skill or configured test harness when available.
- Run the app using its documented local server. For a static site, a local HTTP server can exercise path-based assets, service worker, and PWA features more accurately than opening a file URL. Keep the server local and stop it when finished.
- Cover representative narrow mobile, tablet, and desktop viewports; keyboard navigation; focus; touch/swipe if supported; mobile browser video controls; orientation; zoom; and reduced motion.
- Verify install prompts only in a browser/device that supports the required PWA install events. Record when the browser does not expose an install prompt; do not treat that as app failure without checking support conditions.
- Test the service worker and manifest without clearing or unregistering the user's existing registrations/caches. Use an isolated browser profile for cache-sensitive tests when possible.
- Do not claim real-device Android, iOS, or Play Store behavior based on desktop emulation alone.

## Backend and security testing

First verify which backend is actually configured. Never assume Firebase is configured. For Supabase, establish project identity and whether migrations/RLS/Storage policies are deployed before interpreting results. Do not print environment secrets or token contents.

- Prefer a disposable local backend/emulator or designated staging project with synthetic data.
- Exercise success and denied operations as anonymous, ordinary authenticated, and authorized admin identities.
- Test database grants/RLS and Storage Rules/policies at the backend boundary. A UI test that confirms a hidden button is not an authorization test.
- For Firebase, use Emulator Suite Rules tests only if Firebase is configured in the project. For Supabase, use its available local/test setup only if present. Do not create a second backend to make a test possible.
- Confirm test queries match intended authorization. Rules are not query filters; a broad query may fail even if individual documents would be allowed.
- Do not test against production without explicit approval. No privilege escalation, password guessing, user enumeration, bulk writes, policy changes, or production uploads as test techniques.

## Performance and network resilience

- Measure the behavior that matters: initial page/resource load, video request start and playback readiness, transfer duration/progress, error rate, and memory growth during repeated navigation.
- Use local/synthetic media representative in dimensions and size; record device, browser, network throttling, and cache state. Avoid attributing CDN/backend performance from local assets.
- Exercise offline, slow network, timeout, interrupted download/upload, retry, and reconnect in a controlled browser/emulator. Check for duplicated metadata or requests after retry.
- Watch object URL/listener cleanup and video element reuse during feed navigation. Use browser memory/performance tools when available; report measurement limits.
- Never load-test or stress production without explicit authorization and a defined rate/cost/impact limit.

## Writing useful regression tests

- Assert observable behavior rather than implementation spelling whenever possible. Name the scenario and expected outcome clearly.
- Include negative cases for validation, auth, permissions, network failure, empty data, and boundary values where they matter.
- Keep fixtures synthetic and deterministic. Avoid real account data, timing races, production media, and tests that depend on live external services by default.
- For security-sensitive behavior, pair frontend tests with policy/emulator tests. A regex match or UI-only check cannot prove backend authorization.
- Preserve existing test meaning and fixtures; do not rewrite unrelated tests to make a suite green.

## Failure report template

```text
Check: <command or test name>
Environment: <local / browser / emulator / staging / production>
Result: <pass / fail / blocked / skipped>
Reproduction: <preconditions and concise steps>
Expected: <intended result>
Observed: <actual result and redacted error>
Limits: <what this check does not establish>
```

Group the report by user-visible flow. Distinguish failing code from setup failures, flaky checks, and tests not run. Link failures to the relevant file/line when known.

## Troubleshooting

- Test command not found: inspect package manifests and installed runtimes; use the repository's actual test runner. Do not install a framework by default.
- Test passes but feature is broken: check that the test exercises a reachable runtime path and real behavior rather than a source-text pattern alone; add an appropriate integration/browser check if authorized.
- Test fails only in CI: compare Node/browser versions, OS paths, environment variables, timezone, network assumptions, and generated assets. Redact secrets from logs.
- Auth test cannot sign in: check provider/project setup, test credentials, authorized domains, token refresh, and environment selection; do not reuse production passwords in test fixtures.
- Backend test gets permission errors: verify the selected project/emulator, identity/claims, query constraints, and deployed policy. Do not loosen policy as a workaround.
- Video does not play in automation: inspect codec support, MIME type, range requests, autoplay restrictions, media fixture validity, and browser logs. Distinguish unsupported codec from app logic.
- PWA test is inconsistent: use localhost/HTTPS, inspect manifest/service-worker scope and installability prerequisites, and isolate browser cache. Never clear the user's production PWA state.
- Performance results vary: control device/browser, network, cache, media, and repeat count; report the range and setup instead of presenting one run as a guarantee.

## Safety and permissions

Testing is not permission to fix, mutate a live backend, delete data, change policies, create paid resources, push, or deploy. Keep tests local and reversible. Ask before any test with material production, privacy, availability, or cost impact. Preserve all pre-existing work and never use destructive cleanup against a computed or unverified target.


