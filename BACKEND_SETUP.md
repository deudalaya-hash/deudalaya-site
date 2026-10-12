# देउडालय video platform setup

The site remains deployable as a static GitHub Pages site. This repository currently has no Supabase project, authentication provider, administrator identity, or video-storage credentials. The front end therefore does not claim that registration, upload, moderation, likes, comments, follows, or bookmarks are live.

## Implemented in the static site

- Existing home/feed and poster retained, including optimized `dashain.webp`.
- Upload preview accepts MP4/WebM and enforces 25 MB and 15 seconds in the browser.
- The interface explicitly reports that submission is unavailable until backend setup; it never reports a successful upload.
- Share uses a stable URL hash and native share or clipboard where available. Opening a shared hash selects that feed item.
- Search finds matching current feed entries by creator, caption, or tags.
- Removed hard-coded sample comment and engagement counts.

Social action buttons explain that a connected account/backend is required; they do not store fake or device-only engagement. Search currently covers only the existing static feed. Browser checks are useful for the preview, but they are not a security boundary. The backend must validate file size, duration, format, ownership, and moderation state before publishing.

## Free plan notes checked 2026-10-12

Supabase is the proposed single backend (Auth, Postgres, Storage, and server functions) because the site is already static. Current published Free quotas include 50,000 monthly active users, 500 MB database size, 1 GB file storage, 5 GB egress, 500,000 Edge Function invocations, and at most two active free projects; free projects may pause after a week of inactivity. These are provider quotas, not a cost or availability guarantee. For a video feed, the 5 GB egress quota is likely the practical constraint: 1 GB storage holds at most about 40 files at the 25 MB cap before overhead, and repeated viewing consumes egress quickly. Monitor use and stop accepting uploads before quotas are exceeded. Supabase documents a 50 MB maximum file setting on Free, so this app's 25 MB bucket limit fits; for uploads above 6 MB, its docs recommend resumable upload for reliability.

See [Supabase pricing](https://supabase.com/pricing), [usage quotas](https://supabase.com/docs/guides/platform/billing-on-supabase), [file size limits](https://supabase.com/docs/guides/storage/uploads/file-limits), and [upload guidance](https://supabase.com/docs/guides/storage/uploads/standard-uploads). Recheck these before launch because provider limits can change.

## Backend foundation

`supabase/migrations/202610120001_platform_core.sql` is an additive starting schema for profiles, pending/approved videos, unique likes, comments, follows, private bookmarks, reports, RLS, and a private video bucket with a 25 MB limit. It has **not** been applied or tested against a Supabase project. Review it in a new project before applying. Admin authority checks use the JWT `app_metadata.role = "admin"`; set that only through trusted server-side/admin tooling, never user-editable metadata.

The SQL alone does not enforce 15-second media duration. A trusted upload processor or server-side validation step must inspect actual media before approval. GitHub Pages cannot host that privileged service or protect service-role secrets.

## To make accounts and the upload-to-approval workflow live

1. Create a Supabase project on a free plan and review its current quotas and terms.
2. Apply the migration in the Supabase SQL editor or with Supabase CLI after reviewing the policies.
3. Configure email authentication and site/redirect URLs. Google OAuth requires Google client credentials. Phone OTP requires an SMS provider and may incur charges; leave it disabled until configured.
4. Assign the administrator role through trusted Supabase server-side tooling. Never place a service-role key in this repository or browser code.
5. Add a server-side upload/validation function that authenticates the user, checks MP4/WebM, 25 MB and 15 seconds, writes to the private bucket, and inserts a `pending` row. It must not allow the uploader to set `approved`.
6. Add the protected moderation UI and playback flow using authorized signed URLs for approved videos.
7. Connect the static page to the project's public URL and anon/publishable key only after policies and flows are tested. Keep all privileged keys server-side.
8. Configure GitHub Pages deployment as before; no workflow or domain changes were made in this update.

## Not yet operational

Registration, OAuth/SMS login, real video upload/storage, server-side media validation, approval dashboard, public video playback, database-backed social actions, notifications, and database search need the connected project and trusted functions above. No provider quotas are promised here; check the selected plan before launch and monitor storage and bandwidth.
