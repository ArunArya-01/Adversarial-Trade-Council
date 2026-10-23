"""Transparent scanner over one validated historical dataset, never live data."""

from __future__ import annotations

from typing import Any

from services.lab.data_pipeline import MarketBar, calculate_features


class ScannerError(ValueError):
    pass


def scan_latest(bars: list[MarketBar], minimum_rsi: float | None = None, require_positive_momentum: bool = False) -> dict[str, Any]:
    if not bars:
        raise ScannerError("scanner requires validated historical bars")
    if minimum_rsi is not None and not 0 <= minimum_rsi <= 100:
        raise ScannerError("minimum_rsi must be between 0 and 100")
    latest = calculate_features(bars)[-1]
    missing = [name for name in ("sma_5", "sma_20", "rsi_14", "momentum_20") if latest[name] is None]
    if missing:
        raise ScannerError(f"dataset lacks enough history for scanner fields: {', '.join(missing)}")
    qualifications = {
        "close_above_sma_20": latest["close"] > latest["sma_20"],
        "short_trend_above_long_trend": latest["sma_5"] > latest["sma_20"],
        "minimum_rsi": minimum_rsi is None or latest["rsi_14"] >= minimum_rsi,
        "positive_momentum_20": not require_positive_momentum or latest["momentum_20"] > 0,
    }
    return {
        "data_kind": "historical",
        "as_of": latest["timestamp"],
        "instrument": latest["instrument"],
        "exchange": latest["exchange"],
        "qualified": all(qualifications.values()),
        "qualifications": qualifications,
        "observed_features": {key: latest[key] for key in ("close", "sma_5", "sma_20", "rsi_14", "momentum_20", "relative_volume_20")},
        "notice": "Historical screen only, not a live quote, investment recommendation, or order instruction.",
    }
