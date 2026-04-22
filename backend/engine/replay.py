"""
engine/replay.py — TradeMind Market Replay Engine
===================================================
Streams historical OHLCV candle data tick-by-tick, simulating a live
market feed from a pre-loaded CSV file.

MarketReplay loads a CSV into a Pandas DataFrame, then exposes:
  • stream()        — async generator yielding one candle dict per interval
  • get_snapshot()  — returns the last N candles synchronously (page load)
  • reset()         — rewinds to the beginning of the data

The WebSocket handler in main.py drives this generator and broadcasts
each candle to all connected frontend clients.

CSV format expected (AAPL_1d.csv):
  date, open, high, low, close, volume
"""
from __future__ import annotations

import asyncio
import os
from datetime import datetime
from pathlib import Path
from typing import AsyncGenerator, Optional

import pandas as pd


SAMPLE_DATA_DIR = Path(__file__).parent / "sample_data"
DEFAULT_INTERVAL_SEC = 0.8   # seconds between candles (controls replay speed)


class MarketReplay:
    """
    Tick-by-tick market replay engine backed by a CSV file.

    Usage
    -----
    replay = MarketReplay()
    replay.load("AAPL")

    # Async streaming (WebSocket):
    async for candle in replay.stream():
        await websocket.send_json(candle)

    # Or snapshot for initial page load:
    last_30 = replay.get_snapshot(30)
    """

    def __init__(self) -> None:
        self._df: Optional[pd.DataFrame] = None
        self._symbol: str = ""
        self._cursor: int = 0

    # ── Data Loading ──────────────────────────────────────────────────────────

    def load(self, symbol: str) -> "MarketReplay":
        """
        Loads the CSV file for the given symbol from engine/sample_data/.
        Raises FileNotFoundError if the CSV is not present.
        """
        csv_path = SAMPLE_DATA_DIR / f"{symbol}_1d.csv"
        if not csv_path.exists():
            raise FileNotFoundError(
                f"No sample data found for '{symbol}'. "
                f"Expected: {csv_path}"
            )

        df = pd.read_csv(csv_path, parse_dates=["date"])
        df = df.sort_values("date").reset_index(drop=True)
        df.columns = [c.lower().strip() for c in df.columns]

        # Validate required columns
        required = {"date", "open", "high", "low", "close", "volume"}
        missing = required - set(df.columns)
        if missing:
            raise ValueError(f"CSV is missing columns: {missing}")

        self._df = df
        self._symbol = symbol
        self._cursor = 0
        print(f"[Replay] Loaded {len(df)} candles for {symbol}.")
        return self

    # ── Streaming ─────────────────────────────────────────────────────────────

    async def stream(
        self,
        interval_sec: float = DEFAULT_INTERVAL_SEC,
        loop: bool = True,
    ) -> AsyncGenerator[dict, None]:
        """
        Async generator that yields one candle dict per `interval_sec`.

        Parameters
        ----------
        interval_sec : float
            Delay between candles (controls replay speed). Default 0.8s.
        loop : bool
            If True, restarts from the beginning when the data is exhausted.
        """
        if self._df is None:
            raise RuntimeError("Call load(symbol) before stream().")

        while True:
            if self._cursor >= len(self._df):
                if loop:
                    self._cursor = 0
                else:
                    return

            candle = self._row_to_dict(self._cursor)
            self._cursor += 1
            yield candle
            await asyncio.sleep(interval_sec)

    # ── Snapshot (for initial page load) ──────────────────────────────────────

    def get_snapshot(self, n: int = 60) -> list[dict]:
        """
        Returns the last `n` candles as a list (most recent last).
        Used to populate the chart immediately when a client connects.
        """
        if self._df is None:
            return []
        tail = self._df.tail(n)
        return [self._row_to_dict(i) for i in tail.index]

    def get_current_price(self) -> Optional[float]:
        """Returns the close price of the most recently streamed candle."""
        if self._df is None or self._cursor == 0:
            return None
        idx = min(self._cursor - 1, len(self._df) - 1)
        return float(self._df.iloc[idx]["close"])

    # ── Control ───────────────────────────────────────────────────────────────

    def reset(self) -> None:
        """Rewind the replay cursor to the beginning of the dataset."""
        self._cursor = 0

    @property
    def total_candles(self) -> int:
        return len(self._df) if self._df is not None else 0

    @property
    def symbol(self) -> str:
        return self._symbol

    # ── Internal ──────────────────────────────────────────────────────────────

    def _row_to_dict(self, idx: int) -> dict:
        row = self._df.iloc[idx]
        return {
            "type":   "CANDLE",
            "symbol": self._symbol,
            "date":   row["date"].isoformat() if hasattr(row["date"], "isoformat") else str(row["date"]),
            "open":   round(float(row["open"]),   4),
            "high":   round(float(row["high"]),   4),
            "low":    round(float(row["low"]),    4),
            "close":  round(float(row["close"]),  4),
            "volume": int(row["volume"]),
            "index":  idx,
        }


# ── Module-level default instance ─────────────────────────────────────────────
# main.py loads AAPL data into this instance at startup.
default_replay = MarketReplay()
