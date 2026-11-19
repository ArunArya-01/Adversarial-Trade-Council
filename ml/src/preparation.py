"""Build a provenance-preserving, Colab-ready NSE research dataset.

This module prepares data only.  It does not split, fit, score, export, or
approve a model.  It accepts only audited local historical datasets and emits
rows whose features were known at their timestamp and whose target interval is
matched to the NIFTY 50 Price Return benchmark.
"""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from src.data_validation import ResearchValidationError, validate_dataset_metadata, validate_feature_schema, validate_timestamp_order
from src.features import DEFAULT_FEATURES, FEATURE_SCHEMA_VERSION, build_features
from src.labels import TARGET_NAME, add_outperformance_label


PREPARATION_VERSION = "nse-colab-preparation-1.0"
HORIZON_SESSIONS = 5
AUDITED_STATUSES = {"audited", "audited_with_warnings"}


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _load_jsonl(path: Path) -> list[dict[str, Any]]:
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line]


def _frame_from_store(store, dataset_id: str):
    import pandas as pd

    path = store.clean_dir / f"{dataset_id}.jsonl"
    if not path.exists():
        raise ResearchValidationError(f"clean historical rows missing for dataset {dataset_id}")
    rows = _load_jsonl(path)
    validate_timestamp_order(rows)
    return pd.DataFrame(rows)


def _eligible_metadata(store) -> tuple[list[dict[str, Any]], list[dict[str, str]]]:
    candidates, excluded = [], []
    for metadata in store.list_datasets():
        try:
            validate_dataset_metadata(metadata)
        except ResearchValidationError:
            continue
        if metadata.get("exchange") != "NSE" or metadata.get("frequency") != "1d" or metadata.get("quality_status") not in AUDITED_STATUSES:
            continue
        source_kinds = {
            segment.get("source_kind")
            for segment in metadata.get("registry_provenance", {}).get("source_segments", [])
        }
        if source_kinds and source_kinds != {"nse_equity_bhavcopy_export"} and metadata.get("instrument") != "NIFTY 50":
            excluded.append({"dataset_id": metadata["dataset_id"], "instrument": metadata["instrument"], "reason": "non-equity source provenance is outside the initial NSE equity ML universe"})
            continue
        candidates.append(metadata)
    return candidates, excluded


def prepare_nse_research_data(store, output_directory: str | Path, horizon: int = HORIZON_SESSIONS) -> dict[str, Any]:
    """Write ``prepared.csv`` and its immutable input/output manifest.

    The current downloaded universe may contain renamed or historical symbols.
    All audited NSE equities with an aligned benchmark are retained; the
    manifest records each included source and every exclusion.
    """
    import pandas as pd

    if horizon != HORIZON_SESSIONS:
        raise ResearchValidationError(f"only the reviewed {HORIZON_SESSIONS}-session target is supported in this phase")
    output = Path(output_directory)
    output.mkdir(parents=True, exist_ok=True)
    candidates, excluded = _eligible_metadata(store)
    benchmarks = [item for item in candidates if item.get("instrument") == "NIFTY 50"]
    if len(benchmarks) != 1:
        raise ResearchValidationError("exactly one audited NIFTY 50 Price Return benchmark is required")
    benchmark_metadata = benchmarks[0]
    benchmark = _frame_from_store(store, benchmark_metadata["dataset_id"])
    included, frames = [], []
    for metadata in candidates:
        if metadata["dataset_id"] == benchmark_metadata["dataset_id"]:
            continue
        instrument = metadata["instrument"]
        try:
            raw = _frame_from_store(store, metadata["dataset_id"])
            engineered = build_features(raw, benchmark)
            labelled = add_outperformance_label(engineered, benchmark, horizon)
            labelled["dataset_id"] = metadata["dataset_id"]
            labelled["content_sha256"] = metadata["content_sha256"]
            labelled["quality_status"] = metadata["quality_status"]
            validate_feature_schema(labelled.columns, DEFAULT_FEATURES, TARGET_NAME)
            usable = labelled.dropna(subset=[*DEFAULT_FEATURES, TARGET_NAME]).copy()
            if usable.empty:
                excluded.append({"dataset_id": metadata["dataset_id"], "instrument": instrument, "reason": "no rows remain after trailing feature and matched-horizon target requirements"})
                continue
            usable[TARGET_NAME] = usable[TARGET_NAME].astype(int)
            frames.append(usable)
            included.append({
                "dataset_id": metadata["dataset_id"], "instrument": instrument,
                "content_sha256": metadata["content_sha256"], "quality_status": metadata["quality_status"],
                "input_rows": len(raw), "prepared_rows": len(usable),
                "first_timestamp": usable["timestamp"].iloc[0], "last_timestamp": usable["timestamp"].iloc[-1],
            })
        except (ResearchValidationError, ValueError) as error:
            excluded.append({"dataset_id": metadata["dataset_id"], "instrument": instrument, "reason": str(error)})
    if not frames:
        raise ResearchValidationError("no audited NSE equity produced ML-ready rows")
    prepared = pd.concat(frames, ignore_index=True).sort_values(["timestamp", "instrument", "dataset_id"])
    columns = ["dataset_id", "instrument", "exchange", "timestamp", "timezone", "frequency", *DEFAULT_FEATURES, TARGET_NAME, "future_return", "benchmark_future_return", "future_timestamp", "content_sha256", "quality_status"]
    prepared = prepared[columns]
    data_path = output / "prepared.csv"
    prepared.to_csv(data_path, index=False, lineterminator="\n")
    manifest = {
        "preparation_version": PREPARATION_VERSION,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "data_kind": "historical",
        "exchange": "NSE",
        "frequency": "1d",
        "currency": "INR",
        "feature_schema_version": FEATURE_SCHEMA_VERSION,
        "feature_names": DEFAULT_FEATURES,
        "target_name": TARGET_NAME,
        "horizon_sessions": horizon,
        "benchmark": {"dataset_id": benchmark_metadata["dataset_id"], "instrument": "NIFTY 50", "content_sha256": benchmark_metadata["content_sha256"], "policy": "NIFTY 50 Price Return daily series; Total Return remains deferred pending corporate-action policy."},
        "leakage_controls": ["Features use current and trailing bars only.", "Labels compare returns over the next five sessions.", "Rows require identical stock and benchmark future timestamps.", "No missing feature values are imputed.", "Chronological purged splitting is required in Phase 20."],
        "prepared_file": data_path.name,
        "prepared_file_sha256": _sha256(data_path),
        "row_count": len(prepared),
        "first_timestamp": prepared["timestamp"].iloc[0],
        "last_timestamp": prepared["timestamp"].iloc[-1],
        "included_datasets": included,
        "excluded_datasets": excluded,
        "limitations": ["This is a research preparation dataset, not a trained model or investment signal.", "Current NIFTY 50 constituents are not used to infer historical index membership.", "Ticker transitions and quality-audit warnings remain in source provenance and need review before interpreting results."],
    }
    manifest_path = output / "prepared-manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    return manifest
