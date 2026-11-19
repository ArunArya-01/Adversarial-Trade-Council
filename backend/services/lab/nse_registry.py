"""Phase 16 canonical-series stitching with explicit overlap and gap reports."""

from __future__ import annotations

import hashlib
import io
import json
import csv
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

from services.lab.data_pipeline import LocalDatasetStore, validate_csv


REGISTRY_VERSION = "nse-registry-1.0"


class RegistryError(ValueError):
    pass


def _timestamp(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def _safe_name(value: str) -> str:
    return "".join(character if character.isalnum() else "_" for character in value).strip("_")


@dataclass(frozen=True)
class StitchedSeries:
    key: tuple[str, str, str]
    bars: tuple[dict[str, Any], ...]
    source_manifests: tuple[dict[str, Any], ...]
    identical_overlaps: tuple[dict[str, Any], ...]
    conflicting_overlaps: tuple[dict[str, Any], ...]
    potential_calendar_gaps: tuple[dict[str, Any], ...]

    @property
    def status(self) -> str:
        return "blocked_conflicting_overlap" if self.conflicting_overlaps else "ready_for_quality_audit"

    def report(self) -> dict[str, Any]:
        instrument, exchange, frequency = self.key
        return {
            "registry_version": REGISTRY_VERSION,
            "instrument": instrument,
            "exchange": exchange,
            "frequency": frequency,
            "status": self.status,
            "row_count": len(self.bars),
            "first_timestamp": self.bars[0]["timestamp"] if self.bars else None,
            "last_timestamp": self.bars[-1]["timestamp"] if self.bars else None,
            "source_segments": [{"source_path": item["source_path"], "source_sha256": item["source_sha256"], "source_kind": item["source_kind"], "rows_normalized": item["rows_normalized"], "source_instruments": item.get("instruments", [item.get("instrument")])} for item in self.source_manifests],
            "identical_overlaps": list(self.identical_overlaps),
            "conflicting_overlaps": list(self.conflicting_overlaps),
            "potential_calendar_gaps": list(self.potential_calendar_gaps),
            "limitations": ["Potential gaps are calendar-day observations only; NSE holidays require the Phase 17 market-calendar audit.", "Rows with unavailable benchmark/VIX volume remain unsuitable for volume-participation execution modeling."],
        }


def _read_normalized_segments(normalized_root: Path) -> list[tuple[dict[str, Any], list[dict[str, Any]]]]:
    results = []
    report_directory, segment_directory = normalized_root / "reports", normalized_root / "segments"
    if not report_directory.exists() or not segment_directory.exists():
        raise RegistryError("normalized root must contain reports/ and segments/")
    for report_path in sorted(report_directory.glob("*.json")):
        manifest = json.loads(report_path.read_text(encoding="utf-8"))
        segment_path = segment_directory / f"{report_path.stem}.jsonl"
        if not segment_path.exists():
            raise RegistryError(f"segment missing for manifest: {report_path.name}")
        bars = [json.loads(line) for line in segment_path.read_text(encoding="utf-8").splitlines() if line]
        if not bars:
            raise RegistryError(f"segment is empty: {segment_path.name}")
        results.append((manifest, bars))
    return results


def stitch_normalized_root(normalized_root: str | Path) -> list[StitchedSeries]:
    grouped: dict[tuple[str, str, str], list[tuple[dict[str, Any], list[dict[str, Any]]]]] = defaultdict(list)
    for manifest, bars in _read_normalized_segments(Path(normalized_root)):
        observed: dict[tuple[str, str, str], list[dict[str, Any]]] = defaultdict(list)
        for bar in bars:
            observed[(bar["instrument"], bar["exchange"], bar["frequency"])].append(bar)
        for key, identity_bars in observed.items():
            grouped[key].append((manifest, identity_bars))
    output = []
    for key, segments in sorted(grouped.items()):
        by_timestamp: dict[str, tuple[dict[str, Any], dict[str, Any]]] = {}
        identical, conflicting = [], []
        manifests = []
        for manifest, bars in segments:
            manifests.append(manifest)
            for bar in bars:
                timestamp = bar["timestamp"]
                prior = by_timestamp.get(timestamp)
                if prior is None:
                    by_timestamp[timestamp] = (bar, manifest)
                elif prior[0] == bar:
                    identical.append({"timestamp": timestamp, "kept_source_sha256": prior[1]["source_sha256"], "duplicate_source_sha256": manifest["source_sha256"]})
                else:
                    conflicting.append({"timestamp": timestamp, "first_source_sha256": prior[1]["source_sha256"], "conflicting_source_sha256": manifest["source_sha256"]})
        bars = tuple(value[0] for _, value in sorted(by_timestamp.items()))
        gaps = []
        for previous, current in zip(bars, bars[1:]):
            calendar_days = (_timestamp(current["timestamp"]) - _timestamp(previous["timestamp"])).days
            if calendar_days > 4:
                gaps.append({"after": previous["timestamp"], "before": current["timestamp"], "calendar_days": calendar_days})
        output.append(StitchedSeries(key, bars, tuple(manifests), tuple(identical), tuple(conflicting), tuple(gaps)))
    return output


def write_registry(normalized_root: str | Path, output_root: str | Path) -> list[StitchedSeries]:
    """Write canonical non-conflicting histories and a complete registry report."""
    series = stitch_normalized_root(normalized_root)
    root = Path(output_root)
    series_directory, report_directory = root / "series", root / "reports"
    series_directory.mkdir(parents=True, exist_ok=True)
    report_directory.mkdir(parents=True, exist_ok=True)
    entries = []
    for item in series:
        stem = "__".join(_safe_name(part) for part in item.key)
        report = item.report()
        report["series_id"] = hashlib.sha256("|".join(item.key).encode("utf-8")).hexdigest()[:16]
        (report_directory / f"{stem}.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
        if item.status == "ready_for_quality_audit":
            with (series_directory / f"{stem}.jsonl").open("w", encoding="utf-8") as handle:
                for bar in item.bars:
                    handle.write(json.dumps(bar, separators=(",", ":")) + "\n")
        entries.append(report)
    (root / "registry.json").write_text(json.dumps({"registry_version": REGISTRY_VERSION, "series": entries}, indent=2) + "\n", encoding="utf-8")
    return series


def import_ready_registry_series(stitched_root: str | Path, lab_root: str | Path | None = None) -> list[dict[str, Any]]:
    """Bulk-import only conflict-free registry series into the Lab store.

    The import metadata retains registry lineage and explicitly marks the
    dataset pending Phase 17 quality review. Raw and stitched source artifacts
    remain separate from the Lab's derived storage.
    """
    root = Path(stitched_root)
    registry_path = root / "registry.json"
    if not registry_path.exists():
        raise RegistryError("registry.json not found")
    registry = json.loads(registry_path.read_text(encoding="utf-8"))
    store = LocalDatasetStore(lab_root)
    imports = []
    fields = ["instrument", "exchange", "timestamp", "timezone", "frequency", "open", "high", "low", "close", "volume"]
    prepared = []
    for entry in registry.get("series", []):
        if entry.get("status") != "ready_for_quality_audit":
            continue
        stem = "__".join(_safe_name(entry[key]) for key in ("instrument", "exchange", "frequency"))
        series_path = root / "series" / f"{stem}.jsonl"
        if not series_path.exists():
            raise RegistryError(f"canonical series missing: {series_path.name}")
        bars = [json.loads(line) for line in series_path.read_text(encoding="utf-8").splitlines() if line]
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=fields, lineterminator="\n")
        writer.writeheader()
        writer.writerows([{field: bar[field] for field in fields} for bar in bars])
        text = output.getvalue()
        # Validate every candidate before the first write, preventing a later
        # malformed series from leaving a partially imported batch.
        validate_csv(text)
        prepared.append((entry, stem, text))
    for entry, stem, text in prepared:
        source = f"NSE registry {entry['series_id']} ({REGISTRY_VERSION}); {len(entry['source_segments'])} source segment(s)"
        metadata = store.ingest(text.encode("utf-8"), source=source, original_filename=f"{stem}.csv")
        metadata["registry_provenance"] = {"registry_version": REGISTRY_VERSION, "series_id": entry["series_id"], "source_segments": entry["source_segments"], "identical_overlaps": entry["identical_overlaps"], "potential_calendar_gaps": entry["potential_calendar_gaps"]}
        metadata["quality_status"] = "pending_phase_17_audit"
        (store.metadata_dir / f"{metadata['dataset_id']}.json").write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
        imports.append(metadata)
    return imports
