# Deudalaya optimized video quality review

Review date: 2026-11-15  
Benchmark run: `optimization-2mb-20261115T200947`

## Findings

- Reviewed all **127 outputs with numeric VMAF below 80**. Four frames per clip were inspected at 5%, 35%, 65%, and 95% of duration (**508 frames total**), arranged in 13 motion sheets.
- **0 confirmed visible encoder-induced quality problems** were identified from the sampled motion sequences. Faces, clothing patterns, body movement, and scene detail remained discernible in the reviewed frames. Some clips show source-like movement blur, long-distance subjects, or strong backlighting; the available evidence does not show those were introduced by this encode.
- **127 clips remain VMAF-only/unconfirmed flags**: their sampled frames did not show a corresponding obvious visual defect. The lowest-scoring clip (VMAF 26.27, `demo/input/…_clip-078.mp4`) was also played in VLC; the moving people and event details remained visible and playback advanced normally. The low score’s precise cause is not proven; high motion, frame-rate conversion, temporal alignment, or source capture quality may contribute. A synchronized source/output A/B was not completed.
- **0 clips improved** and **0 review/improved video copies created**, because this review did not confirm a defect that justified a new encode. No existing optimized clip was overwritten.
- **0 clips are confirmed unable to meet both quality and size requirements.** All 509 existing outputs already pass the report’s 2,000,000-byte and 10-second limits. Their encoded settings are H.264/AAC at 24 FPS; flagged clips are 1,041,376–1,999,904 bytes.
- Audio tracks on the 127 flags are AAC stereo at about 96 kb/s (observed range 94.3–96.2 kb/s). Full decode validation passed. The run records three recorded A/V-sync warnings across all outputs (approximately 85 ms and two at approximately 91 ms); one falls within this 127-clip flagged set. I could not perform subjective listening tests for every clip, so audio clarity is supported by codec/bitrate/decode metadata rather than a full listening pass.

## Lowest VMAF samples

| Review row | Clip | VMAF | Existing size | Visual/playback review |
|---:|---|---:|---:|---|
| 54 | Shankar source clip 078 | 26.27 | 1,733,320 B | Played in VLC; movement and people were visible, no obvious block corruption |
| 56 | Shankar source clip 080 | 33.41 | 1,984,823 B | Four motion samples; no distinct compression defect identified |
| 116 | Shankar source clip 161 | 33.55 | 1,800,922 B | Four motion samples; no distinct compression defect identified |
| 40 | Shankar source clip 055 | 33.62 | 1,999,904 B | Four motion samples; no distinct compression defect identified |
| 72 | Shankar source clip 103 | 33.81 | 1,992,087 B | Four motion samples; no distinct compression defect identified |

## Reconciliation: 509 outputs from 163 unique sources

The report has 168 source paths but 163 unique source hashes. Five duplicate source entries were recognized by SHA-256 and treated as aliases, not separate source recordings. All 509 output SHA-256 values are unique; **no duplicate output clips** were found.

| Source group | Unique recordings | Optimized clips |
|---|---:|---:|
| Shankar Malla/Bipana Singh gathering recording | 1 | 181 |
| Tila recording | 1 | 69 |
| Humla recording | 1 | 53 |
| Video Project 4 | 1 | 7 |
| Other local/site/demo source files | 159 | 199 |
| **Total** | **163** | **509** |

The 181/69/53/7 counts are consecutive segments mapped to their canonical source recording, not separate original videos.

## Integrity and artifacts

The benchmark’s original-hash verification checked 163 unique sources and passed with no changed or missing source. Existing optimized outputs passed the stored per-file SHA, size, duration, codec, frame-rate, and full-decode validation.

- Clip list and per-clip metadata: [review-index.csv](review-index.csv)
- Review index with source mappings: [review-index.json](review-index.json)
- Four-frame-per-clip sheets: [motion-review-01.jpg](motion-review-01.jpg) through [motion-review-13.jpg](motion-review-13.jpg)
- Benchmark: [optimization-report.json](../optimization-report.json)

### Review limits

Frame sheets were assembled at reduced size for efficient review, then the lowest-score clip was checked in full VLC playback. The current finding is therefore “no defect confirmed in this review,” not a claim that every source/output frame is identical. No subjective audio pass was performed for every flagged clip. No uploads, database operations, application changes, or modifications to original/optimized video files were made.