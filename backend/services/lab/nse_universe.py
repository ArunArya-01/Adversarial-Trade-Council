"""Auditable multi-asset NSE historical-universe scanning.

The supplied NIFTY 50 constituent export is a current constituent list, not a
point-in-time membership history.  It is therefore useful for selecting a
research coverage universe, but must not be used to reconstruct old index
membership or cross-sectional ML labels without a dated membership dataset.
"""

from __future__ import annotations

import csv
import os
from datetime import date, datetime
from pathlib import Path
from typing import Any

from services.lab.data_pipeline import DatasetValidationError, LocalDatasetStore
from services.lab.scanner import ScannerError, scan_latest


UNIVERSE_VERSION = "nse-current-nifty50-research-universe-1.0"
AUDITED_STATUSES = {"audited", "audited_with_warnings"}


class UniverseError(ValueError):
    pass


def default_constituent_path() -> Path:
    configured = os.getenv("NSE_NIFTY50_CONSTITUENTS_PATH")
    if configured:
        return Path(configured)
    return Path(__file__).resolve().parents[3] / "data" / "TradeMindData" / "originals" / "benchmark" / "ind_nifty50list.csv"


def load_current_constituents(path: str | Path | None = None) -> dict[str, dict[str, str]]:
    """Load the downloaded NSE constituent export without assigning it a past date."""
    source = Path(path or default_constituent_path())
    if not source.exists():
        raise UniverseError("NIFTY 50 constituent export is unavailable; configure NSE_NIFTY50_CONSTITUENTS_PATH")
    try:
        with source.open(encoding="utf-8-sig", newline="") as handle:
            rows = list(csv.DictReader(handle))
    except OSError as error:
        raise UniverseError("could not read NIFTY 50 constituent export") from error
    if not rows or "Symbol" not in (rows[0] or {}):
        raise UniverseError("NIFTY 50 constituent export must include a Symbol column")
    constituents = {
        (row.get("Symbol") or "").strip().upper(): {
            "symbol": (row.get("Symbol") or "").strip().upper(),
            "company_name": (row.get("Company Name") or "").strip(),
            "industry": (row.get("Industry") or "").strip(),
            "series": (row.get("Series") or "").strip(),
            "isin": (row.get("ISIN Code") or "").strip(),
        }
        for row in rows
        if (row.get("Symbol") or "").strip()
    }
    if not constituents:
        raise UniverseError("NIFTY 50 constituent export contains no symbols")
    return constituents


def _as_of_timestamp(value: str) -> str:
    """Accept a NSE daily date or exact offset-aware timestamp.

    Daily NSE data in this project is timestamped at the documented 15:30
    Asia/Kolkata session close.  A date means precisely that daily close.
    """
    try:
        parsed_date = date.fromisoformat(value)
        return f"{parsed_date.isoformat()}T15:30:00+05:30"
    except ValueError:
        pass
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as error:
        raise UniverseError("as_of must be YYYY-MM-DD or an ISO-8601 timestamp with an offset") from error
    if parsed.tzinfo is None:
        raise UniverseError("as_of timestamp must include an offset")
    return parsed.isoformat()


def scan_current_nifty50_universe(
    as_of: str,
    minimum_rsi: float | None = None,
    require_positive_momentum: bool = False,
    store: LocalDatasetStore | None = None,
    constituent_path: str | Path | None = None,
) -> dict[str, Any]:
    """Scan audited locally imported equities on one exact historical close.

    Every successful result is calculated using bars at or before ``as_of``;
    an exact session match is required so returned assets share one timestamp.
    """
    target = _as_of_timestamp(as_of)
    store = store or LocalDatasetStore()
    constituents = load_current_constituents(constituent_path)
    results, excluded = [], []
    for metadata in store.list_datasets():
        symbol = str(metadata.get("instrument", "")).upper()
        if symbol not in constituents or metadata.get("exchange") != "NSE" or metadata.get("frequency") != "1d":
            continue
        dataset_id = metadata["dataset_id"]
        quality_status = metadata.get("quality_status")
        if quality_status not in AUDITED_STATUSES:
            excluded.append({"dataset_id": dataset_id, "symbol": symbol, "reason": "dataset has not passed the required historical quality audit", "quality_status": quality_status})
            continue
        try:
            bars = store.load_clean_bars(dataset_id)
        except DatasetValidationError as error:
            excluded.append({"dataset_id": dataset_id, "symbol": symbol, "reason": str(error), "quality_status": quality_status})
            continue
        available = [bar for bar in bars if bar.timestamp <= target]
        if not available or available[-1].timestamp != target:
            excluded.append({"dataset_id": dataset_id, "symbol": symbol, "reason": "no bar at the shared as_of timestamp", "quality_status": quality_status})
            continue
        try:
            scan = scan_latest(available, minimum_rsi, require_positive_momentum)
        except ScannerError as error:
            excluded.append({"dataset_id": dataset_id, "symbol": symbol, "reason": str(error), "quality_status": quality_status})
            continue
        results.append({
            "dataset_id": dataset_id,
            "source": metadata["source"],
            "content_sha256": metadata["content_sha256"],
            "quality_status": quality_status,
            "constituent": constituents[symbol],
            **scan,
        })
    results.sort(key=lambda item: (not item["qualified"], item["instrument"]))
    excluded.sort(key=lambda item: (item["symbol"], item["dataset_id"]))
    return {
        "data_kind": "historical",
        "universe_id": "nse-current-nifty50-research-coverage",
        "universe_version": UNIVERSE_VERSION,
        "as_of": target,
        "membership_policy": "Current downloaded NIFTY 50 constituent export only; it is not a historical point-in-time constituent history.",
        "results": results,
        "excluded": excluded,
        "summary": {"constituents_in_export": len(constituents), "eligible_on_shared_timestamp": len(results), "qualified": sum(item["qualified"] for item in results), "excluded": len(excluded)},
        "notice": "Historical research screen only. It does not use future bars, provide live quotes, recommend investments, or place orders.",
    }
