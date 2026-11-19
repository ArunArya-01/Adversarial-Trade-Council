"""Strict validation for a reviewed, manually approved model bundle.

Approval is deliberately a human-authored record. This module never promotes a
candidate merely because its metrics look favourable.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

from src.inference import ArtifactContractError, load_manifest


class ArtifactApprovalError(ValueError):
    pass


REQUIRED_FILES = {"model.joblib", "feature_schema.json", "evaluation-report.json", "requirements-lock.txt", "approval.json"}
REQUIRED_APPROVAL_FIELDS = {"approval_state", "approved_by", "approved_at", "reason", "model_sha256", "evaluation_report_sha256", "prepared_file_sha256"}


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def validate_approved_bundle(directory: str | Path) -> dict:
    """Validate immutable provenance and an explicit approval decision."""
    root = Path(directory)
    missing = sorted(name for name in REQUIRED_FILES if not (root / name).is_file())
    if missing:
        raise ArtifactApprovalError(f"artifact bundle missing: {', '.join(missing)}")
    try:
        manifest = load_manifest(root)
    except ArtifactContractError as error:
        raise ArtifactApprovalError(str(error)) from error
    approval = json.loads((root / "approval.json").read_text(encoding="utf-8"))
    missing_approval = sorted(name for name in REQUIRED_APPROVAL_FIELDS if not approval.get(name))
    if missing_approval:
        raise ArtifactApprovalError(f"approval record missing: {', '.join(missing_approval)}")
    if approval["approval_state"] != "approved":
        raise ArtifactApprovalError("artifact approval_state must be approved")
    if approval["model_sha256"] != _sha256(root / "model.joblib"):
        raise ArtifactApprovalError("model hash differs from approval record")
    if approval["evaluation_report_sha256"] != _sha256(root / "evaluation-report.json"):
        raise ArtifactApprovalError("evaluation report hash differs from approval record")
    if manifest.get("prepared_file_sha256") != approval["prepared_file_sha256"]:
        raise ArtifactApprovalError("approval data hash differs from feature manifest")
    report = json.loads((root / "evaluation-report.json").read_text(encoding="utf-8"))
    if not report.get("walk_forward") or not report.get("out_of_sample_test"):
        raise ArtifactApprovalError("evaluation report must contain completed walk-forward and out-of-sample test evidence")
    return {"manifest": manifest, "approval": approval, "bundle_sha256": {name: _sha256(root / name) for name in sorted(REQUIRED_FILES - {"approval.json"})}}
