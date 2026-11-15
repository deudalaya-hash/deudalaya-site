# Deudalaya optimized library benchmark

Completed: 2026-11-15 (local Deudalaya workspace)

## Scope

- Discovered 168 local MP4 paths across assets/, demo/, video-library/originals/, and video-library/processed/.
- SHA-256 deduplication found 163 unique source files; 5 duplicate paths were skipped for encoding and retained as aliases in the source map.
- Produced 509 optimized clips in video-library/optimized-2mb/.
- Original total size: 2,541,601,610 bytes (all discovered paths).
- Optimized output size: 923,059,774 bytes.
- Storage reduction against the local input set: 63.68%.
- Original source hashes: all 163 unique files matched their pre-encode hashes after processing.

## Validation results

All 509 outputs passed final checks:

- MP4 with H.264 video and AAC audio.
- 24 FPS.
- Duration no more than 10 seconds.
- Size no more than 2,000,000 bytes.
- SHA-256 matches the generated output manifest.
- Full decode passed when each clip was encoded or safely adopted.
- No unexpected black sections were detected.
- Three clips had an audio/video stream timing delta above 80 ms; all were within the 120 ms validation tolerance.
- No conversions failed. Four outputs created during an earlier interrupted benchmark pass were validated and reused without overwriting them.

## Size summary

| Measure | Result |
| --- | ---: |
| Optimized clips | 509 |
| Average clip size | 1,813,477 bytes (1.81 MB) |
| Average size normalized to 10 seconds | 1,943,288 bytes (1.94 MB) |
| Below 1 MB | 22 |
| 1 MB–1.5 MB | 10 |
| Over 1.5 MB–2 MB | 477 |
| Over 2 MB | 0 |

The 1.5 MB target was treated as an aim, not a quality constraint. The high-quality batch average is near the 2 MB ceiling because many dance and crowd scenes need more bits.

## Quality assessment

- Full batch encoding used H.264 CRF 18, slow preset, a 1,200 kbps video rate cap, AAC 96 kbps for stereo (64 kbps mono), 24 FPS, yuv420p, and fast-start MP4 metadata.
- VMAF average: 85.404; minimum: 26.267. 127 clips scored below 80 and are flagged for closer motion/detail review. VMAF is sensitive to frame alignment and motion, so a low score is a review flag, not proof by itself of unacceptable visible quality.
- Sample contact sheets were generated for all 509 clips and visually spot-checked across several pages. The sampled before/after frames retain scene content, faces, clothing colors, and framing. The sheets show one representative frame per clip, not a complete human review of every frame.
- A separate 1,000 kbps rate-cap trial produced approximately 1.43–1.48 MB on representative 10-second samples. VMAF scores were 87.995 (Humla), 95.294 (Tila), 90.460 (Video Project 4), and 98.090 (night scene), but 70.653 and 73.819 on two Shankar movement samples. This confirms that pushing all scenes to 1.5 MB can reduce motion-scene scores; the 1,200 kbps batch profile was retained for the high-quality set.

## Recommended future profile

Use the existing MP4 pipeline with:

- Fit within 854×480 landscape or 480×854 portrait; preserve aspect ratio, do not crop or upscale.
- 24 FPS, H.264 x264, CRF 18, slow preset, yuv420p, maxrate=1200k, bufsize=2400k.
- AAC 96 kbps stereo or 64 kbps mono.
- Fast-start MP4 metadata.
- Enforce 2,000,000 bytes and 10 seconds. If a high-motion clip exceeds the cap, try a 360p aspect-preserving fallback and inspect its quality; report it if quality is no longer acceptable. Keep simpler scenes nearer 1.5 MB where the visual check supports it.

A 1,000 kbps cap is a useful low-bandwidth option for simple scenes, but should not be forced on clips with fast dance movement.

## Artifacts

- Optimized copies: video-library/optimized-2mb/
- Full per-source/per-clip report, hashes, bitrates, metrics, and validation: optimization-report.json
- Before contact sheets (17 pages): before-contact-01.jpg through before-contact-17.jpg
- After contact sheets (17 pages): after-contact-01.jpg through after-contact-17.jpg

No production video was replaced. Nothing was uploaded to Supabase, and no database, frontend, upload-pipeline, PWA, Git, or deployment action was performed.
