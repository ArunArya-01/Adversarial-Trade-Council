import json
import tempfile
import unittest
from datetime import datetime, timedelta
from pathlib import Path

import pandas as pd

from services.lab.data_pipeline import LocalDatasetStore
from src.labels import add_outperformance_label
from src.preparation import prepare_nse_research_data


def content(symbol: str, values: list[float]) -> bytes:
    rows = ["instrument,exchange,timestamp,timezone,frequency,open,high,low,close,volume"]
    start = datetime(2025, 1, 1)
    for index, value in enumerate(values, start=1):
        timestamp = (start + timedelta(days=index - 1)).strftime("%Y-%m-%d")
        rows.append(f"{symbol},NSE,{timestamp}T15:30:00+05:30,Asia/Kolkata,1d,{value},{value + 1},{value - 1},{value},{1000 + index}")
    return ("\n".join(rows) + "\n").encode()


class PreparationTests(unittest.TestCase):
    def _audited(self, store, symbol, values):
        metadata = store.ingest(content(symbol, values), "fixture", f"{symbol}.csv")
        metadata["quality_status"] = "audited"
        (store.metadata_dir / f"{metadata['dataset_id']}.json").write_text(json.dumps(metadata))
        return metadata

    def test_preparation_writes_hashed_manifest_and_never_imputes(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            store = LocalDatasetStore(root / "lab")
            self._audited(store, "NIFTY 50", [100 + index for index in range(35)])
            stock = self._audited(store, "RELIANCE", [100 + index * 1.5 for index in range(35)])
            manifest = prepare_nse_research_data(store, root / "prepared")
            frame = pd.read_csv(root / "prepared" / "prepared.csv")
            self.assertEqual(manifest["row_count"], len(frame))
            self.assertEqual(manifest["included_datasets"][0]["dataset_id"], stock["dataset_id"])
            self.assertFalse(frame[manifest["feature_names"]].isna().any().any())
            self.assertTrue(manifest["prepared_file_sha256"])
            self.assertEqual(set(frame["outperforms_benchmark_5d"]), {1})

    def test_nonmatching_future_sessions_are_not_labelled(self):
        stock = pd.DataFrame({"timestamp": ["2025-01-01", "2025-01-02", "2025-01-03"], "close": [100, 101, 102]})
        benchmark = pd.DataFrame({"timestamp": ["2025-01-01", "2025-01-03", "2025-01-04"], "close": [200, 201, 202]})
        labelled = add_outperformance_label(stock, benchmark, horizon=1)
        self.assertTrue(pd.isna(labelled.loc[0, "outperforms_benchmark_5d"]))
