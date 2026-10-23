import tempfile
import unittest
from pathlib import Path

from src.inference import ArtifactContractError, load_manifest, ordered_feature_row, validate_manifest


VALID_MANIFEST = {
    "model_version": "candidate-1",
    "target_name": "outperforms_benchmark_5d",
    "horizon_sessions": 5,
    "feature_schema_version": "1.0",
    "feature_names": ["return_1", "momentum_20"],
    "training_date_range": ["2020-01-01", "2023-12-31"],
    "validation_metrics": {},
    "test_metrics": {},
    "package_versions": {},
    "random_seed": 42,
    "limitations": ["untrained fixture"],
}


class ArtifactContractTests(unittest.TestCase):
    def test_ordered_feature_row_respects_manifest_order(self):
        self.assertEqual(ordered_feature_row({"momentum_20": 2, "return_1": 1}, VALID_MANIFEST["feature_names"]), [1.0, 2.0])

    def test_manifest_rejects_missing_fields(self):
        with self.assertRaises(ArtifactContractError):
            validate_manifest({"model_version": "missing-contract"})

    def test_manifest_loads_from_exported_contract_file(self):
        import json
        with tempfile.TemporaryDirectory() as directory:
            Path(directory, "feature_schema.json").write_text(json.dumps(VALID_MANIFEST), encoding="utf-8")
            self.assertEqual(load_manifest(directory)["model_version"], "candidate-1")
