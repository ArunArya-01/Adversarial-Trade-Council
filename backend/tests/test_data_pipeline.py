import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from services.lab.data_pipeline import (
    DatasetValidationError,
    LocalDatasetStore,
    calculate_features,
    validate_csv,
)


HEADER = "instrument,exchange,timestamp,timezone,frequency,open,high,low,close,volume\n"


def valid_csv(rows=21):
    lines = []
    for index in range(rows):
        close = 100 + index
        lines.append(
            f"RELIANCE,NSE,2025-01-{index + 1:02d}T09:15:00+05:30,Asia/Kolkata,1d,"
            f"{close - 0.5},{close + 1},{close - 1},{close},1000"
        )
    return HEADER + "\n".join(lines) + "\n"


class DataPipelineTests(unittest.TestCase):
    def test_valid_csv_is_sorted_and_features_are_trailing_only(self):
        bars = validate_csv(valid_csv())
        features = calculate_features(bars)
        self.assertEqual(len(features), 21)
        self.assertIsNone(features[0]["return_1"])
        self.assertAlmostEqual(features[1]["return_1"], 0.01)
        self.assertAlmostEqual(features[20]["sma_5"], 118.0)
        self.assertAlmostEqual(features[20]["momentum_20"], 0.20)
        self.assertEqual(features[19]["relative_volume_20"], 1.0)

    def test_duplicate_timestamp_is_rejected(self):
        csv_text = valid_csv(2) + "RELIANCE,NSE,2025-01-02T09:15:00+05:30,Asia/Kolkata,1d,101,102,100,101,1000\n"
        with self.assertRaisesRegex(DatasetValidationError, "duplicate"):
            validate_csv(csv_text)

    def test_missing_required_column_is_rejected(self):
        csv_text = "instrument,exchange,timestamp,timezone,frequency,open,high,low,close\nRELIANCE,NSE,2025-01-01T09:15:00+05:30,Asia/Kolkata,1d,100,101,99,100\n"
        with self.assertRaisesRegex(DatasetValidationError, "missing required columns: volume"):
            validate_csv(csv_text)

    def test_invalid_ohlc_is_rejected(self):
        csv_text = HEADER + "RELIANCE,NSE,2025-01-01T09:15:00+05:30,Asia/Kolkata,1d,100,99,98,100,1000\n"
        with self.assertRaisesRegex(DatasetValidationError, "invalid OHLC"):
            validate_csv(csv_text)

    def test_mixed_instruments_are_rejected(self):
        csv_text = valid_csv(2).replace("RELIANCE,NSE,2025-01-02", "TCS,NSE,2025-01-02")
        with self.assertRaisesRegex(DatasetValidationError, "one instrument"):
            validate_csv(csv_text)

    def test_store_separates_raw_clean_features_and_metadata(self):
        with tempfile.TemporaryDirectory() as directory:
            metadata = LocalDatasetStore(directory).ingest(valid_csv().encode(), "test fixture", "reliance.csv")
            root = Path(directory)
            dataset_id = metadata["dataset_id"]
            self.assertTrue((root / "raw" / f"{dataset_id}.csv").exists())
            self.assertTrue((root / "clean" / f"{dataset_id}.jsonl").exists())
            self.assertTrue((root / "features" / f"{dataset_id}.jsonl").exists())
            self.assertTrue((root / "metadata" / f"{dataset_id}.json").exists())
            self.assertEqual(metadata["data_kind"], "historical")

    def test_import_endpoint_records_local_csv_provenance(self):
        from fastapi.testclient import TestClient
        from main import app

        with tempfile.TemporaryDirectory() as directory, patch.dict("os.environ", {"LAB_DATA_ROOT": directory}):
            response = TestClient(app).post(
                "/api/lab/datasets/import",
                data={"source": "test fixture"},
                files={"file": ("reliance.csv", valid_csv().encode(), "text/csv")},
            )
        self.assertEqual(response.status_code, 201, response.text)
        self.assertEqual(response.json()["data_kind"], "historical")
