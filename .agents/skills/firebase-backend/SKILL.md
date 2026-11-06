---
name: firebase-backend
description: Inspect, design, secure, debug, and verify Firebase backends for Deudalaya. Use for Firebase Auth, Firestore, Storage, Rules, Functions, CLI, Emulator, indexing, backups, or Firebase operations.
metadata:
  short-description: Secure Firebase backend engineering for Deudalaya
---

# Firebase Backend for Deudalaya

Use this skill for Firebase backend work in the Deudalaya project. The owner has selected Firebase as the intended backend. First inspect current repository configuration and, when authorized tools/access are available, the intended Firebase project. The inspected codebase contains Supabase integration but no verified Firebase implementation or project configuration. Treat Supabase as the existing/legacy integration. The backend choice does not itself authorize implementation, deployment, deleting Supabase code, or changing/migrating production data; obtain explicit permission for those actions and preserve existing functionality during planning.

## Non-negotiable Deudalaya requirements

- Only an explicitly authorized administrator may upload, publish, unpublish, edit, or delete managed videos. Enforce authorization in Firebase Security Rules and trusted server code, not just in the UI.
- Put video bytes in Firebase Storage and their metadata in Cloud Firestore, using only the project's confirmed bucket, collections, fields, and document relationships.
- The maximum video duration is 15 seconds. Client-side metadata checks improve feedback but are bypassable. Verify actual media duration in trusted server-side processing (for example a Cloud Function or approved media pipeline) before allowing publication. Rules do not inspect video contents.
- Public clients may read only videos whose confirmed publication state is published. Storage access must also be gated. Avoid public buckets and bearer download-token URLs when they bypass the intended publication rules.
- Unauthorized users must not modify video records. Never weaken rules to make a frontend error disappear.
- Never expose service-account JSON, Admin SDK private keys, or other privileged credentials in browser code, source control, logs, or client configuration. Firebase web app config and API keys are identifiers, not authorization; restrict keys where supported and rely on Rules/claims for security.
- Explain destructive operations before execution. Never delete production data. Never deploy without the user's explicit permission.

## Inspection before recommendations

1. Read repository `AGENTS.md`, the Deudalaya core skill if installed, backend documentation, and relevant source files. Check `git status` and preserve all pre-existing changes.
2. Inspect Firebase files and dependencies that actually exist: `firebase.json`, `.firebaserc`, Firestore and Storage rules, indexes, Functions source, environment variable names, package manifests, emulator config, and CI workflows. Do not print secrets. Redact credential values in notes and command output.
3. Confirm the intended Firebase project and environment from existing config or an authorized project selection. Use read-only project listing/status first. Never guess project IDs, bucket names, collection names, fields, regions, billing plans, or deployed state.
4. Compare repository configuration with the live project only when authenticated, authorized tools are available. Distinguish local files, emulator state, and production state. A checked-in rules file or migration is not proof it is deployed.
5. Summarize findings and propose the smallest change. Ask before provider migration, schema changes with broad impact, production mutations, or any destructive/irreversible operation.

## Authentication and administrator authorization

- Identify the existing sign-in provider and session flow before changing authentication. Do not create duplicate login systems.
- Use Firebase Authentication for identity only when it is the approved, configured provider.
- For custom claims, assign or revoke admin roles only from trusted Admin SDK code or trusted operational tooling. Never let a user write their own admin flag in Firestore or user-editable profile metadata.
- Treat custom claims as authorization inputs in Rules and server functions. Refresh tokens when a role change must take effect immediately; revoke sessions when required by the approved incident procedure.
- Check account state, token claims, and Rules independently. A hidden route or a frontend `isAdmin` branch is not a security boundary.

## Firestore and Storage design

- Inspect actual documents, indexes, Rules, and app queries before proposing schema changes. Prefer additive and backward-compatible changes. Never make up a collection or field name and present it as existing.
- Keep metadata fields minimal and validate types, lengths, allowed status transitions, ownership, and timestamps at the Rules/server boundary. Use server timestamps for authoritative event times.
- Model video state transitions deliberately (for example draft, processing, published, unpublished, failed only if the application supports these states). Prevent clients from setting server-verified duration/validation fields or bypassing required processing.
- Scope Storage object paths to a confirmed owner/video identifier pattern. Validate authenticated role, MIME type, and maximum bytes in Storage Rules; do not trust filename extensions alone. Validate actual media server-side.
- For reads, authorize Firestore metadata and Storage bytes consistently: an unpublished document must not reveal its media. Check how SDK download URLs behave; a tokenized URL can act as a bearer credential and may outlive a status change.
- Write Rules against observed app behavior and test both allowed and denied cases. Firebase Rules are not filters: queries must constrain results so every returned record satisfies the read policy.

Illustrative shape only (replace every placeholder after inspecting the real schema):

```text
match /<confirmed-video-collection>/{videoId} {
  allow read: if isAdmin() || resource.data.<confirmed-status-field> == "published";
  allow create, update, delete: if isAdmin() && validVideoRecord();
}
```

Do not paste this as production-ready Rules. It omits schema validation, safe state transitions, Storage authorization, and server-side duration verification.

## Firebase CLI and operations

- Confirm Firebase CLI version, logged-in identity, selected project aliases, and the exact target before any command that changes state.
- Prefer read-only commands first, such as `firebase projects:list`, `firebase use`, `firebase firestore:indexes`, and emulator status where supported. Redact IDs or user data when reporting if sensitive.
- Use explicit project selection only after the user confirms the environment. Do not silently switch aliases or deploy to whichever project happens to be active.
- Treat `firebase deploy`, `firebase firestore:delete`, data imports/restores, bucket changes, and Rules releases as privileged operations. Explain target, impact, rollback, and verification first; deploy only after explicit permission.
- Never use force or destructive flags to get around a conflict. Stop and report the exact failure if an operation could overwrite production state.

## Emulator and test workflow

Use the Firebase Emulator Suite before live operations when the project supports it:

1. Inspect emulator config and versions. Start only the needed Auth, Firestore, Storage, and Functions emulators with the repository's existing scripts/config.
2. Seed synthetic test data only. Never import production data into a local emulator without explicit authorization and a privacy review.
3. Test an authorized admin and an ordinary signed-in user, plus unauthenticated access.
4. Verify positive and negative cases: allowed admin upload, denied non-admin upload, size/MIME checks, denied unauthorized metadata edits/deletes, public read of published records, denied public read of unpublished records and their Storage objects, and allowed admin publication/deletion.
5. Test duration verification with media under, at, and over 15 seconds. Confirm the trusted processor—not a client-submitted field—controls publication eligibility.
6. Run Rules unit tests and application tests that already exist. Report emulator limitations, skipped tests, and warnings accurately.

Do not add broad or flaky tests unrelated to the changed behavior. Never claim production Rules or live authentication were verified by emulator-only tests.

## Indexes and performance

- Inspect actual query shapes, current index definitions, and missing-index errors before adding indexes. Add only indexes required by real queries; avoid guessed composite indexes.
- Review pagination, ordering, listener lifetime, fan-out reads, Storage egress, and large media downloads. Prefer bounded queries and cleanup listeners when that matches current app behavior.
- Use query explain/usage tools only when supported and authorized. Do not run load tests against production without explicit approval.
- Verify index deployment status separately from source changes; an index file in Git is not necessarily deployed.

## Backups and recovery

- Before proposing a backup or restore, identify the exact project, dataset, region, retention needs, current backup policy, and restore target.
- Prefer documented Firestore managed exports or scheduled backups and Cloud Storage retention/versioning appropriate to the confirmed plan. Firestore exports may incur reads and Cloud Storage charges; confirm cost and retention before scheduling.
- A restore can overwrite newer state. Never execute a production restore, bulk import, or deletion without explicit approval and a written recovery plan.
- Verify backup completion and perform restore drills in a non-production project where possible. Do not say a backup is usable merely because a schedule exists.

## Cost and usage monitoring

- Inspect actual billing plan, budget alerts, quotas, Storage size/egress, Firestore reads/writes/deletes, Functions invocations/runtime, and Auth usage before estimating cost.
- Explain that video egress and repeated playback can dominate usage. Use observed media sizes and traffic rather than invented quota estimates.
- Set budget alerts and operational limits only with user approval when they change billing or service behavior. Do not enable billing, upgrade plans, or create recurring resources without approval.

## Error handling and troubleshooting

Diagnose from the exact Firebase error code, operation, auth state/claims, selected project, and matching Rules—not from a frontend message alone. Never dump tokens or credential contents.

- `permission-denied` / Storage `unauthorized`: confirm project, identity, refreshed claims, object path, request metadata, and deployed Rules; reproduce in emulator. Do not loosen the policy as a shortcut.
- `Missing or insufficient permissions`: inspect the query constraints and Rules conditions; Rules do not filter results. Narrow the query only if it reflects intended product behavior.
- `failed-precondition` / missing index: inspect the exact query and generated index requirement, then add the minimal confirmed index and verify deployment separately.
- `storage/unknown`, upload timeout, or retry: check network, resumable upload progress, object metadata, file-size limits, quotas, and server logs. Avoid duplicate retries that create duplicate objects or records.
- `auth/invalid-credential` or claims absent: verify the configured provider, authorized domain, account status, trusted claim assignment, and token refresh. Never grant admin as a debugging workaround.
- Function validation failure: inspect sanitized logs and the media processor result; confirm duration is measured from the stored object and only server code can mark validation complete.
- Emulator/live mismatch: verify app project ID, emulator host settings, Rules versions, indexes, and that clients are not silently connecting to production.

## Completion report

For each approved change, report the files changed, the verified behavior, tests and exact results, remaining configuration or deployment steps, and any risks. Separate emulator results from live-project results. Do not deploy, push, or mutate production as an implied part of implementation.
