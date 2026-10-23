"""Safe market-data provider boundary for the Investment Lab.

The Groww implementation intentionally supports *live quote reads only*.  It
does not contain order, portfolio, or trading operations.  Historical candles
remain unavailable until Groww's non-deprecated historical endpoint and the
account entitlement have both been verified.
"""

from __future__ import annotations

import json
import os
from collections import deque
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from time import monotonic
from typing import Any, Callable
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


class MarketDataError(RuntimeError):
    """Base error for a provider read; callers must never substitute data."""


class ProviderUnavailableError(MarketDataError):
    pass


class RateLimitError(MarketDataError):
    pass


class StaleMarketDataError(MarketDataError):
    pass


class MarketDataValidationError(MarketDataError):
    pass


@dataclass(frozen=True)
class InstrumentRef:
    exchange: str
    segment: str
    trading_symbol: str

    def validate(self) -> None:
        for field, value in asdict(self).items():
            if not value or value != value.strip():
                raise MarketDataValidationError(f"{field} must be a non-empty, trimmed string")


@dataclass(frozen=True)
class MarketDataStatus:
    provider: str
    state: str
    message: str
    historical_candles: str
    live_quotes: str
    checked_at: datetime

    def to_dict(self) -> dict[str, Any]:
        return {**asdict(self), "checked_at": self.checked_at.isoformat()}


@dataclass(frozen=True)
class MarketQuote:
    instrument: InstrumentRef
    last_price: float
    received_at: datetime
    source_timestamp: datetime | None
    source: str
    data_kind: str
    ohlc: dict[str, float]
    depth: dict[str, list[dict[str, float]]]

    def age_seconds(self, now: datetime) -> float:
        reference = self.source_timestamp or self.received_at
        return max(0.0, (now - reference).total_seconds())

    def to_dict(self, now: datetime) -> dict[str, Any]:
        return {
            "instrument": asdict(self.instrument),
            "last_price": self.last_price,
            "received_at": self.received_at.isoformat(),
            "source_timestamp": self.source_timestamp.isoformat() if self.source_timestamp else None,
            "source": self.source,
            "data_kind": self.data_kind,
            "freshness_seconds": self.age_seconds(now),
            "ohlc": self.ohlc,
            "depth": self.depth,
        }


class SlidingWindowRateLimiter:
    """Small local guard for Groww's documented live-data request budget."""

    def __init__(self, per_second: int = 10, per_minute: int = 300, clock: Callable[[], float] = monotonic):
        self.per_second = per_second
        self.per_minute = per_minute
        self.clock = clock
        self._requests: deque[float] = deque()

    def acquire(self) -> None:
        now = self.clock()
        while self._requests and now - self._requests[0] >= 60:
            self._requests.popleft()
        second_count = sum(requested_at > now - 1 for requested_at in self._requests)
        if second_count >= self.per_second or len(self._requests) >= self.per_minute:
            raise RateLimitError("local Groww live-data request budget exhausted; retry later")
        self._requests.append(now)


Transport = Callable[[str, str, dict[str, str]], dict[str, Any]]


class GrowwMarketDataAdapter:
    """Credential-safe adapter around Groww's verified live-quote endpoint."""

    base_url = "https://api.groww.in/v1/live-data"

    def __init__(
        self,
        access_token: str | None = None,
        enabled: bool | None = None,
        transport: Transport | None = None,
        now: Callable[[], datetime] | None = None,
        limiter: SlidingWindowRateLimiter | None = None,
    ):
        self.access_token = access_token if access_token is not None else os.getenv("GROWW_ACCESS_TOKEN", "")
        self.enabled = enabled if enabled is not None else os.getenv("GROWW_API_ENABLED", "false").lower() == "true"
        self.transport = transport or self._http_transport
        self.now = now or (lambda: datetime.now(timezone.utc))
        self.limiter = limiter or SlidingWindowRateLimiter()

    def status(self) -> MarketDataStatus:
        checked_at = self.now()
        if not self.enabled:
            return MarketDataStatus("groww", "disabled", "Set GROWW_API_ENABLED=true only after confirming an active Groww API entitlement.", "unverified", "disabled", checked_at)
        if not self.access_token:
            return MarketDataStatus("groww", "credentials_missing", "GROWW_ACCESS_TOKEN is not configured on the server.", "unverified", "configured", checked_at)
        return MarketDataStatus("groww", "configured", "Credentials are present but no connection has been attempted by this status check.", "unverified", "available-on-request", checked_at)

    def get_historical_candles(self, *_: Any, **__: Any) -> None:
        raise ProviderUnavailableError(
            "Groww historical candles are disabled: the documented legacy endpoint is deprecated and a replacement endpoint/account entitlement has not been verified."
        )

    def get_quote(self, instrument: InstrumentRef, max_staleness_seconds: float = 60) -> MarketQuote:
        instrument.validate()
        if not self.enabled:
            raise ProviderUnavailableError("Groww market data is disabled; no live request was attempted")
        if not self.access_token:
            raise ProviderUnavailableError("Groww access token is missing; no live request was attempted")
        if max_staleness_seconds <= 0:
            raise MarketDataValidationError("max_staleness_seconds must be positive")

        self.limiter.acquire()
        query = urlencode(asdict(instrument))
        headers = {"Authorization": f"Bearer {self.access_token}", "Accept": "application/json", "X-API-VERSION": "1.0"}
        try:
            payload = self.transport("GET", f"{self.base_url}/quote?{query}", headers)
        except RateLimitError:
            raise
        except Exception as error:
            raise ProviderUnavailableError("Groww live quote request failed; no substitute data was used") from error
        quote = self._parse_quote(instrument, payload)
        if quote.age_seconds(self.now()) > max_staleness_seconds:
            raise StaleMarketDataError("Groww quote exceeds the requested freshness threshold")
        return quote

    def _parse_quote(self, instrument: InstrumentRef, payload: dict[str, Any]) -> MarketQuote:
        if not isinstance(payload, dict) or payload.get("status") != "SUCCESS":
            if isinstance(payload, dict) and str(payload.get("status_code")) == "429":
                raise RateLimitError("Groww rejected the request due to a rate limit")
            raise MarketDataValidationError("Groww quote response did not report SUCCESS")
        data = payload.get("payload")
        if not isinstance(data, dict):
            raise MarketDataValidationError("Groww quote response is missing its payload")
        last_price = self._number(data.get("last_price"), "last_price")
        received_at = self.now()
        source_timestamp = self._parse_timestamp(data.get("last_trade_time"))
        ohlc_raw = data.get("ohlc") or {}
        ohlc = {key: self._number(value, f"ohlc.{key}") for key, value in ohlc_raw.items() if key in {"open", "high", "low", "close"}}
        depth_raw = data.get("depth") or {}
        depth = {side: self._parse_depth(depth_raw.get(side, []), side) for side in ("buy", "sell")}
        return MarketQuote(instrument, last_price, received_at, source_timestamp, "groww-live-quote", "live", ohlc, depth)

    @staticmethod
    def _number(value: Any, field: str) -> float:
        try:
            parsed = float(value)
        except (TypeError, ValueError) as error:
            raise MarketDataValidationError(f"Groww response has invalid {field}") from error
        if parsed < 0:
            raise MarketDataValidationError(f"Groww response has negative {field}")
        return parsed

    def _parse_depth(self, entries: Any, side: str) -> list[dict[str, float]]:
        if not isinstance(entries, list):
            raise MarketDataValidationError(f"Groww response has invalid depth.{side}")
        parsed: list[dict[str, float]] = []
        for entry in entries:
            if not isinstance(entry, dict):
                raise MarketDataValidationError(f"Groww response has invalid depth.{side} entry")
            parsed.append({"price": self._number(entry.get("price"), f"depth.{side}.price"), "quantity": self._number(entry.get("quantity"), f"depth.{side}.quantity")})
        return parsed

    @staticmethod
    def _parse_timestamp(value: Any) -> datetime | None:
        if value in (None, ""):
            return None
        try:
            # Groww documents epoch milliseconds for quote timestamps.
            return datetime.fromtimestamp(float(value) / 1000, tz=timezone.utc)
        except (TypeError, ValueError, OSError) as error:
            raise MarketDataValidationError("Groww response has invalid last_trade_time") from error

    @staticmethod
    def _http_transport(method: str, url: str, headers: dict[str, str]) -> dict[str, Any]:
        request = Request(url, headers=headers, method=method)
        try:
            with urlopen(request, timeout=10) as response:  # nosec B310 - fixed official Groww HTTPS URL
                return json.loads(response.read().decode("utf-8"))
        except HTTPError as error:
            if error.code == 429:
                raise RateLimitError("Groww rejected the request due to a rate limit") from error
            raise ProviderUnavailableError(f"Groww returned HTTP {error.code}") from error
        except (URLError, json.JSONDecodeError) as error:
            raise ProviderUnavailableError("Groww returned an unreadable response") from error
