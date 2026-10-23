"""Mock-only tests for the Groww market-data boundary; no network is used."""

import unittest
from datetime import datetime, timezone

from services.lab.market_data import (
    GrowwMarketDataAdapter,
    InstrumentRef,
    ProviderUnavailableError,
    RateLimitError,
    SlidingWindowRateLimiter,
    StaleMarketDataError,
)


NOW = datetime(2026, 10, 23, 10, 0, tzinfo=timezone.utc)
INSTRUMENT = InstrumentRef(exchange="NSE", segment="CASH", trading_symbol="RELIANCE")


def successful_payload(timestamp=1792749570000):
    return {
        "status": "SUCCESS",
        "payload": {
            "last_price": 1450.25,
            "last_trade_time": timestamp,
            "ohlc": {"open": 1440, "high": 1460, "low": 1435, "close": 1448},
            "depth": {"buy": [{"price": 1450, "quantity": 5}], "sell": [{"price": 1450.5, "quantity": 2}]},
        },
    }


class GrowwMarketDataTests(unittest.TestCase):
    def test_disabled_adapter_does_not_call_provider(self):
        called = []
        adapter = GrowwMarketDataAdapter(enabled=False, access_token="secret", transport=lambda *_: called.append(True))
        self.assertEqual(adapter.status().state, "disabled")
        with self.assertRaises(ProviderUnavailableError):
            adapter.get_quote(INSTRUMENT)
        self.assertEqual(called, [])

    def test_normalizes_live_quote_from_mock_transport(self):
        seen = {}

        def transport(method, url, headers):
            seen.update(method=method, url=url, headers=headers)
            return successful_payload()

        adapter = GrowwMarketDataAdapter(enabled=True, access_token="server-only-token", transport=transport, now=lambda: NOW)
        quote = adapter.get_quote(INSTRUMENT, max_staleness_seconds=60)
        self.assertEqual(seen["method"], "GET")
        self.assertIn("/quote?", seen["url"])
        self.assertNotIn("server-only-token", seen["url"])
        self.assertEqual(seen["headers"]["Authorization"], "Bearer server-only-token")
        self.assertEqual(quote.source, "groww-live-quote")
        self.assertEqual(quote.depth["buy"][0]["quantity"], 5.0)

    def test_stale_quote_is_rejected_without_fallback(self):
        adapter = GrowwMarketDataAdapter(enabled=True, access_token="token", transport=lambda *_: successful_payload(0), now=lambda: NOW)
        with self.assertRaises(StaleMarketDataError):
            adapter.get_quote(INSTRUMENT, max_staleness_seconds=30)

    def test_historical_candles_are_explicitly_blocked(self):
        with self.assertRaises(ProviderUnavailableError):
            GrowwMarketDataAdapter().get_historical_candles(INSTRUMENT)

    def test_rate_limiter_blocks_excessive_live_requests(self):
        clock = lambda: 100.0
        limiter = SlidingWindowRateLimiter(per_second=1, per_minute=2, clock=clock)
        limiter.acquire()
        with self.assertRaises(RateLimitError):
            limiter.acquire()
