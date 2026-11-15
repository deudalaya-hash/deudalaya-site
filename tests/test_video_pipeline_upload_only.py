import hashlib
import importlib.util
import json
import os
import tempfile
import unittest
from contextlib import redirect_stdout
from io import StringIO
from pathlib import Path
from unittest.mock import patch


PIPELINE_PATH = Path(__file__).resolve().parents[1] / ".agents/skills/deudalaya-video-pipeline/scripts/pipeline.py"
SPEC = importlib.util.spec_from_file_location("deudalaya_video_pipeline", PIPELINE_PATH)
pipeline = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(pipeline)


def media_info(duration_seconds="0.932", video_codec="h264", audio_codec="aac"):
    streams = [{"codec_type": "video", "codec_name": video_codec, "width": 320, "height": 180}]
    if audio_codec:
        streams.append({"codec_type": "audio", "codec_name": audio_codec})
    return {
        "format": {"duration": duration_seconds, "format_name": "mov,mp4,m4a,3gp,3g2,mj2"},
        "streams": streams,
    }


class UploadOnlyValidationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.clip = Path(self.temp.name) / "short-final-clip.mp4"
        self.clip.write_bytes(b"unchanged test media bytes")

    def validate_with(self, info):
        with patch.object(pipeline, "probe", return_value=info), patch.object(pipeline, "run") as decode:
            result = pipeline.validate_upload_only(self.clip, "ffmpeg", "ffprobe")
        decode.assert_called_once()
        return result

    def test_accepts_short_h264_aac_clip_and_preserves_its_bytes(self):
        original = hashlib.sha256(self.clip.read_bytes()).hexdigest()

        result = self.validate_with(media_info())

        self.assertTrue(result["valid"])
        self.assertEqual(result["duration_seconds"], 0.932)
        self.assertEqual(result["sha256"], original)
        self.assertEqual(hashlib.sha256(self.clip.read_bytes()).hexdigest(), original)

    def test_rejects_clip_larger_than_strict_four_megabyte_limit(self):
        with self.clip.open("wb") as stream:
            stream.truncate(4_000_000)

        with self.assertRaisesRegex(pipeline.PipelineError, "strictly below"):
            self.validate_with(media_info())

    def test_rejects_duration_over_ten_seconds(self):
        with self.assertRaisesRegex(pipeline.PipelineError, "exceeds 10 seconds"):
            self.validate_with(media_info(duration_seconds="10.001"))

    def test_rejects_incompatible_video_or_audio_codec(self):
        for info in (media_info(video_codec="hevc"), media_info(audio_codec="mp3"), media_info(audio_codec=None)):
            with self.subTest(info=info), self.assertRaises(pipeline.PipelineError):
                self.validate_with(info)

    def test_upload_only_record_uses_original_file_without_encoding(self):
        sidecar = self.clip.with_name(self.clip.name + ".json")
        sidecar.write_text('{"category":"देउडा","caption":"Short demo"}', encoding="utf-8")
        original_hash = hashlib.sha256(self.clip.read_bytes()).hexdigest()
        validation = {"valid": True, "bytes": self.clip.stat().st_size, "duration_seconds": 0.932, "sha256": original_hash}

        with patch.object(pipeline, "validate_upload_only", return_value=validation), patch.object(
            pipeline, "encode", side_effect=AssertionError("upload-only mode must never encode")
        ):
            result = pipeline.process_upload_only_one(self.clip, "देउडा", "ffmpeg", "ffprobe")

        self.assertEqual(result["status"], "validated")
        self.assertEqual(result["output"], str(self.clip))
        self.assertEqual(result["output_sha256"], original_hash)
        self.assertEqual(result["metadata"]["category"], "देउडा")
        self.assertEqual(hashlib.sha256(self.clip.read_bytes()).hexdigest(), original_hash)

    def test_report_errors_redact_configured_pipeline_token(self):
        with patch.dict(os.environ, {"DEUDALAYA_VIDEO_PIPELINE_TOKEN": "local-test-secret-value"}):
            error = pipeline.safe_error(RuntimeError("response echoed local-test-secret-value"))

        self.assertNotIn("local-test-secret-value", error)
        self.assertIn("[REDACTED]", error)


class UploadOnlyBatchTests(unittest.TestCase):
    def test_identical_validated_clips_are_sent_once_and_reported_as_duplicate(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            input_dir = root / "input"
            input_dir.mkdir()
            clips = [input_dir / "one.mp4", input_dir / "two.mp4"]
            for clip in clips:
                clip.write_bytes(b"local fake MP4 payload")
            digest = "a" * 64
            records = [
                {
                    "input": str(clip), "output": str(clip), "output_sha256": digest,
                    "metadata": {"category": "देउडा", "caption": clip.stem},
                    "validation": {"valid": True}, "upload": {"status": "not_attempted"},
                    "status": "validated", "errors": [],
                }
                for clip in clips
            ]

            class LocalPublisher:
                def __init__(self):
                    self.calls = []

                def publish(self, path, metadata, file_hash):
                    self.calls.append((path, metadata, file_hash))
                    return {"status": "uploaded", "object_path": "publisher/hash.mp4", "row_id": "feed-1", "storage_uploaded": True}

            publisher = LocalPublisher()
            argv = [
                "pipeline.py", "--upload-only", "--category", "देउडा",
                "--input", str(input_dir), "--runs", str(root / "runs"),
                "--publish", "--confirm-publish", "DEUDALAYA", "--confirm-rights",
            ]
            with patch.object(pipeline, "load_local_env"), patch.object(pipeline.shutil, "which", return_value="ffmpeg"), patch.object(
                pipeline, "process_upload_only_one", side_effect=records
            ), patch.object(pipeline, "SupabasePublisher", return_value=publisher), patch.object(
                pipeline.sys, "argv", argv
            ), redirect_stdout(StringIO()):
                result = pipeline.main()

            reports = list((root / "runs").glob("*/report.json"))
            self.assertEqual(result, 0)
            self.assertEqual(len(publisher.calls), 1)
            report = json.loads(reports[0].read_text(encoding="utf-8"))
            self.assertEqual(report["counts"], {
                "total": 2, "media_validated": 2, "validated": 2,
                "uploaded": 1, "duplicates": 1, "failed": 0,
            })
            self.assertEqual([video["status"] for video in report["videos"]], ["uploaded", "duplicate"])
            self.assertEqual(report["videos"][1]["upload"]["duplicate_of"], str(clips[0]))


if __name__ == "__main__":
    unittest.main()
