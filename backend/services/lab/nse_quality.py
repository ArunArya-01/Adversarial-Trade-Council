"""Phase 17 quality audit for stitched NSE daily historical series.

The audit reports evidence and candidate issues. It never applies corporate
action adjustments or silently repairs prices, volumes, gaps, or symbols.
"""

from __future__ import annotations

import json
import math
from datetime import datetime
from pathlib import Path
from statistics import median
from typing import Any


QUALITY_AUDIT_VERSION = "nse-quality-audit-1.0"
BENCHMARK_POLICY = "NIFTY 50 Price Return daily series; Total Return files are deferred pending explicit dividend/corporate-action policy."


class QualityAuditError(ValueError):
    pass


def _read_bars(path: Path) -> list[dict[str, Any]]:
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line]


def _day(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def _audit_one(entry: dict[str, Any], bars: list[dict[str, Any]], benchmark_dates: set[str]) -> dict[str, Any]:
    critical, warnings, return_flags, volume_flags = [], [], [], []
    timestamps = []
    for index, bar in enumerate(bars, start=1):
        try:
            current = _day(bar["timestamp"])
            timestamps.append(current)
            values = [float(bar[key]) for key in ("open", "high", "low", "close", "volume")]
            open_price, high, low, close, volume = values
            if not all(math.isfinite(value) for value in values) or min(open_price, high, low, close) <= 0 or volume < 0:
                critical.append({"row": index, "timestamp": bar.get("timestamp"), "reason": "non-finite, non-positive OHLC, or negative volume"})
            elif high < max(open_price, close) or low > min(open_price, close) or high < low:
                critical.append({"row": index, "timestamp": bar.get("timestamp"), "reason": "invalid OHLC relationship"})
        except (KeyError, TypeError, ValueError):
            critical.append({"row": index, "timestamp": bar.get("timestamp"), "reason": "invalid row schema"})
    if any(later <= earlier for earlier, later in zip(timestamps, timestamps[1:])):
        critical.append({"reason": "timestamps are not strictly increasing"})
    for prior, current in zip(bars, bars[1:]):
        prior_close, close = float(prior["close"]), float(current["close"])
        change = close / prior_close - 1
        if abs(change) >= 0.20:
            return_flags.append({"timestamp": current["timestamp"], "return": change, "reason": "large daily return; review for corporate action, data revision, or market event"})
    reported_volume = any(float(bar["volume"]) > 0 for bar in bars)
    if reported_volume:
        positive_volumes = [float(bar["volume"]) for bar in bars if float(bar["volume"]) > 0]
        baseline = median(positive_volumes) if positive_volumes else 0
        if baseline:
            for bar in bars:
                ratio = float(bar["volume"]) / baseline
                if ratio >= 20:
                    volume_flags.append({"timestamp": bar["timestamp"], "volume_ratio_to_series_median": ratio, "reason": "unusually high volume; review data/event context"})
    else:
        warnings.append("volume unavailable for this index/volatility series; volume-participation analysis is disabled")
    transition_sources = [segment for segment in entry["source_segments"] if len([symbol for symbol in segment.get("source_instruments", []) if symbol]) > 1]
    if transition_sources:
        warnings.append("one or more raw source segments contain observed ticker transitions; series were split by observed ticker and require corporate-action/symbol review")
    if entry["potential_calendar_gaps"]:
        warnings.append("potential calendar gaps require NSE holiday/calendar review; they are not automatically missing sessions")
    if return_flags:
        warnings.append("large daily-return candidates require corporate-action/data-event review")
    if volume_flags:
        warnings.append("unusually high volume candidates require event/data review")
    instrument = entry["instrument"]
    is_stock = instrument not in {"NIFTY 50", "INDIA VIX"}
    matched = sum(bar["timestamp"] in benchmark_dates for bar in bars) if is_stock else None
    alignment = None if not is_stock else {"benchmark": "NIFTY 50 Price Return", "matched_sessions": matched, "unmatched_sessions": len(bars) - matched, "match_fraction": matched / len(bars) if bars else 0}
    if alignment and alignment["match_fraction"] < 0.95:
        warnings.append("benchmark alignment below 95%; inspect listing dates and benchmark coverage before ML labels")
    return {"quality_audit_version": QUALITY_AUDIT_VERSION, "series_id": entry["series_id"], "instrument": instrument, "exchange": entry["exchange"], "frequency": entry["frequency"], "status": "blocked" if critical else "audited_with_warnings" if warnings else "audited", "benchmark_policy": BENCHMARK_POLICY, "row_count": len(bars), "critical_issues": critical, "warnings": warnings, "large_return_candidates": return_flags, "volume_anomaly_candidates": volume_flags, "ticker_transition_sources": transition_sources, "potential_calendar_gaps": entry["potential_calendar_gaps"], "benchmark_alignment": alignment}


def audit_registry(stitched_root: str | Path) -> list[dict[str, Any]]:
    root = Path(stitched_root)
    registry_path = root / "registry.json"
    if not registry_path.exists():
        raise QualityAuditError("registry.json not found")
    registry = json.loads(registry_path.read_text(encoding="utf-8"))
    entries = registry.get("series", [])
    benchmark = next((entry for entry in entries if entry["instrument"] == "NIFTY 50" and entry["frequency"] == "1d"), None)
    if benchmark is None:
        raise QualityAuditError("NIFTY 50 Price Return benchmark series is required")
    benchmark_path = root / "series" / "NIFTY_50__NSE__1d.jsonl"
    benchmark_dates = {bar["timestamp"] for bar in _read_bars(benchmark_path)}
    audits = []
    for entry in entries:
        stem = "__".join("".join(character if character.isalnum() else "_" for character in entry[key]).strip("_") for key in ("instrument", "exchange", "frequency"))
        series_path = root / "series" / f"{stem}.jsonl"
        if not series_path.exists():
            audits.append({"series_id": entry["series_id"], "instrument": entry["instrument"], "status": "blocked", "critical_issues": [{"reason": "canonical series file missing"}]})
            continue
        audits.append(_audit_one(entry, _read_bars(series_path), benchmark_dates))
    return audits


def write_quality_audit(stitched_root: str | Path, output_root: str | Path, lab_root: str | Path | None = None) -> list[dict[str, Any]]:
    audits = audit_registry(stitched_root)
    root = Path(output_root)
    root.mkdir(parents=True, exist_ok=True)
    for audit in audits:
        token = audit["series_id"]
        (root / f"{token}.json").write_text(json.dumps(audit, indent=2) + "\n", encoding="utf-8")
    (root / "quality-registry.json").write_text(json.dumps({"quality_audit_version": QUALITY_AUDIT_VERSION, "benchmark_policy": BENCHMARK_POLICY, "series": audits}, indent=2) + "\n", encoding="utf-8")
    if lab_root is not None:
        metadata_directory = Path(lab_root) / "metadata"
        for path in metadata_directory.glob("*.json"):
            metadata = json.loads(path.read_text(encoding="utf-8"))
            series_id = metadata.get("registry_provenance", {}).get("series_id")
            audit = next((item for item in audits if item["series_id"] == series_id), None)
            if audit:
                metadata["quality_status"] = audit["status"]
                metadata["quality_audit"] = {"version": QUALITY_AUDIT_VERSION, "critical_issue_count": len(audit.get("critical_issues", [])), "warning_count": len(audit.get("warnings", []))}
                path.write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    return audits
