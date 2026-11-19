import json
import tempfile
import unittest
from pathlib import Path

from services.lab.data_pipeline import LocalDatasetStore
from services.lab.nse_universe import UniverseError, scan_current_nifty50_universe


def csv_for(symbol: str, count: int = 25) -> bytes:
    lines = ["instrument,exchange,timestamp,timezone,frequency,open,high,low,close,volume"]
    for index in range(count):
        day = index + 1
        price = 100 + index
        lines.append(f"{symbol},NSE,2025-01-{day:02d}T15:30:00+05:30,Asia/Kolkata,1d,{price},{price + 1},{price - 1},{price},1000")
    return ("\n".join(lines) + "\n").encode()


class NseUniverseTests(unittest.TestCase):
    def test_scan_uses_one_exact_timestamp_and_never_future_bars(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            constituents = root / "constituents.csv"
            constituents.write_text("Company Name,Industry,Symbol,Series,ISIN Code\nReliance,Energy,RELIANCE,EQ,INE\nTCS,IT,TCS,EQ,INE\n")
            store = LocalDatasetStore(root / "lab")
            reliance = store.ingest(csv_for("RELIANCE"), "fixture-reliance", "reliance.csv")
            tcs = store.ingest(csv_for("TCS", count=24), "fixture-tcs", "tcs.csv")
            for metadata in (reliance, tcs):
                metadata["quality_status"] = "audited"
                (store.metadata_dir / f"{metadata['dataset_id']}.json").write_text(json.dumps(metadata))
            result = scan_current_nifty50_universe("2025-01-25", store=store, constituent_path=constituents)
            self.assertEqual(result["as_of"], "2025-01-25T15:30:00+05:30")
            self.assertEqual([item["instrument"] for item in result["results"]], ["RELIANCE"])
            self.assertEqual(result["results"][0]["as_of"], result["as_of"])
            self.assertEqual(result["excluded"][0]["symbol"], "TCS")
            self.assertIn("shared as_of", result["excluded"][0]["reason"])

    def test_unreviewed_data_is_excluded_and_current_membership_is_disclosed(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            constituents = root / "constituents.csv"
            constituents.write_text("Symbol\nRELIANCE\n")
            store = LocalDatasetStore(root / "lab")
            metadata = store.ingest(csv_for("RELIANCE"), "fixture", "reliance.csv")
            result = scan_current_nifty50_universe("2025-01-25", store=store, constituent_path=constituents)
            self.assertEqual(result["results"], [])
            self.assertEqual(result["excluded"][0]["dataset_id"], metadata["dataset_id"])
            self.assertIn("not a historical", result["membership_policy"])

    def test_rejects_naive_timestamp(self):
        with self.assertRaisesRegex(UniverseError, "include an offset"):
            scan_current_nifty50_universe("2025-01-25T15:30:00", store=LocalDatasetStore(tempfile.mkdtemp()), constituent_path=Path(tempfile.mkdtemp()) / "missing.csv")
