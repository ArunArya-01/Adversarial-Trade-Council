import json
import tempfile
import unittest
from pathlib import Path

from services.lab.data_pipeline import DatasetValidationError, LocalDatasetStore
from services.lab.nse_quality import audit_registry, write_quality_audit


def write_series(root, name, bars):
    (root / "series").mkdir(parents=True, exist_ok=True)
    (root / "series" / name).write_text("".join(json.dumps(bar) + "\n" for bar in bars))


def bar(instrument, day, close=100, volume=10):
    return {"instrument": instrument, "exchange": "NSE", "timestamp": f"2024-01-{day:02d}T15:30:00+05:30", "timezone": "Asia/Kolkata", "frequency": "1d", "open": close, "high": close + 1, "low": close - 1, "close": close, "volume": volume}


class NseQualityTests(unittest.TestCase):
    def test_audit_reports_benchmark_alignment_and_large_return_as_candidate(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            nifty, reliance = [bar("NIFTY 50", 1), bar("NIFTY 50", 2)], [bar("RELIANCE", 1), bar("RELIANCE", 2, 130)]
            write_series(root, "NIFTY_50__NSE__1d.jsonl", nifty)
            write_series(root, "RELIANCE__NSE__1d.jsonl", reliance)
            registry = {"series": [{"series_id": "nifty", "instrument": "NIFTY 50", "exchange": "NSE", "frequency": "1d", "source_segments": [], "potential_calendar_gaps": []}, {"series_id": "reliance", "instrument": "RELIANCE", "exchange": "NSE", "frequency": "1d", "source_segments": [], "potential_calendar_gaps": []}]}
            (root / "registry.json").write_text(json.dumps(registry))
            audit = next(item for item in audit_registry(root) if item["instrument"] == "RELIANCE")
            self.assertEqual(audit["benchmark_alignment"]["match_fraction"], 1)
            self.assertEqual(len(audit["large_return_candidates"]), 1)
            self.assertNotEqual(audit["status"], "blocked")

    def test_invalid_ohlc_blocks_series_and_report_is_written(self):
        with tempfile.TemporaryDirectory() as directory:
            root, output = Path(directory, "stitched"), Path(directory, "quality")
            bad = bar("NIFTY 50", 1); bad["low"] = 200
            write_series(root, "NIFTY_50__NSE__1d.jsonl", [bad])
            (root / "registry.json").write_text(json.dumps({"series": [{"series_id": "nifty", "instrument": "NIFTY 50", "exchange": "NSE", "frequency": "1d", "source_segments": [], "potential_calendar_gaps": []}]}))
            audits = write_quality_audit(root, output)
            self.assertEqual(audits[0]["status"], "blocked")
            self.assertTrue((output / "quality-registry.json").exists())

    def test_blocked_quality_status_cannot_load_for_backtesting_or_ml(self):
        with tempfile.TemporaryDirectory() as directory:
            store = LocalDatasetStore(Path(directory, "lab"))
            content = b"instrument,exchange,timestamp,timezone,frequency,open,high,low,close,volume\nRELIANCE,NSE,2024-01-01T15:30:00+05:30,Asia/Kolkata,1d,100,101,99,100,10\n"
            metadata = store.ingest(content, "fixture", "fixture.csv")
            metadata["quality_status"] = "blocked"
            (store.metadata_dir / f"{metadata['dataset_id']}.json").write_text(json.dumps(metadata))
            with self.assertRaisesRegex(DatasetValidationError, "blocked"):
                store.load_clean_bars(metadata["dataset_id"])
