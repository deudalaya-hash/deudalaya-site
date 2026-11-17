#!/usr/bin/env python3
"""Split complete source recordings into validated Deudalaya feed clips."""

from __future__ import annotations

import argparse
from fractions import Fraction
import hashlib
import json
import math
import os
import re
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


CATEGORIES = ("देउडा", "गाउँघर", "शहर", "अन्तरिक्ष")
VIDEO_EXTENSIONS = {".mp4", ".webm", ".mov", ".m4v", ".mkv", ".avi"}
SEGMENT_SECONDS = 10.0
MIN_REMAINDER_SECONDS = 5.0
DEFAULT_MAX_BYTES = 2_000_000
TARGET_VIDEO_BITRATE = "1250k"
MAX_VIDEO_BITRATE = "1600k"
BUFFER_SIZE = "3200k"


class PipelineError(RuntimeError):
    pass


def timestamp() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def run(command: list[str]) -> subprocess.CompletedProcess[str]:
    try:
        result = subprocess.run(command, text=True, capture_output=True, check=False)
    except FileNotFoundError as exc:
        raise PipelineError(f"Required program not found: {command[0]}") from exc
    if result.returncode:
        detail = (result.stderr or "").strip()[-1000:]
        raise PipelineError(f"Command failed ({result.returncode}): {detail}")
    return result


def probe(path: Path, ffprobe: str) -> dict[str, Any]:
    result = run([ffprobe, "-v", "error", "-show_streams", "-show_format", "-of", "json", str(path)])
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        raise PipelineError("ffprobe returned invalid JSON") from exc


def duration(info: dict[str, Any]) -> float:
    try:
        seconds = float(info.get("format", {}).get("duration"))
    except (TypeError, ValueError) as exc:
        raise PipelineError("Video duration is missing or unreadable") from exc
    if not math.isfinite(seconds) or seconds <= 0:
        raise PipelineError("Video duration is zero or invalid")
    return seconds


def plan_segments(source_duration: float) -> list[tuple[float, float]]:
    """Return (start, duration) pairs; only a final tail over five seconds survives."""
    if not math.isfinite(source_duration) or source_duration <= 0:
        raise PipelineError("Video duration is zero or invalid")
    segments: list[tuple[float, float]] = []
    start = 0.0
    remaining = source_duration
    while remaining >= SEGMENT_SECONDS - 0.02:
        length = min(SEGMENT_SECONDS, remaining)
        segments.append((round(start, 6), round(length, 6)))
        start += length
        remaining = max(0.0, source_duration - start)
    if remaining > MIN_REMAINDER_SECONDS:
        segments.append((round(start, 6), round(remaining, 6)))
    return segments


def validate_category(category: str) -> str:
    if category not in CATEGORIES:
        raise PipelineError(f"category must exactly match one of: {', '.join(CATEGORIES)}")
    return category


def prepare_output(input_dir: Path, output_dir: Path, resume: bool = False) -> Path:
    input_dir = input_dir.resolve()
    output_dir = output_dir.resolve()
    if output_dir == input_dir or input_dir in output_dir.parents:
        raise PipelineError("Output directory must be outside the source input directory")
    if output_dir.exists() and any(output_dir.iterdir()):
        existing = list(output_dir.iterdir())
        if not resume:
            raise PipelineError("Output directory must be empty; use --resume to validate existing batch outputs")
        if any(item.is_symlink() or not item.is_file() or not re.fullmatch(r".+-clip-\d{3}\.mp4(?:\.json)?", item.name) for item in existing):
            raise PipelineError("Resume directory contains an unexpected file; refusing to touch existing data")
        names = {item.name for item in existing}
        clips = {name for name in names if name.endswith(".mp4")}
        sidecars = {name[:-5] for name in names if name.endswith(".mp4.json")}
        if clips != sidecars:
            raise PipelineError("Resume directory has an incomplete MP4/sidecar pair")
    output_dir.mkdir(parents=True, exist_ok=True)
    backup_dir = output_dir.parent / "backup"
    backup_dir.mkdir(parents=True, exist_ok=True)
    return backup_dir


def stream_of(info: dict[str, Any], kind: str) -> dict[str, Any] | None:
    return next((stream for stream in info.get("streams", []) if stream.get("codec_type") == kind), None)


def aspect(stream: dict[str, Any]) -> float:
    try:
        return int(stream["width"]) / int(stream["height"])
    except (KeyError, TypeError, ValueError, ZeroDivisionError) as exc:
        raise PipelineError("Video dimensions are missing or invalid") from exc


def safe_stem(path: Path) -> str:
    value = re.sub(r"[^A-Za-z0-9._-]+", "_", path.stem).strip("._-")
    return (value or "video")[:48]


def caption_for(source: Path, clip_number: int) -> str:
    return f"{source.stem} · क्लिप {clip_number:03d}"[:220]


def write_json(path: Path, value: Any) -> None:
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(path)


def encode_clip(source: Path, output: Path, start: float, length: float,
                source_info: dict[str, Any], ffmpeg: str, ffprobe: str, max_bytes: int) -> dict[str, Any]:
    source_video = stream_of(source_info, "video")
    source_audio = stream_of(source_info, "audio")
    if not source_video:
        raise PipelineError("No video stream found")
    if not source_audio:
        raise PipelineError("Source has no audio stream; upload-only publisher requires AAC audio")
    try:
        source_fps = float(Fraction(source_video.get("avg_frame_rate", "30/1")))
    except (TypeError, ValueError, ZeroDivisionError):
        source_fps = 30.0
    fps = min(source_fps, 30.0) if math.isfinite(source_fps) and source_fps > 0 else 30.0
    video_filter = (
        f"fps={fps:.6f},"
        "scale=w=720:h=720:force_original_aspect_ratio=decrease:force_divisible_by=2"
    )
    encode_length = max(0.1, length - 0.04)
    command = [
        ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-ss", f"{start:.6f}",
        "-i", str(source), "-t", f"{encode_length:.6f}", "-map", "0:v:0", "-map", "0:a:0",
        "-vf", video_filter, "-fps_mode", "cfr", "-c:v", "libx264", "-preset", "slow",
        "-profile:v", "main", "-b:v", TARGET_VIDEO_BITRATE, "-maxrate", MAX_VIDEO_BITRATE,
        "-bufsize", BUFFER_SIZE, "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k",
        "-ar", "48000", "-af", f"aresample=async=1:first_pts=0,atrim=duration={encode_length:.6f},asetpts=PTS-STARTPTS",
        "-avoid_negative_ts", "make_zero", "-movflags", "+faststart", str(output),
    ]
    run(command)
    return validate_output(output, length, source_video, ffmpeg, ffprobe, max_bytes)


def validate_output(output: Path, expected_duration: float, source_video: dict[str, Any],
                    ffmpeg: str, ffprobe: str, max_bytes: int) -> dict[str, Any]:
    size = output.stat().st_size if output.is_file() else 0
    if size <= 0 or size > max_bytes:
        raise PipelineError(f"Encoded clip is {size:,} bytes; configured maximum is {max_bytes:,}")
    info = probe(output, ffprobe)
    video, audio = stream_of(info, "video"), stream_of(info, "audio")
    seconds = duration(info)
    formats = str(info.get("format", {}).get("format_name", "")).split(",")
    if "mp4" not in formats or not video or video.get("codec_name") != "h264":
        raise PipelineError("Output is not an MP4/H.264 video")
    if not audio or audio.get("codec_name") != "aac":
        raise PipelineError("Output does not contain AAC audio")
    if abs(seconds - expected_duration) > 0.12:
        raise PipelineError(f"Output duration {seconds:.3f}s differs from expected {expected_duration:.3f}s")
    if seconds > SEGMENT_SECONDS:
        raise PipelineError(f"Output duration {seconds:.3f}s exceeds the strict 10-second maximum")
    if abs(aspect(source_video) - aspect(video)) / aspect(source_video) > 0.015:
        raise PipelineError("Output aspect ratio differs from source")
    video_seconds = float(video.get("duration") or seconds)
    audio_seconds = float(audio.get("duration") or seconds)
    if abs(video_seconds - audio_seconds) > 0.2:
        raise PipelineError("Audio and video durations are out of sync")
    run([ffmpeg, "-hide_banner", "-v", "error", "-i", str(output), "-f", "null", os.devnull])
    return {
        "valid": True,
        "bytes": size,
        "duration_seconds": seconds,
        "video_codec": video["codec_name"],
        "audio_codec": audio["codec_name"],
        "width": video.get("width"),
        "height": video.get("height"),
        "fps": video.get("avg_frame_rate"),
        "aspect_ratio": aspect(video),
        "full_decode": "passed",
        "audio_video_sync": "passed",
    }


def process_source(source: Path, output_dir: Path, backup_dir: Path, category: str,
                   ffmpeg: str, ffprobe: str, max_bytes: int,
                   seen_clips: dict[str, str]) -> dict[str, Any]:
    original_hash = sha256_file(source)
    source_info = probe(source, ffprobe)
    source_video = stream_of(source_info, "video")
    if not source_video:
        raise PipelineError("No video stream found")
    source_duration = duration(source_info)
    backup = backup_dir / f"{original_hash}{source.suffix.lower()}"
    if backup.exists():
        if sha256_file(backup) != original_hash:
            raise PipelineError(f"Backup checksum mismatch: {backup.name}")
    else:
        shutil.copy2(source, backup)
        if sha256_file(backup) != original_hash:
            raise PipelineError("Source backup checksum mismatch")
    segments = plan_segments(source_duration)
    source_record: dict[str, Any] = {
        "source": str(source), "source_filename": source.name, "source_sha256": original_hash,
        "source_bytes": source.stat().st_size, "source_duration_seconds": source_duration,
        "source_video_codec": source_video.get("codec_name"),
        "source_audio_codec": (stream_of(source_info, "audio") or {}).get("codec_name"),
        "source_resolution": [source_video.get("width"), source_video.get("height")],
        "backup": str(backup), "expected_clips": len(segments), "clips": [], "errors": [],
    }
    for index, (start, length) in enumerate(segments, start=1):
        stem = safe_stem(source)
        output = output_dir / f"{stem}-{original_hash[:10]}-clip-{index:03d}.mp4"
        sidecar = output.with_name(output.name + ".json")
        clip: dict[str, Any] = {
            "clip_number": index, "start_seconds": start, "expected_duration_seconds": length,
            "output": str(output), "category": category, "caption": caption_for(source, index),
        }
        reusing_existing = output.exists() or sidecar.exists()
        try:
            if reusing_existing:
                if not output.is_file() or not sidecar.is_file():
                    raise PipelineError("Existing output or sidecar is incomplete; refusing to overwrite")
                sidecar_metadata = json.loads(sidecar.read_text(encoding="utf-8"))
                if sidecar_metadata.get("category") != category:
                    raise PipelineError("Existing output sidecar category does not match this batch")
                validation = validate_output(output, length, source_video, ffmpeg, ffprobe, max_bytes)
                clip["resumed_existing_output"] = True
            else:
                validation = encode_clip(source, output, start, length, source_info, ffmpeg, ffprobe, max_bytes)
            clip["validation"] = validation
            clip["sha256"] = sha256_file(output)
            if clip["sha256"] in seen_clips:
                clip["status"] = "duplicate_content"
                clip["duplicate_of"] = seen_clips[clip["sha256"]]
            else:
                clip["status"] = "validated"
                seen_clips[clip["sha256"]] = str(output)
            sidecar.write_text(json.dumps({"category": category, "caption": clip["caption"]}, ensure_ascii=False) + "\n", encoding="utf-8")
        except Exception as exc:
            if output.exists() and not reusing_existing:
                output.unlink()
            clip["status"] = "failed"
            clip["error"] = str(exc)[:1200]
            source_record["errors"].append(f"Clip {index:03d}: {clip['error']}")
        source_record["clips"].append(clip)
    source_record["source_unchanged"] = sha256_file(source) == original_hash
    source_record["status"] = "success" if not source_record["errors"] and source_record["source_unchanged"] else "partial_or_failed"
    if not source_record["source_unchanged"]:
        source_record["errors"].append("Original source SHA-256 changed during processing")
    return source_record


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Split full recordings into validated 10-second Deudalaya MP4 feed clips.")
    parser.add_argument("--input", type=Path, required=True, help="Directory containing original recordings")
    parser.add_argument("--output", type=Path, required=True, help="New or empty directory for processed clips and sidecars")
    parser.add_argument("--category", choices=CATEGORIES, required=True)
    parser.add_argument("--ffmpeg", default=shutil.which("ffmpeg") or "ffmpeg")
    parser.add_argument("--ffprobe", default=shutil.which("ffprobe") or "ffprobe")
    parser.add_argument("--max-bytes", type=int, default=DEFAULT_MAX_BYTES)
    parser.add_argument("--resume", action="store_true", help="Validate and reuse matching outputs in a prior incomplete run")
    args = parser.parse_args(argv)
    report_path: Path | None = None
    try:
        if args.max_bytes <= 0:
            raise PipelineError("--max-bytes must be positive")
        category = validate_category(args.category)
        input_dir = args.input.expanduser().resolve()
        if not input_dir.is_dir():
            raise PipelineError(f"Input directory does not exist: {input_dir}")
        sources = sorted(
            (item for item in input_dir.iterdir() if item.is_file() and not item.is_symlink() and item.suffix.lower() in VIDEO_EXTENSIONS),
            key=lambda item: item.name.casefold(),
        )
        if not sources:
            raise PipelineError("No supported source videos were found")
        output_dir = args.output.expanduser().resolve()
        backup_dir = prepare_output(input_dir, output_dir, args.resume)
        report_path = output_dir.parent / "processing-report.json"
        report: dict[str, Any] = {
            "started_at": timestamp(), "input_directory": str(input_dir), "processed_directory": str(output_dir),
            "backup_directory": str(backup_dir), "category": category,
            "encoding": {"video": "H.264, max dimension 720, source FPS capped at 30", "target_video_bitrate": TARGET_VIDEO_BITRATE,
                         "max_video_bitrate": MAX_VIDEO_BITRATE, "audio": "AAC 128 kbps", "container": "MP4 faststart",
                         "maximum_bytes": args.max_bytes},
            "totals": {"sources": len(sources), "generated": 0, "validated": 0, "duplicate_clips": 0,
                       "failed_clips": 0, "discarded_remainders": 0, "duplicate_source_files": 0},
            "sources": [], "errors": [],
        }
        seen_sources: dict[str, str] = {}
        seen_clips: dict[str, str] = {}
        for source in sources:
            source_hash = sha256_file(source)
            if source_hash in seen_sources:
                report["totals"]["duplicate_source_files"] += 1
                report["sources"].append({
                    "source": str(source), "source_filename": source.name, "source_sha256": source_hash,
                    "status": "duplicate_source", "duplicate_of": seen_sources[source_hash], "clips": [], "errors": [],
                })
                continue
            seen_sources[source_hash] = str(source)
            try:
                result = process_source(source, output_dir, backup_dir, category, args.ffmpeg, args.ffprobe, args.max_bytes, seen_clips)
                report["totals"]["generated"] += len(result["clips"])
                report["totals"]["validated"] += sum(clip.get("status") == "validated" for clip in result["clips"])
                report["totals"]["duplicate_clips"] += sum(clip.get("status") == "duplicate_content" for clip in result["clips"])
                report["totals"]["failed_clips"] += sum(clip.get("status") == "failed" for clip in result["clips"])
                source_remainder = duration(probe(source, args.ffprobe)) % SEGMENT_SECONDS
                if 0 < source_remainder <= MIN_REMAINDER_SECONDS:
                    report["totals"]["discarded_remainders"] += 1
                report["sources"].append(result)
            except Exception as exc:
                report["sources"].append({
                    "source": str(source), "source_filename": source.name, "source_sha256": source_hash,
                    "status": "failed", "clips": [], "errors": [str(exc)[:1200]],
                })
                report["totals"]["failed_clips"] += 1
            write_json(report_path, report)
        report["finished_at"] = timestamp()
        write_json(report_path, report)
        print(json.dumps({"report": str(report_path), "totals": report["totals"]}, ensure_ascii=False))
        return 0 if report["totals"]["failed_clips"] == 0 else 1
    except Exception as exc:
        print(f"Processing failed: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
