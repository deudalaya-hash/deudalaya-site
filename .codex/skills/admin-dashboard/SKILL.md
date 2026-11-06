---
name: admin-dashboard
description: Design, implement, secure, and test Deudalaya administrator dashboards. Use for dashboard layout, modules, admin authentication, moderation controls, accessibility, and dashboard reliability.
metadata:
  short-description: Deudalaya admin dashboard engineering
---

# Deudalaya Admin Dashboard

Guide Codex in building and maintaining an administrator interface for Deudalaya. This is an instruction skill, not authorization to change production, backend schemas, application architecture, or release systems.

## Read the related skills first

Before a dashboard task, read and follow:

- `deudalaya-core` for repository identity, project boundaries, preservation, and approval workflow.
- `firebase-backend` when the task actually uses Firebase.
- `video-management` for upload, metadata, moderation, playback, and deletion behavior.

If available, also read repository `AGENTS.md` and nested instructions. Higher-priority user instructions govern. In particular, never push or deploy without explicit user permission, even if a repository instruction says to do so automatically.

## Current project context — verify again on every task

The inspected Deudalaya root app is a static website/PWA with a Supabase client integration. `BACKEND_SETUP.md` says there is no verified live Supabase project, admin identity, or applied/tested migrations. No Firebase setup or admin dashboard was present in the inspected baseline. The root page contains an admin-claim UI guard, but a client-side claim check does not enforce access.

The repository's feed reads `feed_posts`, while proposed SQL also defines a separate `videos` model and `community-videos` bucket. These are not proven to exist in production. Public profiles are proposed, but user email/account administration and activity audit data are not confirmed. Treat module requests such as Users, Analytics, Settings, and Activity Logs as product requirements, not evidence of backend support. Recheck code, project config, live schema/policies, and deployed state before making claims or changes.

Do not introduce Firebase beside Supabase or migrate providers as an implementation detail. A backend/provider choice or migration is an architectural decision; explain the conflict and get approval first. Never invent collections, tables, endpoints, metrics, policy behavior, or credentials.

## Dashboard design workflow

1. Inspect the target route/page, existing Deudalaya styles, navigation, auth/session flow, feed data access, backend policies, mobile/PWA constraints, and relevant tests. Check `git status` before editing.
2. List requested modules and classify each as supported, partially supported, unsupported, or unverified. Do not seed demo values into a production-looking dashboard. For unsupported features, show a clear unavailable state and explain what backend capability is missing.
3. Propose and implement only the approved scope. Keep Deudalaya branding and visual conventions; use responsive layouts that prioritize moderation tasks, status, and safe actions rather than generic card grids.
4. Keep modules navigable without discarding context. Use clear active states, descriptive labels, and consistent action names. On narrow screens, collapse navigation into an accessible control and preserve usable video previews and tables/lists.
5. Build loading, empty, partial-data, permission-denied, network-error, and retry states as first-class states. Keep an error local to the affected module when other dashboard data remains usable. Do not turn errors into fake zero values.

## Suggested module contracts

These are product areas, not assertions that the current backend supports them:

- **Overview:** Count only records returned by an authorized backend query. State the range/definition for each metric. Do not invent views or activity counts.
- **Video management:** Provide search/filter over supported fields, visible status and upload time, preview, and actions allowed by the backend. Preserve stable identifiers and creator attribution.
- **Upload:** Follow `video-management`. Show file validation, progress, cancellation/retry only when actually implemented, and processing/validation outcomes.
- **Published/unpublished:** Query the confirmed states and publication policy. An unpublished record and its bytes must remain inaccessible to public users.
- **Users:** Use an approved admin API for private authentication details. A public profiles table does not grant access to email addresses or auth account status. Never query privileged auth tables from a browser or display inferred status.
- **Categories:** Read and edit only an existing supported taxonomy. Do not add category tables or fields without schema approval.
- **Analytics:** Display only measured values with clear definitions and dates. If tracking is absent, show “Not available: analytics are not configured.”
- **Activity logs:** Use a real append-only/trusted audit source if it exists. Do not fabricate events from current records or rely on client-authored logs for security auditing.
- **Settings:** Separate local UI preferences from privileged backend settings. Require backend authorization for server-side configuration changes.

## Authentication and protected actions

- Reuse the approved existing authentication provider and session mechanism. Do not create a second login system or expose secrets to the browser.
- Check authorization on initial route load, session restoration, token refresh, and before privileged actions for useful UI behavior. Sign out or block the UI when identity/role verification fails.
- Backend Rules, RLS, or trusted server endpoints must independently authorize reads and writes. Hiding a page, button, or navigation item is not security.
- Do not infer admin status from email address, profile text, local storage, query parameters, or user-editable metadata. Use only the trusted authorization mechanism already established by the backend.
- Keep session handling safe: no passwords/tokens in URLs, logs, analytics, or persistent custom storage. Make logout clear the active session and sensitive view state.
- If backend policy rejects an action, display a clear failure and keep the record state accurate. Never weaken backend policy to make the UI pass.

## Video moderation UX

Use the existing video-management skill for file checks, upload reliability, publication, and Storage privacy. For any destructive action:

- Name the target video and the consequences in the confirmation.
- Prevent double submission while the operation is active.
- Confirm success only after the backend reports success; refresh or reconcile server state after errors.
- Handle Storage and metadata cleanup as separate resources and report partial failure clearly.
- Never delete production videos or metadata without explicit permission identifying the target and scope.

Editing must preserve immutable ID, creator, upload timestamp, and object path unless an approved replacement workflow says otherwise. Do not offer an action the current backend cannot safely perform; show why it is unavailable.

## Accessibility and responsive requirements

- Use semantic landmarks and headings, a labelled navigation region, buttons for actions, and links for navigation.
- Make navigation and dialogs keyboard operable; provide visible focus, logical focus order, and focus return after closing a dialog. Do not trap focus in a hidden panel.
- Announce loading/progress/completion/errors with appropriate live regions. Associate field errors with their inputs and do not rely on color alone for status.
- Ensure readable contrast in light and dark themes, honor system preference when appropriate, and preserve a user-selected theme without using it as an auth or security signal.
- Support zoom and narrow viewports. Avoid horizontal scrolling for primary tasks; allow intentional overflow for dense data only with an accessible alternative. Respect reduced-motion preferences.
- Give video previews accessible names and usable controls; do not autoplay sound in dashboard previews.

## Testing workflow

Test behavior at the actual layer where it is enforced:

1. Authentication: signed out, valid admin, ordinary user, expired/refreshed session, and backend auth error. Verify server authorization for each privileged operation.
2. Data states: loading, empty, partial module failure, unavailable capability, network failure, malformed data, and retry/refresh.
3. Video actions: preview, metadata edit, publish/unpublish, and deletion confirmation; verify backend rejects non-admin attempts even if requests bypass the UI.
4. Search/filter: matching and non-matching results, empty filters, keyboard use, and status correctness.
5. Users/analytics/activity: confirm values are backed by authorized real data and missing capabilities are labelled unavailable.
6. Responsive/accessibility: desktop and mobile widths, keyboard-only navigation, focus visibility, dialog behavior, screen-reader labels/live status, contrast, zoom, and reduced motion.
7. Regression: run the relevant existing project tests and PWA/feed checks. Use the Firebase Emulator or Supabase local tooling only when the corresponding backend is actually configured. Never use production data for test fixtures.

Report exact checks and results. A visual mock or emulator test does not prove live authentication, deployed Rules/RLS, or production data access.

## Troubleshooting

- Dashboard redirects or shows signed out: inspect the auth provider, session restoration timing, token refresh, authorized domain/redirect URLs, and network errors. Do not add a second provider as a workaround.
- Admin sees permission denied: verify the confirmed trusted claim/role, current token, project/environment, query constraints, and deployed backend policy. Do not grant a role or loosen policy just to clear the screen.
- Rows appear missing: distinguish query filters, pagination, index/schema mismatch, RLS/Rules, and backend outage. Rules do not filter broad queries. Show an actionable error instead of an empty-state message when loading failed.
- User email/status unavailable: confirm whether an authorized server endpoint exists. Do not query auth internals from browser code or infer from profile rows.
- Counts look wrong: define the query, status inclusion, pagination, and time range. Avoid summing only a truncated client page and labelling it a total.
- Action succeeds but UI is stale: reconcile from the server or refresh the affected query; do not optimistically claim success if the write was rejected.
- Theme/sidebar breaks on mobile: test at narrow widths and high zoom, check focus and scroll containment, and ensure dialogs/navigation remain operable without a pointer.

## Handoff

Summarize the approved modules implemented, files changed, backend sources used, security checks and tests run, unsupported capabilities, and remaining setup/deployment work. Review the full diff and preserve all pre-existing changes. Do not push or deploy without explicit permission.
