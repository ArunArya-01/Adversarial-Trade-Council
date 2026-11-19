"""Forward-looking labels, deliberately kept separate from feature construction."""

from __future__ import annotations


TARGET_NAME = "outperforms_benchmark_5d"


def add_outperformance_label(frame, benchmark_frame, horizon: int = 5):
    """Label t using matched-session returns from t to t+horizon.

    A label is withheld when an instrument and benchmark do not reach the
    same future session.  This avoids silently comparing a stock's five
    observed bars with a different five-session benchmark interval.
    """
    if horizon < 1:
        raise ValueError("horizon must be positive")
    market = frame.sort_values("timestamp").copy()
    benchmark = benchmark_frame[["timestamp", "close"]].sort_values("timestamp").copy()
    market["future_return"] = market["close"].shift(-horizon) / market["close"] - 1
    market["future_timestamp"] = market["timestamp"].shift(-horizon)
    benchmark["benchmark_future_return"] = benchmark["close"].shift(-horizon) / benchmark["close"] - 1
    benchmark["benchmark_future_timestamp"] = benchmark["timestamp"].shift(-horizon)
    labelled = market.merge(benchmark[["timestamp", "benchmark_future_return", "benchmark_future_timestamp"]], on="timestamp", how="left")
    valid = (
        labelled["future_return"].notna()
        & labelled["benchmark_future_return"].notna()
        & (labelled["future_timestamp"] == labelled["benchmark_future_timestamp"])
    )
    labelled[TARGET_NAME] = None
    labelled.loc[valid, TARGET_NAME] = (labelled.loc[valid, "future_return"] > labelled.loc[valid, "benchmark_future_return"]).astype(int)
    return labelled
