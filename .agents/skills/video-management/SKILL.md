---
name: video-management
description: Design, implement, secure, debug, and test Deudalaya video uploads, metadata, moderation, and public playback. Use for admin video workflows or the public video feed.
metadata:
  short-description: Deudalaya video lifecycle engineering
---

# Deudalaya Video Management

Specialize in the complete Deudalaya video lifecycle: selection, validation, upload, metadata, moderation, playback, sharing, and safe deletion. This skill supplements the `deudalaya-core` and `firebase-backend` skills; read and follow both when available. Their safety boundaries apply. Do not treat this skill as authorization to migrate a backend, mutate production data, push, or deploy.

## Inspect before planning

1. Read the Deudalaya core and Firebase backend skills, repository `AGENTS.md`, backend setup notes, and current `git status`.
2. Trace the actual upload composer, validation, storage transfer, metadata write, public feed query, playback URL generation, sharing, and moderation callers. Inspect the current deployed/configured backend only when authorized tools and access are available.
3. Inspect the live data model and storage policies before using any table, collection, field, object path, bucket, or status. Source migrations and old documentation can be proposals rather than deployed truth.
4. Report conflicts and missing support before implementation. Preserve existing feed behavior and local assets. Change only the approved scope.

## Deudalaya baseline findings to re-verify

The inspected website has an existing Supabase integration. The owner has selected Firebase as the intended backend, but no Firebase implementation/configuration or live project was verified. Treat Supabase as legacy code; inspect Firebase before planning its use. Do not delete Supabase code or migrate production data without explicit permission.

- The legacy browser upload guard checks the signed-in user's `app_metadata.role = "admin"` claim. This is useful for UI behavior, not security enforcement; future Firebase authorization must use verified Security Rules and trusted server code. Existing Supabase RLS/Storage policies are unverified and remain relevant only while auditing the legacy integration.
- The upload code uses resumable TUS transfers and displays percentage progress. Inspect the current flow before claiming that cancellation, retry, or interrupted-session recovery is implemented; do not assume that progress UI implies these behaviors.
- The front-end size limit is currently 50 MiB (`MAX_UPLOAD_BYTES`); backend global and bucket limits can differ and may reject the transfer earlier.
- The setup notes explicitly state existing uploads accept any duration. The proposed platform migration originally contained a 15-second database constraint, while a later migration removes that cap. A 15-second limit is a requested product requirement in some plans, not a verified current backend invariant. Do not claim it is enforced until trusted media inspection and backend constraints are confirmed.
- The public feed reads `feed_posts` fields such as `id`, `user_id`, `media_path`, `media_type`, `caption`, `category`, and `created_at`. Checked-in earlier migrations also propose a separate `videos` table with `creator_id`, `caption`, `description`, `category`, `storage_path`, `duration_seconds`, `size_bytes`, `status`, and `published_at`.
- The website uses a `videos` Storage bucket for feed posts, while the proposed foundational schema defines a private `community-videos` bucket for submissions. These are not interchangeable. Confirm actual production tables, bucket, rules, and feed integration before connecting or reconciling them.
- The proposed SQL moderation states include `pending`, `approved`, `rejected`, and `removed`; requested product plans may use `draft`, `processing`, `published`, `unpublished`, and `failed`. Do not silently map, rename, or write these states. Determine the live schema and get approval for schema/state migration when needed.

All findings above are time-sensitive and must be rechecked against current code and authorized backend configuration on each task.

## Upload workflow

- Accept only the formats supported by the approved product and current backend. Product requirements may call for MP4 and WebM, but inspect the file picker, media support, Storage allowlist, and playback compatibility before widening types.
- Validate extension, declared MIME type, non-empty size, and configured size limit before starting. MIME type and filename are untrusted hints; enforce type/size again in Storage Rules or trusted server code.
- Inspect actual media duration using browser metadata for immediate user feedback, then validate the stored media in trusted server-side processing before publication. Reject unknown, invalid, zero, or over-limit duration according to the approved policy. A client-reported duration must never authorize publication.
- Prevent duplicate submissions while one transfer or metadata operation is active. Generate a stable unique media ID/path once per intended upload and reuse it for a safe retry only when the backend's resumable protocol supports that behavior.
- For resumable uploads, persist only the session information the SDK supports and the product permits. Provide cancel and retry controls only when wired to the actual upload task; cancellation must stop client transfer and define safe cleanup for partial objects/metadata. Handle component/page closure and avoid duplicate records after a retry.
- Show determinate progress, success, cancellation, and actionable error state. Restore controls after every terminal outcome. Do not expose access tokens or signed URLs in logs.
- Keep file and metadata consistency: define what happens if Storage succeeds but metadata creation fails, or vice versa. Use idempotent server operations, a processing state, or compensating cleanup where the existing backend supports it. Never delete an existing production object to repair an uncertain partial write.

## Metadata and moderation lifecycle

Before writing, confirm the real data contract. The product may need a unique ID, title, description, category, Storage path, creator/admin, upload timestamp, duration, byte size, and publication state; store only fields supported by the approved schema.

Treat lifecycle states as a state machine, not arbitrary text. Define permitted transitions and which actor can perform each one. A typical conceptual path may be draft → processing → published, with unpublished and failed outcomes, but this is an example—not a claim about Deudalaya's current schema. Do not store a client-provided creator/admin identity as proof of authorization. Use the authenticated identity and trusted claims/policies.

For edits, update only the intended metadata and preserve immutable IDs, ownership, original upload timestamp, and Storage path unless an approved replacement workflow exists. Publish only after server-side validation succeeds. Confirm public queries include only the confirmed published state and are compatible with backend Rules.

## Public feed and sharing

- Query only published records, with bounded pagination/order based on actual indexes. Security Rules authorize records; they do not filter a broad query.
- Preserve vertical playback, autoplay policy, user-initiated pause/play, navigation, search, categories, and PWA behavior. Avoid replacing the existing feed to attach a new backend.
- Handle loading, empty, offline, missing-object, permission, and playback errors explicitly. Release media object URLs and listeners when no longer used.
- Ensure Storage authorization matches metadata publication state. Avoid public bucket access or permanent token URLs that leave unpublished media reachable after unpublishing.
- Share a stable application/video link or approved media URL. Do not expose private object paths, credentials, or URLs that bypass access revocation. Test the shared destination while signed out.

## Authorization and deletion

- Admin-only upload, metadata changes, publishing, unpublishing, and deletion must be enforced by backend Rules/policies or trusted server code. Frontend role checks only improve the interface.
- Never assign admin privileges from user-editable metadata. Use the project's trusted role mechanism.
- Never weaken backend Rules to resolve a client error. Diagnose identity, claims, project, paths, MIME/size, query constraints, and policy behavior first; test allowed and denied requests.
- Deletion is a two-resource operation when a database record and Storage object both exist. Inspect references and the exact policy before acting. Prefer a recoverable soft-delete/tombstone only if the existing model supports it. If hard deletion is approved, plan ordering, failure recovery, retries, and reference cleanup so the system cannot publish a broken record or orphan a file.
- Never delete production videos, metadata, or user data without explicit approval that identifies the target and scope. Never run bulk deletion as routine cleanup.

## Verification workflow

Test locally or in the configured emulator before live systems when available:

1. Valid MP4/WebM and unsupported formats; empty, over-configured-size, and boundary-size files.
2. Duration below, exactly at, above 15 seconds, unreadable metadata, and server/client duration disagreement.
3. Progress at start, during transfer, completion, cancellation, timeout/offline, retry, page interruption, and duplicate-submit attempts.
4. Storage success/metadata failure and metadata success/Storage failure; confirm retries remain idempotent and partial objects are handled safely.
5. Admin upload and lifecycle actions succeed; ordinary authenticated and signed-out clients cannot upload, publish, edit, or delete.
6. Published media is readable publicly; draft/unpublished/rejected media and its bytes are not accessible publicly.
7. Edit preserves ID, creator, original upload timestamp, and path; search/filter and category behavior match real data.
8. Playback on desktop and mobile, shared link while signed out, loading/empty/error states, and existing PWA/feed regression tests.
9. Safe deletion using synthetic records; confirm references and object cleanup. Never use production records as test fixtures.

Report which tests actually ran, the environment (unit, emulator, staging, or production), exact failures, and untested behavior. An emulator pass does not prove deployed policies or production playback.

## Troubleshooting guide

- Upload permission denied: verify current user/session, trusted admin claim, selected backend project, object path, and deployed Storage policy. Do not relax policy or infer a claim from a profile field.
- File rejected despite client validation: compare actual MIME, byte size, global/bucket limits, and server validation result. Report which boundary rejected it.
- Upload stalls or fails: inspect network, resumable session state, transfer task errors, retry behavior, quotas, and server logs. Make retries idempotent; avoid starting a second transfer while the first is unresolved.
- Video will not play: verify object exists, content type, authorization for the current publication state, browser codec support, range/streaming behavior, and whether a stale token URL is used.
- Record absent from feed: inspect exact query fields/status, pagination, index errors, metadata write completion, and Rules. Do not claim Rules filter unwanted rows.
- Video visible after unpublish: inspect caching, object URL/download-token exposure, CDN/browser cache policy, and Storage authorization. Removing a feed record alone does not revoke a bearer URL.
- Duplicate or orphaned media: correlate the unique ID, transfer task/session, metadata write, and retry attempts; reconcile only after read-only inspection and explicit authorization for any production mutation.
- Delete partially failed: inspect database and Storage separately, preserve remaining evidence, and follow an approved recovery procedure. Do not blindly retry destructive calls.

## Illustrative examples

These examples are pseudocode only; adapt them to the actual configured SDK and schema.

```text
validate(file):
  check supported format and nonzero size
  compare bytes against the configured client limit
  read duration for preview feedback
  reject if unreadable or longer than 15 seconds
  still require trusted server validation before publish
```

```text
publish(videoId):
  require authenticated administrator in backend
  require stored object and successful server-side media validation
  apply only a permitted state transition
  set authoritative publication timestamp server-side
  make the record visible only through the public published query
```

Never treat pseudocode or example field names as the project's schema. Read `deudalaya-core` and `firebase-backend` for architecture, provider selection, project inspection, Rules, CLI, emulator, backup, cost, and deployment constraints.
