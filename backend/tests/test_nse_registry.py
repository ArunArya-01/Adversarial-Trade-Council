import json
import tempfile
import unittest
from pathlib import Path

from services.lab.nse_registry import import_ready_registry_series, stitch_normalized_root, write_registry


def add_segment(root, token, source_hash, bars):
    (root / "segments").mkdir(parents=True, exist_ok=True)
    (root / "reports").mkdir(parents=True, exist_ok=True)
    (root / "segments" / f"{token}.jsonl").write_text("".join(json.dumps(row) + "\n" for row in bars))
    (root / "reports" / f"{token}.json").write_text(json.dumps({"source_path": f"raw/{token}.csv", "source_sha256": source_hash, "source_kind": "nse_equity_bhavcopy_export", "rows_normalized": len(bars), "instrument": "RELIANCE", "exchange": "NSE", "frequency": "1d"}))


def bar(day, close=100):
    return {"instrument": "RELIANCE", "exchange": "NSE", "timestamp": f"2024-01-{day:02d}T15:30:00+05:30", "timezone": "Asia/Kolkata", "frequency": "1d", "open": close, "high": close + 1, "low": close - 1, "close": close, "volume": 10}


class NseRegistryTests(unittest.TestCase):
    def test_identical_boundary_is_explicitly_reported_and_deduplicated(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory, "normalized")
            add_segment(root, "one", "hash-one", [bar(1), bar(2)])
            add_segment(root, "two", "hash-two", [bar(2), bar(3)])
            result = stitch_normalized_root(root)[0]
            self.assertEqual(len(result.bars), 3)
            self.assertEqual(len(result.identical_overlaps), 1)
            self.assertEqual(result.status, "ready_for_quality_audit")

    def test_conflicting_boundary_blocks_canonical_series_output(self):
        with tempfile.TemporaryDirectory() as directory:
            root, output = Path(directory, "normalized"), Path(directory, "registry")
            add_segment(root, "one", "hash-one", [bar(1), bar(2)])
            add_segment(root, "two", "hash-two", [bar(2, 101), bar(3)])
            result = write_registry(root, output)[0]
            self.assertEqual(result.status, "blocked_conflicting_overlap")
            self.assertFalse(list((output / "series").glob("*.jsonl")))
            report = json.loads(next((output / "reports").glob("*.json")).read_text())
            self.assertEqual(len(report["conflicting_overlaps"]), 1)

    def test_calendar_gap_is_reported_without_assuming_an_nse_holiday_calendar(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory, "normalized")
            add_segment(root, "one", "hash-one", [bar(1), bar(8)])
            result = stitch_normalized_root(root)[0]
            self.assertEqual(result.potential_calendar_gaps[0]["calendar_days"], 7)

    def test_mixed_ticker_segment_is_split_not_silently_merged(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory, "normalized")
            first, second = bar(1), bar(2)
            second["instrument"] = "NEWNAME"
            add_segment(root, "transition", "hash-transition", [first, second])
            result = stitch_normalized_root(root)
            self.assertEqual([item.key[0] for item in result], ["NEWNAME", "RELIANCE"])

    def test_ready_registry_series_bulk_imports_with_pending_quality_provenance(self):
        with tempfile.TemporaryDirectory() as directory:
            root, stitched, lab = Path(directory, "normalized"), Path(directory, "stitched"), Path(directory, "lab")
            add_segment(root, "one", "hash-one", [bar(1), bar(2)])
            write_registry(root, stitched)
            imported = import_ready_registry_series(stitched, lab)
            self.assertEqual(len(imported), 1)
            self.assertEqual(imported[0]["quality_status"], "pending_phase_17_audit")
            self.assertEqual(imported[0]["registry_provenance"]["source_segments"][0]["source_sha256"], "hash-one")
