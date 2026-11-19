import hashlib
import json
import tempfile
import unittest
from pathlib import Path

from src.artifact_approval import ArtifactApprovalError, validate_approved_bundle


class ArtifactApprovalTests(unittest.TestCase):
    def _bundle(self, root: Path):
        model, evaluation = root / "model.joblib", root / "evaluation-report.json"
        model.write_bytes(b"reviewed fixture model")
        evaluation.write_text(json.dumps({"walk_forward": {"folds": 2}, "out_of_sample_test": {"status": "reviewed"}}))
        (root / "requirements-lock.txt").write_text("scikit-learn==1.0\n")
        prepared_hash = "b" * 64
        (root / "feature_schema.json").write_text(json.dumps({"model_version": "fixture", "target_name": "outperforms_benchmark_5d", "horizon_sessions": 5, "feature_schema_version": "1.0", "feature_names": ["return_1"], "training_date_range": ["2020", "2021"], "validation_metrics": {}, "test_metrics": {}, "package_versions": {}, "random_seed": 42, "prepared_file_sha256": prepared_hash, "limitations": ["fixture"]}))
        (root / "approval.json").write_text(json.dumps({"approval_state": "approved", "approved_by": "reviewer", "approved_at": "2026-01-01T00:00:00Z", "reason": "fixture", "model_sha256": hashlib.sha256(model.read_bytes()).hexdigest(), "evaluation_report_sha256": hashlib.sha256(evaluation.read_bytes()).hexdigest(), "prepared_file_sha256": prepared_hash}))

    def test_approved_bundle_requires_hashes_and_evaluation_evidence(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); self._bundle(root)
            self.assertEqual(validate_approved_bundle(root)["approval"]["approval_state"], "approved")
            (root / "model.joblib").write_bytes(b"tampered")
            with self.assertRaisesRegex(ArtifactApprovalError, "model hash"):
                validate_approved_bundle(root)
