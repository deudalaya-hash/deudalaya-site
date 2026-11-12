---
name: deudalaya-video-pipeline
description: Batch-process Deudalaya videos into validated 10-second MP4s, then optionally upload them to the existing Supabase feed with category metadata and a per-video report. Use for Deudalaya video batches or ADD video requests.
metadata:
  short-description: Process and publish Deudalaya video batches
---

# Deudalaya Video Pipeline

Use this skill for the Deudalaya batch workflow. Read the current Deudalaya, Supabase, and video-management instructions, then inspect the current feed code and live backend before publishing. The website uses legacy Supabase code, while project notes identify Firebase as the intended future backend; use Supabase only when the user explicitly requests the existing Supabase feed.

## Fixed media requirements

- Process video files placed directly in `~/DeudalayaVideoPipeline/inbox` (or the user-designated input directory). Supported source extensions: MP4, WebM, MOV, M4V, MKV, and AVI. Use `ffprobe` for actual stream inspection; never trust the extension alone.
- Each output must be an MP4 with H.264 video, AAC audio when the source has audio, and a duration of exactly 10 seconds (allow at most 0.05 seconds of container rounding in validation). Preserve aspect ratio and never crop. Cut longer sources to their first 10 seconds. Reject shorter sources rather than inventing or freezing frames. Record source and output durations in the report.
- Final output must be strictly below 4,000,000 bytes. Re-encode with the highest quality settings that pass the byte and decode checks. Never upload a failed or unvalidated output.
- Copy each unchanged source into the batch backup directory before encoding. Never overwrite or remove an input or prior batch artifact.
- Require a per-video JSON sidecar named `<video filename>.json` (for example, `clip.mp4.json`) with `category` set to exactly `देउडा`, `गाउँघर`, or `शहर`. A `caption` is optional; if omitted, use the input basename and record that fallback.

Example sidecar for `clip.mp4`:

```json
{"category":"शहर","caption":"Optional feed caption"}
```

## Run modes and authorization

The bundled `scripts/pipeline.py` processes a complete batch and writes a JSON report. It never uploads by default. For a project-local demo batch, pass `--input demo/input`; every video needs a `<video filename>.json` sidecar before it can validate:

```powershell
python .agents/skills/deudalaya-video-pipeline/scripts/pipeline.py --help
python .agents/skills/deudalaya-video-pipeline/scripts/pipeline.py --input "$HOME/DeudalayaVideoPipeline/inbox"
python .agents/skills/deudalaya-video-pipeline/scripts/pipeline.py --input demo/input
```

Uploading changes production Storage and database state. Do not run publishing mode unless the user explicitly authorized publication for this batch and confirmed they have the rights or permission to upload every item. Do not infer rights from a filename, a local copy, public availability, or admin status. It additionally requires `--publish --confirm-publish DEUDALAYA --confirm-rights` and the environment variables `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_ADMIN_JWT` (a signed-in admin user's access JWT). Never ask the user to paste a token into chat, save credentials in the repository, or print credentials. Do not use a service-role key or a Supabase personal access token as the user JWT.

```powershell
python .agents/skills/deudalaya-video-pipeline/scripts/pipeline.py --check-config
python .agents/skills/deudalaya-video-pipeline/scripts/pipeline.py --input "$HOME/DeudalayaVideoPipeline/inbox" --publish --confirm-publish DEUDALAYA --confirm-rights
```

The uploader reads these variables from the process environment first, then fills in any missing ones from the repository-root `.env.local`. It only reads the three supported names and never prints their values. `.env.local` is git-ignored. Use `.env.example` as a names-only template; copy it to `.env.local` and fill in the values locally. Keep the local file on your account and do not stage or commit it.

To configure the values:

1. In the Supabase Dashboard for project `bxzkclqanpuvxyhsrpog`, open **Project Settings → API** and copy the **Project URL** to `SUPABASE_URL`.
2. On that page, open **API Keys** and use an enabled **Publishable key** for `SUPABASE_PUBLISHABLE_KEY`. Never use a `service_role` or secret key.
3. Set `SUPABASE_ADMIN_JWT` to the current access token from a signed-in Supabase Auth session belonging to a Deudalaya admin. Obtain it through the app’s authenticated session tooling and put it directly into the local file or secret manager without printing it. Do not use the dashboard personal access token or an anon/publishable key in this variable. Access tokens expire; refresh the session and replace the local value when needed.
4. Run `--check-config`. It prints only which variable names are configured, missing, or point at the wrong project. A successful check confirms presence and the expected URL; the publishing preflight still validates the token’s user/admin claim, bucket, schema, and effective write access before any upload.

Publishing must fail closed unless the URL resolves to project `bxzkclqanpuvxyhsrpog`, the access token resolves to a Supabase user with trusted `app_metadata.role = "admin"`, the existing `videos` bucket is available and allows the file, and the live `feed_posts` schema supports the required fields. Never change project settings, bucket limits, schema, RLS, or Storage policies as a workaround. The script uses the existing public `videos` bucket and `feed_posts` flow; it does not use the separate proposed `community-videos` bucket or `public.videos` table.

The current root page has upload guards and a resumable-transfer helper, but its base `publishUpload` implementation is absent. The batch helper therefore uses the authenticated Supabase REST APIs directly. It writes `media_path` as an object key relative to the `videos` bucket, derives the user ID from the authenticated token, and sets `media_type`, caption, and category. It detects whether `feed_category` exists and uses it when available; otherwise it uses the existing `category` field, matching the feed's fallback. It leaves `created_at` to the database default.

## Batch behavior

1. Read only supported video files directly inside the input directory and their JSON sidecars. Continue across per-file failures.
2. Create a unique batch directory under `~/DeudalayaVideoPipeline/runs/` with `backup/`, `processed/`, and `report.json`. Never write processed media into public site assets.
3. Probe each source, preserve a byte-identical backup, create a 10-second output, probe it again, verify duration/container/codecs/size/aspect ratio, and run a full decode. A failed check makes that file ineligible for upload.
4. In authorized publishing mode, authenticate and inspect the target/bucket/schema before the first write. Use a deterministic user-scoped object key based on the output SHA-256. Check for an existing feed row before upload. If the object already exists, verify its bytes before reusing it. Never overwrite an object or silently change existing metadata.
5. Upload validated objects with overwrite disabled, then insert only the fields confirmed in the live schema. If Storage succeeds and the row insert fails, report the orphaned object and stop retrying that item automatically; do not delete it. A rerun may reconcile the same hash path after checking both resources.
6. Verify each created feed row and report each input as processed, uploaded, duplicate, or failed, including error text and output details. Never claim feed availability solely because an upload returned success.

The report contains source/backup/output paths, source and output hashes and byte sizes, source/output durations, codecs, dimensions, selected category/caption, encode settings, validation results, Storage path, database result, and per-step errors. The script does not deploy the website, modify code, alter policies, or run unless invoked.
