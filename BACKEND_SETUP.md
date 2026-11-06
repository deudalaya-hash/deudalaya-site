# देउडालय video platform setup

## Current backend direction — updated 2026-11-06

The owner has selected **Firebase as Deudalaya's intended backend**. This does not mean Firebase is implemented, configured, or production-ready: no Firebase SDK/configuration or project was verified in the inspected repository. Inspect current code and the intended Firebase project read-only before planning implementation.

The Supabase client code and SQL migrations described below are the **existing/legacy integration and historical setup notes**. They are retained to document current code and support migration discovery. The Supabase setup steps below are not an approved target-backend plan and must not be followed to create or migrate a production backend. Do not delete Supabase code or change/migrate production data without explicit user permission. See `.codex/knowledge/DEUDALAYA_MASTER_KNOWLEDGE.md` and `.agents/skills/firebase-backend/SKILL.md` for the current evidence-aware direction and safeguards.

The historical notes below reflect the repository state when they were written; verify each code, limit, provider, and deployment claim against current sources and authorized project state.

## Historical Supabase snapshot — not a current backend plan

The site remains a static GitHub Pages-targeted app. This older snapshot stated that the repository had no Supabase project, authentication provider, administrator identity, or video-storage credentials. Source code does contain Supabase calls; live connection and feature operation were not verified. The front end therefore does not establish that registration, upload, moderation, likes, comments, follows, or bookmarks are live.

## Existing client-side behavior (Supabase-era code)

- Existing home/feed and poster retained, including optimized `dashain.webp`.
- Upload preview accepts MP4/WebM at any duration and enforces a 25 MB application file-size limit.
- Feed media uploads use resumable TUS transfers with visible progress and server error reporting.
- Upload controls check the trusted `app_metadata.role = "admin"` claim; apply the admin upload migration below for database and Storage enforcement. GitHub Pages contains no privileged service-role credentials.
- Share uses a stable URL hash and native share or clipboard where available. Opening a shared hash selects that feed item.
- Search finds matching current feed entries by creator, caption, or tags.
- Removed hard-coded sample comment and engagement counts.

Social action buttons explain that a connected account/backend is required; they do not store fake or device-only engagement. Search currently covers only the existing static feed. Browser checks are useful for the preview, but they are not a security boundary. The backend must validate file size, format, admin authorization, ownership, and moderation state before publishing.

## Historical Supabase Free plan notes checked 2026-10-12

At the time this note was written, Supabase was proposed as the single backend (Auth, Postgres, Storage, and server functions) because the site is static. The owner has since selected Firebase as the intended target; these Supabase quota notes are historical and are not a current provider recommendation. Supabase plan quotas change, so the dated figures below should not be used for current estimates. For a video feed, egress and repeated viewing can materially affect costs; check the selected provider's current terms and actual usage before launch.

For an existing project, apply `supabase/migrations/202611060001_enforce_25mb_video_limit.sql`. The `videos` bucket limit is 25 MB (25,000,000 bytes); the Supabase global limit must be at least 25 MB, and a larger global limit does not raise the lower bucket limit. This repository change does not confirm that the migration has been applied to a live project.

See [Supabase pricing](https://supabase.com/pricing), [usage quotas](https://supabase.com/docs/guides/platform/billing-on-supabase), [file size limits](https://supabase.com/docs/guides/storage/uploads/file-limits), and [upload guidance](https://supabase.com/docs/guides/storage/uploads/standard-uploads). Recheck these before launch because provider limits can change.

## Historical Supabase SQL proposal

`supabase/migrations/202610120001_platform_core.sql` is an additive starting schema for profiles, pending/approved videos, unique likes, comments, follows, private bookmarks, reports, RLS, and a private video bucket with a 25 MB limit. It has **not** been applied or tested against a Supabase project. Review it in a new project before applying. Admin authority checks use the JWT `app_metadata.role = "admin"`; set that only through trusted server-side/admin tooling, never user-editable metadata.

There is no application-level duration cap. A trusted upload processor or server-side validation step should still inspect actual media before approval. GitHub Pages cannot host that privileged service or protect service-role secrets.

## Historical Supabase activation steps — superseded, do not execute as the current plan

1. Create a Supabase project on a free plan and review its current quotas and terms.
2. Apply the migration in the Supabase SQL editor or with Supabase CLI after reviewing the policies.
3. Configure email authentication and site/redirect URLs. Google OAuth requires Google client credentials. Phone OTP requires an SMS provider and may incur charges; leave it disabled until configured.
4. Assign the administrator role through trusted Supabase server-side tooling. Never place a service-role key in this repository or browser code.
5. Apply `202611030001_admin_video_uploads.sql`, assign the administrator role only through trusted tooling, and make all feed uploads admin-only. Then apply `202611060001_enforce_25mb_video_limit.sql` for the 25 MB bucket cap. Keep the existing MP4/WebM formats and do not impose a duration cap. A trusted processor may validate media before publication without trimming or compressing it.
6. Add the protected moderation UI and playback flow using authorized signed URLs for approved videos.
7. Connect the static page to the project's public URL and anon/publishable key only after policies and flows are tested. Keep all privileged keys server-side.
8. Configure GitHub Pages deployment as before; no workflow or domain changes were made in this update.

## Legacy Supabase feature status — not verified live

Registration, OAuth/SMS login, real video upload/storage, server-side media validation, approval dashboard, public video playback, database-backed social actions, notifications, and database search need the connected project and trusted functions above. No provider quotas are promised here; check the selected plan before launch and monitor storage and bandwidth.
