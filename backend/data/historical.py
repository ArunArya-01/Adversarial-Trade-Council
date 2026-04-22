"""
data/historical.py — Historical Market Data Ingestion
======================================================
Fetches OHLCV data from Yahoo Finance and preprocesses it into the
normalised observation vector format expected by the RL Brain.

In Phase 4, swap `fetch_ohlcv()` with Alpaca's market data API calls.
"""
from __future__ import annotations

from typing import Optional

import numpy as np
import pandas as pd

from core import logger as log

# Number of candles in each RL observation window (must match rl_brain.py)
WINDOW_SIZE = 10


def fetch_ohlcv(
    symbol: str,
    period: str = "1mo",
    interval: str = "1d",
) -> pd.DataFrame:
    """
    Fetches historical OHLCV data for the given symbol using yfinance.

    Parameters
    ----------
    symbol   : Ticker symbol, e.g. "AAPL", "BTC-USD"
    period   : yfinance period string, e.g. "1mo", "3mo", "1y"
    interval : yfinance interval string, e.g. "1d", "1h", "5m"

    Returns
    -------
    DataFrame with columns: [Open, High, Low, Close, Volume]
    Returns an empty DataFrame if the fetch fails.
    """
    try:
        import yfinance as yf  # lazy import — avoid startup cost

        log.info(f"Fetching {symbol} OHLCV ({period} / {interval})…", agent="system")
        ticker = yf.Ticker(symbol)
        df = ticker.history(period=period, interval=interval)

        if df.empty:
            log.warn(f"yfinance returned empty data for {symbol}.", agent="system")
            return pd.DataFrame()

        df = df[["Open", "High", "Low", "Close", "Volume"]].dropna()
        log.info(f"Fetched {len(df)} candles for {symbol}.", agent="system")
        return df

    except Exception as exc:
        log.warn(f"Failed to fetch OHLCV for {symbol}: {exc}", agent="system")
        return pd.DataFrame()


def preprocess(df: pd.DataFrame, window: int = WINDOW_SIZE) -> Optional[np.ndarray]:
    """
    Converts the last `window` rows of an OHLCV DataFrame into the
    normalised flat observation vector used by TradingEnv.

    Normalisation: each feature divided by its rolling mean over the window.

    Returns
    -------
    np.ndarray of shape (window * 5,) or None if data is insufficient.
    """
    if df.empty or len(df) < window:
        log.warn(
            f"Insufficient data: need {window} candles, got {len(df)}.",
            agent="system",
        )
        return None

    window_df = df.tail(window).copy()

    # Normalise each column by its mean
    col_means = window_df.mean()
    col_means = col_means.replace(0, 1)  # avoid divide-by-zero

    normed = window_df / col_means

    # Return as flat float32 array
    obs = normed[["Open", "High", "Low", "Close", "Volume"]].values.astype(np.float32)
    flat = obs.flatten()

    log.info(
        f"Preprocessed observation: shape={flat.shape}, "
        f"mean={flat.mean():.4f}, std={flat.std():.4f}",
        agent="system",
    )
    return flat


def build_obs_from_symbol(symbol: str) -> Optional[np.ndarray]:
    """
    Convenience function: fetch + preprocess in one call.
    Returns a ready-to-use RL observation or None on failure.
    """
    df = fetch_ohlcv(symbol, period="1mo", interval="1d")
    return preprocess(df)
