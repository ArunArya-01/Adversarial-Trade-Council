"""Reproducible local CSV ingestion for the Investment Lab.

The pipeline intentionally accepts historical data only. It stores the original
upload separately from validated bars and derived features, and records enough
provenance to make a later research run traceable.
"""

from __future__ import annotations

import csv
import hashlib
import io
import json
import math
import os
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from statistics import pstdev
from typing import Any, Iterable


REQUIRED_COLUMNS = {
    "instrument", "exchange", "timestamp", "timezone", "frequency",
    "open", "high", "low", "close", "volume",
}
MAX_UPLOAD_BYTES = 20 * 1024 * 1024


class DatasetValidationError(ValueError):
    """Raised when a local dataset cannot be safely used for research."""


@dataclass(frozen=True)
class MarketBar:
    instrument: str
    exchange: str
    timestamp: str
    timezone: str
    frequency: str
    open: float
    high: float
    low: float
    close: float
    volume: float


def _number(row: dict[str, str], field: str, line: int) -> float:
    try:
        value = float((row.get(field) or "").strip())
    except (TypeError, ValueError) as error:
        raise DatasetValidationError(f"row {line}: {field} must be numeric") from error
    if not math.isfinite(value):
        raise DatasetValidationError(f"row {line}: {field} must be finite")
    return value


def _timestamp(value: str, line: int) -> str:
    try:
        parsed = datetime.fromisoformat(value.strip().replace("Z", "+00:00"))
    except (AttributeError, ValueError) as error:
        raise DatasetValidationError(f"row {line}: timestamp must be ISO-8601") from error
    if parsed.tzinfo is None:
        raise DatasetValidationError(f"row {line}: timestamp must include an offset")
    return parsed.isoformat()


def validate_csv(text: str) -> list[MarketBar]:
    """Parse, validate, sort, and de-duplicate OHLCV CSV rows.

    Validation rejects duplicates rather than selecting a convenient row, so a
    research run cannot silently use an arbitrary revision of a candle.
    """
    reader = csv.DictReader(io.StringIO(text))
    headers = set(reader.fieldnames or [])
    missing = sorted(REQUIRED_COLUMNS - headers)
    if missing:
        raise DatasetValidationError(f"missing required columns: {', '.join(missing)}")

    bars: list[MarketBar] = []
    seen: set[tuple[str, str, str, str]] = set()
    for line, row in enumerate(reader, start=2):
        instrument = (row.get("instrument") or "").strip().upper()
        exchange = (row.get("exchange") or "").strip().upper()
        timezone_name = (row.get("timezone") or "").strip()
        frequency = (row.get("frequency") or "").strip()
        if not all((instrument, exchange, timezone_name, frequency)):
            raise DatasetValidationError(f"row {line}: instrument, exchange, timezone, and frequency are required")
        timestamp = _timestamp(row.get("timestamp") or "", line)
        open_price = _number(row, "open", line)
        high = _number(row, "high", line)
        low = _number(row, "low", line)
        close = _number(row, "close", line)
        volume = _number(row, "volume", line)
        if min(open_price, high, low, close) <= 0:
            raise DatasetValidationError(f"row {line}: OHLC values must be positive")
        if high < max(open_price, close) or low > min(open_price, close) or high < low:
            raise DatasetValidationError(f"row {line}: invalid OHLC relationship")
        if volume < 0:
            raise DatasetValidationError(f"row {line}: volume must be non-negative")
        key = (instrument, exchange, timestamp, frequency)
        if key in seen:
            raise DatasetValidationError(f"row {line}: duplicate instrument timestamp and frequency")
        seen.add(key)
        bars.append(MarketBar(instrument, exchange, timestamp, timezone_name, frequency, open_price, high, low, close, volume))

    if not bars:
        raise DatasetValidationError("dataset contains no data rows")
    identity = (bars[0].instrument, bars[0].exchange, bars[0].timezone, bars[0].frequency)
    if any((bar.instrument, bar.exchange, bar.timezone, bar.frequency) != identity for bar in bars):
        raise DatasetValidationError("dataset must contain one instrument, exchange, timezone, and frequency")
    return sorted(bars, key=lambda bar: bar.timestamp)


def _mean(values: list[float]) -> float | None:
    return sum(values) / len(values) if values else None


def _ema(values: list[float], period: int) -> list[float | None]:
    result: list[float | None] = []
    factor = 2 / (period + 1)
    previous: float | None = None
    for index, value in enumerate(values):
        if index + 1 < period:
            result.append(None)
            continue
        if previous is None:
            previous = sum(values[index + 1 - period:index + 1]) / period
        else:
            previous = value * factor + previous * (1 - factor)
        result.append(previous)
    return result


def calculate_features(bars: Iterable[MarketBar], benchmark_returns: dict[str, float] | None = None) -> list[dict[str, Any]]:
    """Calculate only trailing/current-bar features; no future row is read."""
    benchmark_returns = benchmark_returns or {}
    rows = list(bars)
    closes = [bar.close for bar in rows]
    volumes = [bar.volume for bar in rows]
    ema12, ema26 = _ema(closes, 12), _ema(closes, 26)
    macd = [a - b if a is not None and b is not None else None for a, b in zip(ema12, ema26)]
    macd_signal: list[float | None] = [None] * len(rows)
    valid_macd = [value for value in macd if value is not None]
    for offset, value in enumerate(_ema(valid_macd, 9)):
        macd_signal[len(rows) - len(valid_macd) + offset] = value
    output: list[dict[str, Any]] = []

    for index, bar in enumerate(rows):
        previous_close = closes[index - 1] if index else None
        simple_return = (bar.close / previous_close - 1) if previous_close else None
        log_return = math.log(bar.close / previous_close) if previous_close else None
        gains = [max(closes[i] - closes[i - 1], 0) for i in range(max(1, index - 13), index + 1)]
        losses = [max(closes[i - 1] - closes[i], 0) for i in range(max(1, index - 13), index + 1)]
        rsi = None
        if len(gains) == 14:
            average_gain, average_loss = sum(gains) / 14, sum(losses) / 14
            rsi = 100.0 if average_loss == 0 else 100 - (100 / (1 + average_gain / average_loss))
        trailing_returns = [closes[i] / closes[i - 1] - 1 for i in range(max(1, index - 19), index + 1)]
        trailing_volume = volumes[max(0, index - 19):index + 1]
        benchmark_return = benchmark_returns.get(bar.timestamp)
        output.append({
            **asdict(bar),
            "return_1": simple_return,
            "log_return_1": log_return,
            "sma_5": _mean(closes[max(0, index - 4):index + 1]) if index >= 4 else None,
            "sma_20": _mean(closes[max(0, index - 19):index + 1]) if index >= 19 else None,
            "rsi_14": rsi,
            "macd_12_26": macd[index],
            "macd_signal_9": macd_signal[index] if macd[index] is not None else None,
            "rolling_volatility_20": pstdev(trailing_returns) if len(trailing_returns) == 20 else None,
            "relative_volume_20": bar.volume / _mean(trailing_volume) if len(trailing_volume) == 20 and _mean(trailing_volume) else None,
            "momentum_20": bar.close / closes[index - 20] - 1 if index >= 20 else None,
            "benchmark_return_1": benchmark_return,
            "benchmark_relative_return_1": simple_return - benchmark_return if simple_return is not None and benchmark_return is not None else None,
        })
    return output


class LocalDatasetStore:
    """Filesystem store for raw, cleaned, and derived research artifacts."""

    def __init__(self, root: str | Path | None = None):
        default_root = Path(__file__).resolve().parents[2] / "data" / "lab"
        self.root = Path(root or os.getenv("LAB_DATA_ROOT", default_root))
        self.raw_dir = self.root / "raw"
        self.clean_dir = self.root / "clean"
        self.feature_dir = self.root / "features"
        self.metadata_dir = self.root / "metadata"
        for directory in (self.raw_dir, self.clean_dir, self.feature_dir, self.metadata_dir):
            directory.mkdir(parents=True, exist_ok=True)

    def ingest(self, content: bytes, source: str, original_filename: str) -> dict[str, Any]:
        if len(content) > MAX_UPLOAD_BYTES:
            raise DatasetValidationError("upload exceeds 20 MiB limit")
        if not source.strip():
            raise DatasetValidationError("source is required for data provenance")
        try:
            text = content.decode("utf-8-sig")
        except UnicodeDecodeError as error:
            raise DatasetValidationError("CSV must be UTF-8 encoded") from error
        bars = validate_csv(text)
        dataset_id = hashlib.sha256(content).hexdigest()[:16]
        features = calculate_features(bars)
        retrieved_at = datetime.now(timezone.utc).isoformat()
        metadata = {
            "dataset_id": dataset_id,
            "source": source.strip(),
            "original_filename": Path(original_filename).name,
            "retrieved_at": retrieved_at,
            "content_sha256": hashlib.sha256(content).hexdigest(),
            "row_count": len(bars),
            "instrument": bars[0].instrument,
            "exchange": bars[0].exchange,
            "frequency": bars[0].frequency,
            "first_timestamp": bars[0].timestamp,
            "last_timestamp": bars[-1].timestamp,
            "data_kind": "historical",
            "feature_schema_version": "1.0",
        }
        (self.raw_dir / f"{dataset_id}.csv").write_bytes(content)
        for directory, rows in ((self.clean_dir, [asdict(bar) for bar in bars]), (self.feature_dir, features)):
            with (directory / f"{dataset_id}.jsonl").open("w", encoding="utf-8") as handle:
                for row in rows:
                    handle.write(json.dumps(row, separators=(",", ":")) + "\n")
        (self.metadata_dir / f"{dataset_id}.json").write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
        return metadata

    def list_datasets(self) -> list[dict[str, Any]]:
        datasets = []
        for path in sorted(self.metadata_dir.glob("*.json")):
            datasets.append(json.loads(path.read_text(encoding="utf-8")))
        return datasets
