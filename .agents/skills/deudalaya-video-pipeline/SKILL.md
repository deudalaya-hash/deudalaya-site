---
name: deudalaya-video-pipeline
description: Prepare, compress, validate, and publish Deudalaya feed videos with FFmpeg and the existing Supabase integration. Use whenever the user provides a video for Deudalaya, asks to add/publish a video, or types ADD with a video.
metadata:
  short-description: Compress and publish Deudalaya videos
---

# Deudalaya Video Pipeline

## Purpose

Prepare video files for Deudalaya, preserve an untouched original, enforce the project media limits, validate playback, and publish to the existing feed using its configured Supabase integration.

This skill complements `video-management`, `deudalaya-core`, and `supabase`. Read the relevant skills and inspect current project code and backend configuration for each task. Do not infer live schema, bucket settings, roles, or permissions from old notes or migrations.

## Permanent media rules

- Maximum duration: 10 seconds. Reject longer clips unless the user explicitly authorizes trimming; never trim silently.
- Final file size must be **strictly less than 4,000,000 bytes**. Exactly 4,000,000 bytes is too large.
- Final container: MP4, with H.264 video and AAC audio when audio is present.
- Preserve the source aspect ratio. Do not crop to fit a target screen.
- Optimize for mobile playback and slow connections while retaining the best reasonable quality within the size limit.
- Never publish corrupt, unplayable, unsupported, oversized, miscategorized, or unvalidated media.
- Preserve titles, descriptions, and category metadata supplied by the user. The only categories are `देउडा`, `गाउँघर`, and `शहर`. Do not guess a category; ask only when it is unclear.
- Keep an unchanged backup of every original in a task-scoped location outside the public feed assets. Never overwrite or delete the original automatically.

## ADD command

When the user provides a video and types `ADD`, start this pipeline automatically. Treat `ADD` as approval to upload and publish that specific video once it passes validation and the category and required metadata are clear. Do not ask for a redundant publishing confirmation.

Ask only for essential missing information, such as an unclear category or a required title. If authorization, write access, or backend policy prevents upload or publication, stop at that boundary and explain the specific blocker. Never bypass authentication, RLS, Storage policies, bucket limits, or other security controls.

## Workflow

Use this sequence:

**SELECT VIDEO → COMPRESS → VALIDATE → UPLOAD → PUBLISH → VERIFY**

### 1. Inspect and preserve

1. Identify the source file and inspect its actual format, codecs, duration, dimensions, audio presence, and byte size. Do not rely only on filename extensions or browser-provided MIME types.
2. Use `ffprobe` when available. Check `ffmpeg` and `ffprobe` availability with `Get-Command`/`where.exe` on Windows or `command -v` on Unix. If unavailable, do not silently fetch binaries; use an approved installed/bundled copy or explain the prerequisite.
3. Copy the source to a task-scoped backup before encoding. Write outputs to a separate path; never encode over the original.
4. Reject clips over 10 seconds unless the user authorizes trimming. If trimming is approved, preserve the intended content and report the exact trim.

Example inspection:

```powershell
ffprobe -v error -show_entries format=duration,size,format_name:stream=codec_type,codec_name,width,height,sample_rate,channels -of json input.mp4
```

### 2. Compress to the byte limit

If the source is already a valid MP4/H.264 file, within 10 seconds, and strictly below 4,000,000 bytes, it may be used as-is after full validation. Otherwise transcode it with FFmpeg.

Calculate a total bitrate from the clip duration rather than using one fixed bitrate for every video. Target a safety margin below the hard cap (for example, 3.6–3.8 MB) to account for audio, MP4 muxing overhead, and encoder variation:

```text
target_total_bps = target_bytes * 8 / duration_seconds
video_bps = target_total_bps - audio_bps - muxing_margin_bps
```

Choose the audio budget only when the source has audio. Use a reasonable AAC bitrate (often 64–96 kbit/s for short mobile clips), and reserve additional bitrate for container overhead. If the output is still too large, lower the video bitrate and, when needed, reduce resolution while preserving aspect ratio. Keep the shorter image dimension even and do not upscale. Never use a crop filter.

Illustrative two-pass MP4 encode (replace `VIDEO_BPS` with the duration-derived bitrate and adjust the scale bound only when needed):

```powershell
$pass = 'work\video-pass'
$filter = "scale=w='if(gte(iw,ih),min(1280,iw),-2)':h='if(gte(iw,ih),-2,min(1280,ih))'"

ffmpeg -y -i input.mp4 -map 0:v:0 -vf $filter -c:v libx264 -preset medium `
  -b:v VIDEO_BPS -pass 1 -passlogfile $pass -an -f null NUL

ffmpeg -y -i input.mp4 -map 0:v:0 -map '0:a:0?' -vf $filter `
  -c:v libx264 -preset medium -b:v VIDEO_BPS -pass 2 -passlogfile $pass `
  -c:a aac -b:a 96k -movflags +faststart output.mp4
```

For a source without audio, omit the audio map and AAC options. Confirm that the local FFmpeg build has `libx264` and AAC encoders before relying on this example. If the output is at or above 4,000,000 bytes, repeat with adjusted bitrate/resolution and validate again. If acceptable quality cannot meet the limit, preserve the original, do not upload, explain the limitation, and offer alternate settings.

### 3. Validate before any upload

Inspect the final file again with `ffprobe` and verify:

- size is below 4,000,000 bytes;
- duration is no more than 10 seconds;
- format is MP4;
- video codec is H.264;
- audio codec is AAC when an audio stream exists;
- dimensions are nonzero, aspect ratio matches the source within normal encoder rounding, and no crop was applied;
- a full decode completes without errors.

Full decode check:

```powershell
ffmpeg -v error -i output.mp4 -f null NUL
```

If any validation fails, do not upload or publish. Keep the original and any diagnostic output separate from public assets.

### 4. Check duplicates and metadata

Before transfer, inspect the existing feed through authorized, read-only means. Compare a content hash when available and check existing media paths/records to avoid duplicate uploads. Do not create or assume database fields. Preserve the user's title, description, and selected category; ask only for essential missing information. Use exactly one of `देउडा`, `गाउँघर`, or `शहर`.

### 5. Upload and publish safely

- Use the existing Deudalaya Supabase project integration and existing `videos` bucket. Verify the connected project, bucket, actual schema, and caller permissions before any write.
- The `ADD` command authorizes upload and publication for that supplied clip after all validation and required metadata are complete; no extra confirmation is needed in that case.
- If the current connection is read-only, unavailable, points to another project, or lacks the required admin permission, stop and explain what access is needed. Never request secrets in chat or expose service-role keys in frontend code, logs, or output.
- Respect existing schema, RLS, Storage policies, and bucket MIME/size limits. Do not change policies, schema, backend architecture, or project configuration as a workaround.
- A frontend check is not a security boundary. Confirm the actual bucket limit is compatible with the strict 4,000,000-byte rule. If the bucket allows larger objects, report that server-side enforcement is missing and request authorized configuration rather than claiming universal enforcement or bypassing policies.
- Upload only the validated compressed MP4. Store the correct Storage path/URL and metadata using the actual existing publishing flow. Avoid duplicate objects and records; handle partial failures without blindly retrying or deleting uncertain production data.
- Do not deploy or push code changes without explicit user permission. Upload/publish permission from `ADD` applies only to the supplied video and does not authorize code deployment.

### 6. Verify publication

After an authorized upload and publish operation, use read-only checks to confirm the expected record appears in the selected category, points to the uploaded object, and the public feed can load and play it. Verify the final stored size and category. If the feed or object is unavailable, report the exact failure and do not claim publication succeeded.

## Protected project functionality

- Never modify the Install App gate, installation screen, Install App button, manifest, service worker, installation logic, or any PWA installation behavior.
- Preserve the existing installation protection rules and checks. Do not disable, bypass, weaken, or remove them.
- Keep changes limited to video preparation, upload, metadata, and feed publishing needed for the authorized video task. Do not alter unrelated feed functionality.
- Do not push or deploy without explicit permission.

## Report

Report source and final byte sizes, duration, resolution, codecs, whether transcoding occurred, backup location, validation results, duplicate check, category/metadata used, upload/publish outcome, and live playback verification. Separate local validation from Supabase, feed, and live-site checks; never claim a check ran if it did not.
