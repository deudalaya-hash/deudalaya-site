#!/usr/bin/env python3
"""Batch transcode Deudalaya videos and, only by explicit opt-in, publish them."""

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
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

EXPECTED_PROJECT_REF = "bxzkclqanpuvxyhsrpog"
EXPECTED_URL = f"https://{EXPECTED_PROJECT_REF}.supabase.co"
BUCKET = "videos"
MAX_BYTES = 4_000_000
TARGET_SECONDS = 10.0
CATEGORIES = ("देउडा", "गाउँघर", "शहर")
VIDEO_EXTENSIONS = {".mp4", ".webm", ".mov", ".m4v", ".mkv", ".avi"}
RESOLUTIONS = (1280, 960, 720, 540)
CRFS = tuple(range(18, 35, 2))
SUPABASE_ENV_NAMES = ("SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "SUPABASE_ADMIN_JWT")


class PipelineError(RuntimeError):
    pass


class ApiError(PipelineError):
    def __init__(self, status: int, message: str):
        super().__init__(f"HTTP {status}: {message[:600]}")
        self.status = status


def timestamp() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def load_local_env(env_file: Path | None = None) -> set[str]:
    """Load only supported Supabase variables; never evaluate or print file contents."""
    if env_file is None:
        env_file = Path(__file__).resolve().parents[4] / ".env.local"
    loaded: set[str] = set()
    try:
        lines = env_file.read_text(encoding="utf-8-sig").splitlines()
    except FileNotFoundError:
        return loaded
    except (OSError, UnicodeError) as exc:
        raise PipelineError(f"Cannot read local environment file ({exc.__class__.__name__})") from exc

    allowed = set(SUPABASE_ENV_NAMES)
    for line_number, raw_line in enumerate(lines, start=1):
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[7:].lstrip()
        name, separator, value = line.partition("=")
        name = name.strip()
        if not separator or name not in allowed:
            continue
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in ("'", '"'):
            value = value[1:-1]
        elif " #" in value:
            value = value.split(" #", 1)[0].rstrip()
        if "\n" in value or "\r" in value:
            raise PipelineError(f"Invalid value format in .env.local on line {line_number}")
        if not os.environ.get(name) and value:
            os.environ[name] = value
            loaded.add(name)
    return loaded


def config_status() -> tuple[list[str], list[str], list[str]]:
    configured = [name for name in SUPABASE_ENV_NAMES if os.environ.get(name)]
    missing = [name for name in SUPABASE_ENV_NAMES if not os.environ.get(name)]
    invalid = []
    if os.environ.get("SUPABASE_URL") and os.environ["SUPABASE_URL"].rstrip("/") != EXPECTED_URL:
        invalid.append("SUPABASE_URL")
    return configured, missing, invalid


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def run(command: list[str]) -> subprocess.CompletedProcess[str]:
    child_env = {key: value for key, value in os.environ.items() if key not in SUPABASE_ENV_NAMES}
    try:
        result = subprocess.run(command, text=True, capture_output=True, check=False, env=child_env)
    except FileNotFoundError as exc:
        raise PipelineError(f"Required program not found: {command[0]}") from exc
    if result.returncode:
        detail = (result.stderr or "").strip()[-1200:]
        raise PipelineError(f"Command failed ({result.returncode}): {detail}")
    return result


def probe(path: Path, ffprobe: str) -> dict[str, Any]:
    result = run([ffprobe, "-v", "error", "-show_streams", "-show_format", "-of", "json", str(path)])
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        raise PipelineError("ffprobe returned invalid JSON") from exc


def video_stream(info: dict[str, Any]) -> dict[str, Any]:
    streams = [stream for stream in info.get("streams", []) if stream.get("codec_type") == "video"]
    if not streams:
        raise PipelineError("No video stream found")
    return streams[0]


def duration(info: dict[str, Any]) -> float:
    raw = info.get("format", {}).get("duration") or video_stream(info).get("duration")
    try:
        value = float(raw)
    except (ValueError, TypeError) as exc:
        raise PipelineError("Video duration is missing or unreadable") from exc
    if not math.isfinite(value) or value <= 0:
        raise PipelineError("Video duration is zero or invalid")
    return value


def aspect_ratio(stream: dict[str, Any]) -> float:
    try:
        width, height = int(stream["width"]), int(stream["height"])
    except (KeyError, ValueError, TypeError) as exc:
        raise PipelineError("Video dimensions are missing or invalid") from exc
    if width < 1 or height < 1:
        raise PipelineError("Video dimensions must be nonzero")
    rotation = 0.0
    for side_data in stream.get("side_data_list", []):
        if side_data.get("rotation") is not None:
            rotation = float(side_data["rotation"])
            break
    if stream.get("tags", {}).get("rotate") is not None:
        rotation = float(stream["tags"]["rotate"])
    if round(rotation) % 180:
        width, height = height, width
    return width / height


def metadata_for(source: Path) -> dict[str, str]:
    sidecar = source.with_name(source.name + ".json")
    if not sidecar.is_file():
        raise PipelineError(f"Missing metadata sidecar {sidecar.name}; add category and optional caption")
    try:
        value = json.loads(sidecar.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise PipelineError(f"Cannot read metadata sidecar: {exc}") from exc
    if not isinstance(value, dict) or value.get("category") not in CATEGORIES:
        raise PipelineError(f"category must exactly match one of: {', '.join(CATEGORIES)}")
    caption = str(value.get("caption") or source.stem).strip()
    if not caption:
        caption = source.stem
    if len(caption) > 220:
        raise PipelineError("caption exceeds the feed's 220-character limit")
    return {"category": value["category"], "caption": caption}


def backup_source(source: Path, destination: Path, digest: str) -> Path:
    destination.mkdir(parents=True, exist_ok=True)
    backup = destination / f"{digest}{source.suffix.lower()}"
    if backup.exists():
        if backup.stat().st_size != source.stat().st_size or sha256_file(backup) != digest:
            raise PipelineError(f"Backup collision with different content: {backup}")
        return backup
    shutil.copy2(source, backup)
    if sha256_file(backup) != digest:
        raise PipelineError("Backup checksum does not match the original")
    return backup


def encode_once(source: Path, output: Path, info: dict[str, Any], ffmpeg: str, max_side: int, crf: int) -> None:
    source_duration = duration(info)
    if source_duration < TARGET_SECONDS - 0.05:
        raise PipelineError(f"Source is only {source_duration:.3f}s; at least 9.95s is required to cut an exact 10-second clip")
    source_video = video_stream(info)
    max_width = min(int(source_video["width"]), max_side)
    max_height = min(int(source_video["height"]), max_side)
    try:
        source_fps = float(Fraction(source_video.get("avg_frame_rate", "30/1")))
    except (ValueError, ZeroDivisionError):
        source_fps = 30.0
    output_fps = min(source_fps, 30.0) if math.isfinite(source_fps) and source_fps > 0 else 30.0
    video_filter = (
        f"fps={output_fps:.6f},"
        f"scale=w={max_width}:h={max_height}:force_original_aspect_ratio=decrease:force_divisible_by=2,"
        "trim=duration=10,setpts=PTS-STARTPTS"
    )
    command = [
        ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-i", str(source),
        "-map", "0:v:0", "-vf", video_filter, "-fps_mode", "cfr",
        "-c:v", "libx264", "-preset", "slow", "-crf", str(crf), "-pix_fmt", "yuv420p",
        "-t", "10", "-movflags", "+faststart",
    ]
    has_audio = any(stream.get("codec_type") == "audio" for stream in info.get("streams", []))
    if has_audio:
        command += [
            "-map", "0:a:0?", "-af", "aresample=async=1:first_pts=0,atrim=duration=10,asetpts=PTS-STARTPTS",
            "-c:a", "aac", "-b:a", "96k", "-ar", "48000",
        ]
    else:
        command += ["-an"]
    command.append(str(output))
    run(command)


def validate(source_info: dict[str, Any], output: Path, ffmpeg: str, ffprobe: str) -> dict[str, Any]:
    byte_size = output.stat().st_size if output.is_file() else 0
    if byte_size <= 0 or byte_size >= MAX_BYTES:
        raise PipelineError(f"Output is {byte_size:,} bytes; it must be strictly below {MAX_BYTES:,}")
    output_info = probe(output, ffprobe)
    stream = video_stream(output_info)
    seconds = duration(output_info)
    if abs(seconds - TARGET_SECONDS) > 0.05:
        raise PipelineError(f"Output duration {seconds:.3f}s is not exactly 10 seconds")
    formats = str(output_info.get("format", {}).get("format_name", "")).split(",")
    if "mp4" not in formats:
        raise PipelineError(f"Output container is not MP4: {formats}")
    if stream.get("codec_name") != "h264":
        raise PipelineError("Output video codec is not H.264")
    source_audio = any(s.get("codec_type") == "audio" for s in source_info.get("streams", []))
    audio = [s for s in output_info.get("streams", []) if s.get("codec_type") == "audio"]
    if source_audio and (not audio or audio[0].get("codec_name") != "aac"):
        raise PipelineError("AAC audio is missing from output that had source audio")
    if not source_audio and audio:
        raise PipelineError("Unexpected audio stream in output")
    source_ratio, output_ratio = aspect_ratio(video_stream(source_info)), aspect_ratio(stream)
    if abs(source_ratio - output_ratio) / source_ratio > 0.01:
        raise PipelineError(f"Aspect ratio changed from {source_ratio:.5f} to {output_ratio:.5f}")
    run([ffmpeg, "-hide_banner", "-v", "error", "-i", str(output), "-f", "null", os.devnull])
    return {
        "valid": True, "bytes": byte_size, "duration_seconds": seconds, "container": formats,
        "video_codec": stream.get("codec_name"), "audio_codec": audio[0].get("codec_name") if audio else None,
        "width": stream.get("width"), "height": stream.get("height"), "aspect_ratio": output_ratio,
        "full_decode": "passed",
    }


def encode(source: Path, output: Path, ffmpeg: str, ffprobe: str) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
    source_info = probe(source, ffprobe)
    source_video = video_stream(source_info)
    source_duration = duration(source_info)
    if source_duration < TARGET_SECONDS - 0.05:
        raise PipelineError(f"Source is only {source_duration:.3f}s; cannot cut it to 10 seconds without inventing frames")
    original = {
        "sha256": sha256_file(source), "bytes": source.stat().st_size, "duration_seconds": source_duration,
        "container": source_info.get("format", {}).get("format_name"), "video_codec": source_video.get("codec_name"),
        "audio_codec": next((s.get("codec_name") for s in source_info.get("streams", []) if s.get("codec_type") == "audio"), None),
        "width": source_video.get("width"), "height": source_video.get("height"),
    }
    attempts: list[dict[str, Any]] = []
    output.parent.mkdir(parents=True, exist_ok=True)
    for crf in CRFS:
        for max_side in RESOLUTIONS:
            try:
                encode_once(source, output, source_info, ffmpeg, max_side, crf)
                size = output.stat().st_size
                if size >= MAX_BYTES:
                    attempts.append({"max_dimension": max_side, "crf": crf, "bytes": size, "result": "over_limit"})
                    output.unlink()
                    continue
                checked = validate(source_info, output, ffmpeg, ffprobe)
                return original, checked, {"max_dimension": max_side, "crf": crf, "attempts": attempts}
            except Exception:
                if output.exists():
                    output.unlink()
                raise
    raise PipelineError(f"No encode passed the strict {MAX_BYTES:,}-byte limit; attempts: {attempts}")


def write_report(path: Path, report: dict[str, Any]) -> None:
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(path)


def request(method: str, url: str, key: str, token: str, body: bytes | None = None,
            headers: dict[str, str] | None = None, public: bool = False) -> tuple[int, dict[str, str], bytes]:
    request_headers = {"apikey": key, "Accept": "application/json"}
    if not public:
        request_headers["Authorization"] = f"Bearer {token}"
    request_headers.update(headers or {})
    req = urllib.request.Request(url, data=body, headers=request_headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=45) as response:
            return response.status, dict(response.headers.items()), response.read()
    except urllib.error.HTTPError as exc:
        return exc.code, dict(exc.headers.items()), exc.read()
    except (urllib.error.URLError, TimeoutError) as exc:
        raise PipelineError(f"Supabase request failed: {exc}") from exc


def json_request(*args: Any, **kwargs: Any) -> tuple[int, dict[str, str], Any]:
    status, headers, raw = request(*args, **kwargs)
    try:
        value = json.loads(raw.decode("utf-8")) if raw else None
    except (UnicodeDecodeError, json.JSONDecodeError):
        value = raw.decode("utf-8", errors="replace")
    return status, headers, value


def ensure_success(status: int, body: Any, action: str) -> Any:
    if 200 <= status < 300:
        return body
    message = json.dumps(body, ensure_ascii=False) if isinstance(body, (dict, list)) else str(body or "request failed")
    raise ApiError(status, f"{action}: {message}")


class SupabasePublisher:
    def __init__(self) -> None:
        self.url = os.environ.get("SUPABASE_URL", "").rstrip("/")
        self.key = os.environ.get("SUPABASE_PUBLISHABLE_KEY", "")
        self.token = os.environ.get("SUPABASE_ADMIN_JWT", "")
        if self.url != EXPECTED_URL:
            raise PipelineError(f"SUPABASE_URL must target the inspected project {EXPECTED_PROJECT_REF}")
        if not self.key or not self.token:
            raise PipelineError("Set SUPABASE_PUBLISHABLE_KEY and SUPABASE_ADMIN_JWT locally; never paste tokens into chat")
        status, _, user = json_request("GET", f"{self.url}/auth/v1/user", self.key, self.token)
        ensure_success(status, user, "Could not validate Supabase session")
        if not isinstance(user, dict) or user.get("app_metadata", {}).get("role") != "admin":
            raise PipelineError("The authenticated account lacks trusted app_metadata.role=admin")
        self.user_id = str(user.get("id", ""))
        if not re.fullmatch(r"[0-9a-fA-F-]{36}", self.user_id):
            raise PipelineError("Supabase returned an invalid user ID")
        self.fields = self.inspect_schema()
        self.bucket_limit = self.inspect_bucket()

    def rest(self, method: str, route: str, payload: Any = None) -> tuple[int, Any]:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8") if payload is not None else None
        headers = {"Content-Type": "application/json", "Prefer": "return=representation"} if body else {}
        status, _, value = json_request(method, f"{self.url}/rest/v1/{route}", self.key, self.token, body, headers)
        return status, value

    def inspect_schema(self) -> set[str]:
        found: set[str] = set()
        required = {"user_id", "media_path", "media_type", "caption"}
        optional = {"id", "category", "feed_category"}
        for field in required | optional:
            query = urllib.parse.urlencode({"select": field, "limit": "0"})
            status, body = self.rest("GET", f"feed_posts?{query}")
            if 200 <= status < 300:
                found.add(field)
                continue
            detail = json.dumps(body, ensure_ascii=False).lower()
            missing = status == 400 and any(term in detail for term in ("does not exist", "schema cache", "could not find"))
            if field in optional and missing:
                continue
            ensure_success(status, body, f"Could not inspect public.feed_posts.{field}")
        if not (found & {"category", "feed_category"}):
            raise PipelineError("public.feed_posts has neither category nor feed_category")
        return found

    def inspect_bucket(self) -> int | None:
        status, _, bucket = json_request("GET", f"{self.url}/storage/v1/bucket/{BUCKET}", self.key, self.token)
        ensure_success(status, bucket, f"Could not inspect {BUCKET} bucket")
        if not isinstance(bucket, dict) or bucket.get("public") is not True:
            raise PipelineError("The existing videos bucket is not confirmed public")
        allowed = bucket.get("allowed_mime_types")
        if allowed and "video/mp4" not in allowed and "video/*" not in allowed:
            raise PipelineError("The videos bucket does not allow video/mp4")
        limit = bucket.get("file_size_limit")
        try:
            return int(limit) if limit not in (None, 0, "0") else None
        except (ValueError, TypeError) as exc:
            raise PipelineError("The videos bucket returned an invalid size limit") from exc

    def object_url(self, object_path: str) -> str:
        return f"{self.url}/storage/v1/object/public/{BUCKET}/{urllib.parse.quote(object_path, safe='/')}"

    def verify_object(self, object_path: str, expected_hash: str) -> bool:
        status, _, raw = request("GET", self.object_url(object_path), self.key, self.token, public=True)
        if status == 404:
            return False
        if not 200 <= status < 300:
            raise ApiError(status, "Could not verify existing Storage object")
        if hashlib.sha256(raw).hexdigest() != expected_hash:
            raise PipelineError("Object at deterministic path has different bytes; no overwrite attempted")
        return True

    def rows(self, object_path: str) -> list[dict[str, Any]]:
        fields = [name for name in ("id", "user_id", "media_path", "media_type", "caption", "category", "feed_category") if name in self.fields]
        query = urllib.parse.urlencode({"select": ",".join(fields), "media_path": f"eq.{object_path}", "limit": "2"})
        status, body = self.rest("GET", f"feed_posts?{query}")
        value = ensure_success(status, body, "Could not check duplicate feed rows")
        return value if isinstance(value, list) else []

    def upload_object(self, output: Path, object_path: str, digest: str) -> tuple[bool, bool]:
        if self.bucket_limit is not None and output.stat().st_size > self.bucket_limit:
            raise PipelineError(f"Output exceeds the live bucket limit ({self.bucket_limit:,} bytes)")
        url = f"{self.url}/storage/v1/object/{BUCKET}/{urllib.parse.quote(object_path, safe='/')}"
        status, _, raw = request(
            "POST", url, self.key, self.token, output.read_bytes(),
            {"Content-Type": "video/mp4", "Cache-Control": "max-age=3600", "x-upsert": "false"},
        )
        if 200 <= status < 300:
            return True, False
        message = raw.decode("utf-8", errors="replace")
        if status in (400, 409) and ("exist" in message.lower() or "duplicate" in message.lower()):
            if self.verify_object(object_path, digest):
                return False, True
        raise ApiError(status, f"Storage upload failed: {message}")

    def publish(self, output: Path, metadata: dict[str, str], digest: str) -> dict[str, Any]:
        object_path = f"{self.user_id}/{digest}.mp4"
        existing = self.rows(object_path)
        if existing:
            row = existing[0]
            row_category = row.get("feed_category") or row.get("category")
            if row.get("user_id") != self.user_id or row_category != metadata["category"] or row.get("caption") != metadata["caption"]:
                raise PipelineError("A feed row already uses this path with different metadata; no changes made")
            if not self.verify_object(object_path, digest):
                raise PipelineError("Matching feed row exists but its Storage object is missing")
            return {"status": "duplicate", "object_path": object_path, "row_id": row.get("id"), "storage_uploaded": False}

        uploaded, reused = self.upload_object(output, object_path, digest)
        record = {"user_id": self.user_id, "media_path": object_path, "media_type": "video/mp4", "caption": metadata["caption"]}
        if "category" in self.fields:
            record["category"] = metadata["category"]
        if "feed_category" in self.fields:
            record["feed_category"] = metadata["category"]
        status, response = self.rest("POST", "feed_posts", record)
        ensure_success(status, response, "Storage object exists but feed_posts insert failed")
        inserted = response[0] if isinstance(response, list) and response else {}
        rows = self.rows(object_path)
        if not rows:
            raise PipelineError("Insert succeeded but read-back verification found no feed row")
        verified = next((row for row in rows if row.get("user_id") == self.user_id), None)
        if not verified:
            raise PipelineError("Insert read-back does not belong to the authenticated admin")
        for field in ("media_path", "media_type", "caption"):
            expected = {"media_path": object_path, "media_type": "video/mp4", "caption": metadata["caption"]}[field]
            if verified.get(field) != expected:
                raise PipelineError(f"Insert read-back has unexpected {field}")
        row_category = verified.get("feed_category") or verified.get("category")
        if row_category != metadata["category"]:
            raise PipelineError("Insert read-back has unexpected category")
        return {
            "status": "uploaded", "object_path": object_path, "row_id": inserted.get("id") or verified.get("id"),
            "storage_uploaded": uploaded, "storage_reused_after_hash_check": reused,
        }


def parse_args() -> argparse.Namespace:
    root = Path.home() / "DeudalayaVideoPipeline"
    parser = argparse.ArgumentParser(description="Cut input videos to 10 seconds, validate under 4 MB, and optionally publish.")
    parser.add_argument("--input", type=Path, default=root / "inbox", help="Input folder with raw videos and <filename>.json sidecars")
    parser.add_argument("--runs", type=Path, default=root / "runs", help="Batch output/report/backup parent folder")
    parser.add_argument("--publish", action="store_true", help="Opt in to upload validated files and insert feed rows")
    parser.add_argument("--check-config", action="store_true", help="Report whether publishing variables are present without displaying values")
    parser.add_argument("--confirm-publish", help="Must equal DEUDALAYA when --publish is set")
    parser.add_argument("--confirm-rights", action="store_true", help="Confirm that rights or permission allow uploading every item in this batch")
    return parser.parse_args()


def process_one(source: Path, batch: Path, ffmpeg: str, ffprobe: str) -> dict[str, Any]:
    item: dict[str, Any] = {"input": str(source), "status": "failed", "started_at": timestamp(), "validation": {"valid": False}, "upload": {"status": "not_attempted"}, "errors": []}
    metadata: dict[str, str] | None = None
    try:
        metadata = metadata_for(source)
        item["metadata"] = metadata
    except Exception as exc:
        item["errors"].append(str(exc))
        item["metadata"] = None
    try:
        source_hash = sha256_file(source)
        item["backup"] = str(backup_source(source, batch / "backup", source_hash))
        stem = re.sub(r"[^A-Za-z0-9._-]+", "_", source.stem).strip("._-") or "video"
        output = batch / "processed" / f"{stem}-{source_hash[:10]}-10s.mp4"
        source_details, checks, encoding = encode(source, output, ffmpeg, ffprobe)
        item["source"] = source_details
        item["output"] = str(output)
        item["output_sha256"] = sha256_file(output)
        item["validation"] = checks
        item["encoding"] = encoding
        item["status"] = "validated" if metadata else "failed"
    except Exception as exc:
        item["errors"].append(str(exc))
        item["status"] = "failed"
    item["finished_at"] = timestamp()
    return item


def main() -> int:
    args = parse_args()
    try:
        load_local_env()
    except PipelineError as exc:
        print(f"Environment configuration error: {exc}", file=sys.stderr)
        return 2
    if args.check_config:
        configured, missing, invalid = config_status()
        print(json.dumps({"configured": configured, "missing": missing, "invalid": invalid}, ensure_ascii=False))
        return 0 if not missing and not invalid else 1
    if args.publish and args.confirm_publish != "DEUDALAYA":
        print("Publishing requires --publish --confirm-publish DEUDALAYA", file=sys.stderr)
        return 2
    if args.publish and not args.confirm_rights:
        print("Publishing also requires --confirm-rights after confirming upload rights for every item", file=sys.stderr)
        return 2
    if args.confirm_publish and not args.publish:
        print("--confirm-publish requires --publish", file=sys.stderr)
        return 2
    if args.confirm_rights and not args.publish:
        print("--confirm-rights requires --publish", file=sys.stderr)
        return 2
    ffmpeg, ffprobe = shutil.which("ffmpeg"), shutil.which("ffprobe")
    if not ffmpeg or not ffprobe:
        print("Install ffmpeg and ffprobe through an approved source; this script does not download binaries.", file=sys.stderr)
        return 2
    input_dir = args.input.expanduser().resolve()
    if not input_dir.is_dir():
        print(f"Input directory does not exist: {input_dir}", file=sys.stderr)
        return 2
    runs_dir = args.runs.expanduser().resolve()
    runs_dir.mkdir(parents=True, exist_ok=True)
    batch_id = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
    batch = runs_dir / batch_id
    batch.mkdir(exist_ok=False)
    report_path = batch / "report.json"
    sources = sorted((p for p in input_dir.iterdir() if p.is_file() and not p.is_symlink() and p.suffix.lower() in VIDEO_EXTENSIONS), key=lambda p: p.name.casefold())
    report: dict[str, Any] = {
        "batch_id": batch_id, "started_at": timestamp(), "input_directory": str(input_dir),
        "batch_directory": str(batch), "publish_requested": args.publish,
        "project_ref": EXPECTED_PROJECT_REF if args.publish else None,
        "counts": {"total": len(sources), "media_validated": 0, "validated": 0, "uploaded": 0, "duplicates": 0, "failed": 0},
        "videos": [], "notes": ["Only direct children of the input folder are scanned.", "Report is updated after each file."],
    }
    try:
        for source in sources:
            record = process_one(source, batch, ffmpeg, ffprobe)
            report["videos"].append(record)
            write_report(report_path, report)
        report["counts"]["media_validated"] = sum(r.get("validation", {}).get("valid") is True for r in report["videos"])
        report["counts"]["validated"] = sum(r.get("status") in ("validated", "uploaded", "duplicate") for r in report["videos"])
        eligible = [r for r in report["videos"] if r.get("status") == "validated" and r.get("validation", {}).get("valid") is True]
        if args.publish and eligible:
            try:
                publisher = SupabasePublisher()
            except Exception as exc:
                report["publisher_preflight_error"] = str(exc)
                for record in eligible:
                    record["status"] = "failed"
                    record["upload"] = {"status": "failed_preflight"}
                    record["errors"].append(f"Upload preflight failed: {exc}")
            else:
                for record in eligible:
                    try:
                        outcome = publisher.publish(Path(record["output"]), record["metadata"], record["output_sha256"])
                        record["upload"] = outcome
                        record["status"] = outcome["status"]
                        report["counts"]["uploaded" if outcome["status"] == "uploaded" else "duplicates"] += 1
                    except Exception as exc:
                        record["upload"] = {"status": "failed"}
                        record["errors"].append(str(exc))
                        record["status"] = "failed"
                    write_report(report_path, report)
        report["counts"]["failed"] = sum(r.get("status") == "failed" for r in report["videos"])
        report["finished_at"] = timestamp()
        write_report(report_path, report)
    except Exception as exc:
        report["fatal_error"] = str(exc)
        report["finished_at"] = timestamp()
        write_report(report_path, report)
        print(f"Batch stopped: {exc}\nReport: {report_path}", file=sys.stderr)
        return 1
    print(json.dumps({"report": str(report_path), "counts": report["counts"]}, ensure_ascii=False, indent=2))
    return 1 if report["counts"]["failed"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
