"""Artifact bundle contract shared by Colab export and later backend inference."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Mapping, Sequence


REQUIRED_MANIFEST_FIELDS = {
    "model_version", "target_name", "horizon_sessions", "feature_schema_version",
    "feature_names", "training_date_range", "validation_metrics", "test_metrics",
    "package_versions", "random_seed", "limitations",
}


class ArtifactContractError(ValueError):
    pass


def validate_manifest(manifest: Mapping[str, object]) -> None:
    missing = sorted(key for key in REQUIRED_MANIFEST_FIELDS if key not in manifest)
    if missing:
        raise ArtifactContractError(f"artifact manifest missing: {', '.join(missing)}")
    if manifest["horizon_sessions"] != 5:
        raise ArtifactContractError("initial inference service accepts only the defined five-session target")
    if not isinstance(manifest["feature_names"], list) or not manifest["feature_names"]:
        raise ArtifactContractError("feature_names must be a non-empty ordered list")


def load_manifest(artifact_directory: str | Path) -> dict:
    path = Path(artifact_directory) / "feature_schema.json"
    if not path.exists():
        raise ArtifactContractError("feature_schema.json not found")
    manifest = json.loads(path.read_text(encoding="utf-8"))
    validate_manifest(manifest)
    return manifest


def ordered_feature_row(record: Mapping[str, object], feature_names: Sequence[str]) -> list[float]:
    missing = [name for name in feature_names if name not in record or record[name] is None]
    if missing:
        raise ArtifactContractError(f"inference input missing features: {', '.join(missing)}")
    try:
        return [float(record[name]) for name in feature_names]
    except (TypeError, ValueError) as error:
        raise ArtifactContractError("inference features must be numeric") from error
