import hashlib
import json
import tempfile
import unittest
from pathlib import Path

import pandas as pd

from src.baseline_experiment import load_prepared_research_data
from src.data_validation import ResearchValidationError


class BaselineExperimentTests(unittest.TestCase):
    def test_prepared_hash_must_match_manifest_before_any_experiment(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            data = root / "prepared.csv"
            pd.DataFrame({"timestamp": ["2025-01-01T15:30:00+05:30"], "instrument": ["AAA"], "dataset_id": ["abc"], "return_1": [0.1], "outperforms_benchmark_5d": [1]}).to_csv(data, index=False)
            manifest = root / "prepared-manifest.json"
            manifest.write_text(json.dumps({"prepared_file": "prepared.csv", "prepared_file_sha256": "wrong", "feature_schema_version": "1.0", "feature_names": ["return_1"], "target_name": "outperforms_benchmark_5d", "horizon_sessions": 5}))
            with self.assertRaisesRegex(ResearchValidationError, "hash"):
                load_prepared_research_data(data, manifest)

    def test_prepared_file_with_verified_hash_loads_without_model_fitting(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            data = root / "prepared.csv"
            pd.DataFrame({"timestamp": ["2025-01-01T15:30:00+05:30", "2025-01-02T15:30:00+05:30"], "instrument": ["AAA", "AAA"], "dataset_id": ["abc", "abc"], "return_1": [0.1, 0.2], "outperforms_benchmark_5d": [0, 1]}).to_csv(data, index=False)
            digest = hashlib.sha256(data.read_bytes()).hexdigest()
            manifest = root / "prepared-manifest.json"
            manifest.write_text(json.dumps({"prepared_file": "prepared.csv", "prepared_file_sha256": digest, "feature_schema_version": "1.0", "feature_names": ["return_1"], "target_name": "outperforms_benchmark_5d", "horizon_sessions": 5}))
            frame, loaded = load_prepared_research_data(data, manifest)
            self.assertEqual(len(frame), 2)
            self.assertEqual(loaded["prepared_file_sha256"], digest)
