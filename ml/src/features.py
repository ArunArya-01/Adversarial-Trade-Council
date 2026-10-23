"""Feature engineering for end-of-bar research decisions.

All rolling windows end at t. The caller may predict only after t has closed
and must model any trade as occurring on a later executable bar.
"""

from __future__ import annotations


FEATURE_SCHEMA_VERSION = "1.0"
DEFAULT_FEATURES = [
    "return_1", "lag_return_1", "sma_5_ratio", "sma_20_ratio", "rsi_14",
    "macd_12_26", "rolling_volatility_20", "relative_volume_20", "momentum_20",
    "benchmark_return_1",
]


def build_features(frame, benchmark_frame=None):
    """Return a pandas DataFrame with trailing-only features and no imputation."""
    import numpy as np
    import pandas as pd

    required = {"timestamp", "open", "high", "low", "close", "volume"}
    missing = required - set(frame.columns)
    if missing:
        raise ValueError(f"market frame missing: {', '.join(sorted(missing))}")
    output = frame.sort_values("timestamp").copy()
    output["return_1"] = output["close"].pct_change()
    output["lag_return_1"] = output["return_1"].shift(1)
    output["sma_5_ratio"] = output["close"] / output["close"].rolling(5, min_periods=5).mean() - 1
    output["sma_20_ratio"] = output["close"] / output["close"].rolling(20, min_periods=20).mean() - 1
    delta = output["close"].diff()
    average_gain = delta.clip(lower=0).rolling(14, min_periods=14).mean()
    average_loss = (-delta.clip(upper=0)).rolling(14, min_periods=14).mean()
    output["rsi_14"] = 100 - 100 / (1 + average_gain / average_loss.replace(0, np.nan))
    ema_fast, ema_slow = output["close"].ewm(span=12, adjust=False, min_periods=12).mean(), output["close"].ewm(span=26, adjust=False, min_periods=26).mean()
    output["macd_12_26"] = ema_fast - ema_slow
    output["rolling_volatility_20"] = output["return_1"].rolling(20, min_periods=20).std(ddof=0)
    output["relative_volume_20"] = output["volume"] / output["volume"].rolling(20, min_periods=20).mean()
    output["momentum_20"] = output["close"] / output["close"].shift(20) - 1
    output["benchmark_return_1"] = np.nan
    if benchmark_frame is not None:
        benchmark = benchmark_frame[["timestamp", "close"]].sort_values("timestamp").copy()
        benchmark["benchmark_return_1"] = benchmark["close"].pct_change()
        output = output.merge(benchmark[["timestamp", "benchmark_return_1"]], on="timestamp", how="left", suffixes=("", "_incoming"))
        output["benchmark_return_1"] = output["benchmark_return_1_incoming"]
        output = output.drop(columns=["benchmark_return_1_incoming"])
    return output
