import importlib.util
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


SCRIPT = Path(__file__).resolve().parents[1] / ".agents/skills/deudalaya-video-pipeline/scripts/split_batch.py"
SPEC = importlib.util.spec_from_file_location("deudalaya_video_split_batch", SCRIPT)
split_batch = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(split_batch)


class SegmentPlanningTests(unittest.TestCase):
    def test_keeps_full_ten_second_segments_and_only_remainders_over_five_seconds(self):
        self.assertEqual(split_batch.plan_segments(61.53), [(0.0, 10.0), (10.0, 10.0), (20.0, 10.0), (30.0, 10.0), (40.0, 10.0), (50.0, 10.0)])
        self.assertEqual(split_batch.plan_segments(25.633), [(0.0, 10.0), (10.0, 10.0), (20.0, 5.633)])
        self.assertEqual(split_batch.plan_segments(17.321), [(0.0, 10.0), (10.0, 7.321)])

    def test_discards_remainders_of_five_seconds_or_less(self):
        self.assertEqual(split_batch.plan_segments(25.0), [(0.0, 10.0), (10.0, 10.0)])
        self.assertEqual(split_batch.plan_segments(15.0), [(0.0, 10.0)])
        self.assertEqual(split_batch.plan_segments(5.0), [])

    def test_accepts_a_source_shorter_than_ten_seconds_only_when_over_five(self):
        self.assertEqual(split_batch.plan_segments(7.988), [(0.0, 7.988)])
        self.assertEqual(split_batch.plan_segments(4.999), [])


class BatchPreflightTests(unittest.TestCase):
    def test_rejects_existing_output_directory_contents_before_processing(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            input_dir = Path(temp_dir) / "input"
            output_dir = Path(temp_dir) / "processed"
            input_dir.mkdir()
            output_dir.mkdir()
            (output_dir / "keep.txt").write_text("do not overwrite", encoding="utf-8")

            with self.assertRaisesRegex(split_batch.PipelineError, "must be empty"):
                split_batch.prepare_output(input_dir, output_dir)

    def test_resume_accepts_only_complete_generated_clip_pairs(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            input_dir = root / "input"
            output_dir = root / "processed"
            input_dir.mkdir()
            output_dir.mkdir()
            (output_dir / "source-hash-clip-001.mp4").write_bytes(b"existing clip")
            (output_dir / "source-hash-clip-001.mp4.json").write_text('{"category":"अन्तरिक्ष"}', encoding="utf-8")

            backup_dir = split_batch.prepare_output(input_dir, output_dir, resume=True)

            self.assertEqual(backup_dir, root / "backup")
            self.assertTrue(backup_dir.is_dir())

    def test_requires_the_existing_deudalaya_category_allowlist(self):
        self.assertIn("अन्तरिक्ष", split_batch.CATEGORIES)
        with self.assertRaisesRegex(split_batch.PipelineError, "category must exactly match"):
            split_batch.validate_category("space")

    def test_later_segments_use_input_side_seeking_to_keep_audio(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            output = Path(temp_dir) / "segment.mp4"
            source_info = {
                "streams": [
                    {"codec_type": "video", "codec_name": "h264", "width": 1280, "height": 720, "avg_frame_rate": "30/1"},
                    {"codec_type": "audio", "codec_name": "aac"},
                ],
            }
            output_info = {
                "format": {"duration": "10", "format_name": "mov,mp4,m4a"},
                "streams": [
                    {"codec_type": "video", "codec_name": "h264", "width": 720, "height": 404, "duration": "10", "avg_frame_rate": "30/1"},
                    {"codec_type": "audio", "codec_name": "aac", "duration": "10"},
                ],
            }
            commands = []

            def fake_run(command):
                commands.append(command)
                if command[-1] == str(output):
                    output.write_bytes(b"encoded clip")
                return None

            with patch.object(split_batch, "run", side_effect=fake_run), patch.object(
                split_batch, "probe", return_value=output_info
            ):
                result = split_batch.encode_clip(
                    Path("source.mp4"), output, 10, 10, source_info, "ffmpeg", "ffprobe", 2_000_000
                )

            self.assertTrue(result["valid"])
            self.assertLess(commands[0].index("-ss"), commands[0].index("-i"))
            self.assertLess(float(commands[0][commands[0].index("-t") + 1]), 10)
            self.assertEqual(result["audio_codec"], "aac")

    def test_rejects_muxed_duration_over_ten_seconds_from_aac_padding(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            output = Path(temp_dir) / "padded.mp4"
            output.write_bytes(b"media")
            info = {
                "format": {"duration": "10.021", "format_name": "mov,mp4,m4a"},
                "streams": [
                    {"codec_type": "video", "codec_name": "h264", "width": 720, "height": 404, "duration": "10"},
                    {"codec_type": "audio", "codec_name": "aac", "duration": "10.021"},
                ],
            }
            source_video = {"codec_type": "video", "width": 1280, "height": 720}
            with patch.object(split_batch, "probe", return_value=info):
                with self.assertRaisesRegex(split_batch.PipelineError, "strict 10-second maximum"):
                    split_batch.validate_output(output, 10, source_video, "ffmpeg", "ffprobe", 2_000_000)


if __name__ == "__main__":
    unittest.main()
