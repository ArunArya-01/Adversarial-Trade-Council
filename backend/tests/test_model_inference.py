import hashlib
import json
import tempfile
import unittest
from pathlib import Path

from services.lab.model_inference import ApprovedArtifactLoader


class ModelInferenceTests(unittest.TestCase):
    def test_missing_artifact_is_unavailable(self):
        self.assertEqual(ApprovedArtifactLoader().status().state, "unavailable")

    def test_validated_artifact_is_not_loaded_or_used_for_prediction(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            model, evaluation = root / "model.joblib", root / "evaluation-report.json"
            model.write_bytes(b"fixture")
            evaluation.write_text(json.dumps({"walk_forward": {"folds": 2}, "out_of_sample_test": {"status": "reviewed"}}))
            (root / "requirements-lock.txt").write_text("scikit-learn==1.0\n")
            (root / "feature_schema.json").write_text(json.dumps({"model_version": "fixture-v1", "target_name": "outperforms_benchmark_5d"}))
            (root / "approval.json").write_text(json.dumps({"approval_state": "approved", "model_sha256": hashlib.sha256(model.read_bytes()).hexdigest(), "evaluation_report_sha256": hashlib.sha256(evaluation.read_bytes()).hexdigest()}))
            status = ApprovedArtifactLoader(root).status()
            self.assertEqual(status.state, "validated_but_not_loaded")
            self.assertEqual(status.model_version, "fixture-v1")
