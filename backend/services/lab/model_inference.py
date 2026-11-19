"""Fail-closed boundary for a future approved research-model artifact.

No artifact is loaded at import time. This keeps FastAPI unavailable rather
than permissive when a model, approval record, or evidence chain is absent.
"""
from __future__ import annotations

import hashlib
import json
import os
from dataclasses import asdict, dataclass
from pathlib import Path


@dataclass(frozen=True)
class ModelInferenceStatus:
    state: str
    message: str
    model_version: str | None = None
    target_name: str | None = None

    def to_dict(self) -> dict:
        return asdict(self)


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


class ApprovedArtifactLoader:
    """Validate only an explicitly approved artifact; prediction remains deferred."""

    def __init__(self, artifact_directory: str | Path | None = None):
        configured = artifact_directory if artifact_directory is not None else os.getenv("TRADEMIND_MODEL_ARTIFACT_DIR", "")
        self.directory = Path(configured) if configured else None

    def status(self) -> ModelInferenceStatus:
        if self.directory is None:
            return ModelInferenceStatus("unavailable", "No approved model artifact is configured. Historical research remains available without ML inference.")
        required = {"model.joblib", "feature_schema.json", "evaluation-report.json", "requirements-lock.txt", "approval.json"}
        missing = sorted(name for name in required if not (self.directory / name).is_file())
        if missing:
            return ModelInferenceStatus("unavailable", f"Configured artifact is incomplete: {', '.join(missing)}.")
        try:
            manifest = json.loads((self.directory / "feature_schema.json").read_text(encoding="utf-8"))
            approval = json.loads((self.directory / "approval.json").read_text(encoding="utf-8"))
            evaluation = json.loads((self.directory / "evaluation-report.json").read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return ModelInferenceStatus("unavailable", "Configured artifact metadata is unreadable.")
        if approval.get("approval_state") != "approved":
            return ModelInferenceStatus("unavailable", "Configured artifact has not received explicit approval.")
        if approval.get("model_sha256") != _sha256(self.directory / "model.joblib") or approval.get("evaluation_report_sha256") != _sha256(self.directory / "evaluation-report.json"):
            return ModelInferenceStatus("unavailable", "Configured artifact integrity hashes do not match its approval record.")
        if not evaluation.get("walk_forward") or not evaluation.get("out_of_sample_test"):
            return ModelInferenceStatus("unavailable", "Configured artifact lacks completed walk-forward and out-of-sample evidence.")
        return ModelInferenceStatus("validated_but_not_loaded", "An approved artifact passed metadata validation. Runtime model loading and prediction are deferred until feature-parity review is complete.", manifest.get("model_version"), manifest.get("target_name"))
