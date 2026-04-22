"""
data/websocket_handler.py — Market Data Streamer
=================================================
Manages live market data WebSocket connections.

Current state (Phase 1): Emits synthetic tick data on a 1-second interval
using Geometric Brownian Motion, so the frontend can connect and visualise
real-time prices immediately without requiring API keys.

Phase 4 upgrade: Replace `_synthetic_tick()` with Alpaca's WebSocket
market data stream (wss://stream.data.alpaca.markets/v2/iex).
"""
from __future__ import annotations

import asyncio
import json
import math
import random
from datetime import datetime, timezone
from typing import Optional

from core import logger as log


# ── Tick Data Types ───────────────────────────────────────────────────────────

def _synthetic_tick(
    symbol: str,
    last_price: float,
    mu: float = 0.00005,
    sigma: float = 0.002,
) -> dict:
    """
    Generate a single synthetic tick using a log-normal price step.
    Simulates realistic intra-second price movement.
    """
    dt = 1.0
    rand = random.gauss(0, 1)
    price = last_price * math.exp((mu - 0.5 * sigma ** 2) * dt + sigma * rand)
    volume = int(abs(random.gauss(5000, 1500)))
    bid = price * (1 - random.uniform(0.0001, 0.0005))
    ask = price * (1 + random.uniform(0.0001, 0.0005))

    return {
        "type": "TICK",
        "symbol": symbol,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "price": round(price, 4),
        "bid": round(bid, 4),
        "ask": round(ask, 4),
        "spread": round(ask - bid, 4),
        "volume": volume,
    }


# ── Market Data Streamer ──────────────────────────────────────────────────────

class MarketDataStreamer:
    """
    Manages a set of symbols and streams synthetic tick data.

    Usage (in main.py lifespan):
        streamer = MarketDataStreamer()
        streamer.add_symbol("AAPL", seed_price=215.0)
        task = asyncio.create_task(streamer.run())
        # ... on shutdown:
        task.cancel()

    Callbacks registered via `on_tick` receive each tick dict.
    """

    def __init__(self) -> None:
        self._symbols: dict[str, float] = {}  # symbol → last price
        self._callbacks: list = []
        self._running = False

    def add_symbol(self, symbol: str, seed_price: float = 100.0) -> None:
        self._symbols[symbol] = seed_price
        log.info(f"MarketDataStreamer: tracking {symbol} @ ${seed_price:.2f}", agent="system")

    def on_tick(self, callback) -> None:
        """Register a coroutine callback that receives each tick dict."""
        self._callbacks.append(callback)

    async def run(self, interval_sec: float = 1.0) -> None:
        """
        Main streaming loop. Generates one tick per symbol per `interval_sec`.
        Cancel this coroutine to stop streaming.
        """
        self._running = True
        log.info(
            f"MarketDataStreamer started — {len(self._symbols)} symbols, "
            f"{interval_sec}s interval (SYNTHETIC MODE).",
            agent="system",
        )

        try:
            while self._running:
                for symbol, last_price in self._symbols.items():
                    tick = _synthetic_tick(symbol, last_price)
                    self._symbols[symbol] = tick["price"]  # update for next iteration

                    # Fire all registered callbacks
                    for cb in self._callbacks:
                        try:
                            if asyncio.iscoroutinefunction(cb):
                                await cb(tick)
                            else:
                                cb(tick)
                        except Exception as exc:
                            log.warn(f"Tick callback error: {exc}", agent="system")

                await asyncio.sleep(interval_sec)

        except asyncio.CancelledError:
            self._running = False
            log.info("MarketDataStreamer stopped.", agent="system")

    def stop(self) -> None:
        self._running = False


# ── Module-level default streamer ─────────────────────────────────────────────
# Pre-seeded with common paper-trading symbols.
# main.py's lifespan registers the WebSocket broadcast callback.

default_streamer = MarketDataStreamer()
default_streamer.add_symbol("AAPL", seed_price=215.50)
default_streamer.add_symbol("NVDA", seed_price=875.30)
default_streamer.add_symbol("BTC-USD", seed_price=68_250.00)
default_streamer.add_symbol("SPY", seed_price=540.15)
