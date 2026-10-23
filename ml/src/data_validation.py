"""Dataset and run-manifest checks that do not depend on a model framework."""

from __future__ import annotations

from datetime import datetime
from typing import Iterable, Mapping


class ResearchValidationError(ValueError):
    pass


REQUIRED_DATASET_METADATA = {
    "dataset_id", "source", "content_sha256", "instrument", "exchange",
    "frequency", "first_timestamp", "last_timestamp", "feature_schema_version",
}


def validate_dataset_metadata(metadata: Mapping[str, object]) -> None:
    missing = sorted(key for key in REQUIRED_DATASET_METADATA if not metadata.get(key))
    if missing:
        raise ResearchValidationError(f"dataset metadata missing: {', '.join(missing)}")
    if metadata.get("data_kind") != "historical":
        raise ResearchValidationError("only historical datasets are eligible for ML research")


def validate_timestamp_order(rows: Iterable[Mapping[str, object]], timestamp_key: str = "timestamp") -> None:
    previous = None
    count = 0
    for count, row in enumerate(rows, start=1):
        value = row.get(timestamp_key)
        if not isinstance(value, str):
            raise ResearchValidationError(f"row {count}: missing {timestamp_key}")
        try:
            current = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError as error:
            raise ResearchValidationError(f"row {count}: invalid {timestamp_key}") from error
        if previous is not None and current <= previous:
            raise ResearchValidationError("timestamps must be strictly increasing")
        previous = current
    if not count:
        raise ResearchValidationError("research dataset contains no rows")


def validate_feature_schema(columns: Iterable[str], feature_names: Iterable[str], target_name: str) -> None:
    available = set(columns)
    missing = sorted(set(feature_names) - available)
    if missing:
        raise ResearchValidationError(f"feature columns missing: {', '.join(missing)}")
    if target_name not in available:
        raise ResearchValidationError(f"target column missing: {target_name}")
