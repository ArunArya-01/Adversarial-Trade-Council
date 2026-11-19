"""Reproducible normalization of preserved NSE historical-download segments.

This module does not modify raw files.  It converts one raw source file at a
time into a canonical daily OHLCV segment plus a provenance/rejection report.
Stitching yearly segments into an investable series is deliberately Phase 16.
"""

from __future__ import annotations

import csv
import hashlib
import io
import json
import math
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path
from typing import Any


TRANSFORMATION_VERSION = "nse-normalizer-1.0"
IST_OFFSET = "+05:30"


class NseNormalizationError(ValueError):
    pass


@dataclass(frozen=True)
class NormalizedSegment:
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


@dataclass(frozen=True)
class RejectedRow:
    line: int
    reason: str


@dataclass(frozen=True)
class NormalizationResult:
    source_path: str
    source_sha256: str
    source_kind: str
    volume_status: str
    rows_read: int
    rows_normalized: int
    rejected_rows: tuple[RejectedRow, ...]
    bars: tuple[NormalizedSegment, ...]

    def manifest(self) -> dict[str, Any]:
        return {
            "transformation_version": TRANSFORMATION_VERSION,
            "source_path": self.source_path,
            "source_sha256": self.source_sha256,
            "source_kind": self.source_kind,
            "frequency": "1d",
            "timezone": "Asia/Kolkata",
            "volume_status": self.volume_status,
            "rows_read": self.rows_read,
            "rows_normalized": self.rows_normalized,
            "rows_rejected": len(self.rejected_rows),
            "rejected_rows": [asdict(row) for row in self.rejected_rows],
            "first_timestamp": self.bars[0].timestamp if self.bars else None,
            "last_timestamp": self.bars[-1].timestamp if self.bars else None,
            "instrument": self.bars[0].instrument if len({bar.instrument for bar in self.bars}) == 1 else None,
            "instruments": sorted({bar.instrument for bar in self.bars}),
            "exchange": self.bars[0].exchange if self.bars else None,
        }


def _headers_and_rows(content: bytes) -> tuple[list[str], list[tuple[int, dict[str, str]]]]:
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError as error:
        raise NseNormalizationError("raw CSV must be UTF-8 encoded") from error
    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        raise NseNormalizationError("raw CSV has no header")
    headers = [header.strip() for header in reader.fieldnames]
    rows = []
    for line, row in enumerate(reader, start=2):
        rows.append((line, {(key or "").strip(): (value or "").strip() for key, value in row.items()}))
    return headers, rows


def _number(value: str, field: str) -> float:
    try:
        parsed = float(value.replace(",", "").strip())
    except ValueError as error:
        raise NseNormalizationError(f"{field} is not numeric") from error
    if not math.isfinite(parsed):
        raise NseNormalizationError(f"{field} is not finite")
    return parsed


def _daily_timestamp(value: str, formats: tuple[str, ...]) -> str:
    for date_format in formats:
        try:
            return datetime.strptime(value.strip(), date_format).strftime("%Y-%m-%dT15:30:00") + IST_OFFSET
        except ValueError:
            continue
    raise NseNormalizationError("unrecognized NSE trading date")


def _bar(instrument: str, timestamp: str, open_value: str, high: str, low: str, close: str, volume: str) -> NormalizedSegment:
    values = [_number(value, field) for value, field in ((open_value, "open"), (high, "high"), (low, "low"), (close, "close"), (volume, "volume"))]
    open_price, high_price, low_price, close_price, quantity = values
    if min(open_price, high_price, low_price, close_price) <= 0:
        raise NseNormalizationError("OHLC values must be positive")
    if high_price < max(open_price, close_price) or low_price > min(open_price, close_price) or high_price < low_price:
        raise NseNormalizationError("invalid OHLC relationship")
    if quantity < 0:
        raise NseNormalizationError("volume cannot be negative")
    return NormalizedSegment(instrument.upper(), "NSE", timestamp, "Asia/Kolkata", "1d", open_price, high_price, low_price, close_price, quantity)


def _source_kind(headers: list[str]) -> str:
    available = set(headers)
    if {"Symbol", "Date", "Open Price", "High Price", "Low Price", "Close Price", "Total Traded Quantity"} <= available:
        return "nse_equity_bhavcopy_export"
    if {"Index Name", "Date", "Open", "High", "Low", "Close"} <= available:
        return "nifty_price_return_export"
    if {"Date", "Open", "High", "Low", "Close"} <= available:
        return "india_vix_export"
    raise NseNormalizationError("unsupported NSE source schema")


def normalize_bytes(content: bytes, source_path: str = "raw.csv") -> NormalizationResult:
    headers, rows = _headers_and_rows(content)
    kind = _source_kind(headers)
    bars: list[NormalizedSegment] = []
    rejected: list[RejectedRow] = []
    for line, row in rows:
        try:
            if kind == "nse_equity_bhavcopy_export":
                bars.append(_bar(row["Symbol"], _daily_timestamp(row["Date"], ("%d-%b-%Y",)), row["Open Price"], row["High Price"], row["Low Price"], row["Close Price"], row["Total Traded Quantity"]))
            elif kind == "nifty_price_return_export":
                bars.append(_bar("NIFTY 50", _daily_timestamp(row["Date"], ("%d %b %Y",)), row["Open"], row["High"], row["Low"], row["Close"], "0"))
            else:
                bars.append(_bar("INDIA VIX", _daily_timestamp(row["Date"], ("%d-%b-%Y",)), row["Open"], row["High"], row["Low"], row["Close"], "0"))
        except (KeyError, NseNormalizationError) as error:
            rejected.append(RejectedRow(line, str(error)))
    if not bars:
        raise NseNormalizationError("no valid rows were normalized")
    bars.sort(key=lambda bar: bar.timestamp)
    duplicates = [bar.timestamp for index, bar in enumerate(bars[1:], start=1) if bar.timestamp == bars[index - 1].timestamp]
    if duplicates:
        raise NseNormalizationError(f"source segment contains duplicate session(s): {', '.join(duplicates[:3])}")
    return NormalizationResult(source_path, hashlib.sha256(content).hexdigest(), kind, "reported" if kind == "nse_equity_bhavcopy_export" else "unavailable_zero", len(rows), len(bars), tuple(rejected), tuple(bars))


def normalize_file(source: str | Path, output_root: str | Path) -> NormalizationResult:
    """Write separate canonical segment and manifest files; preserve input bytes."""
    source_path = Path(source)
    result = normalize_bytes(source_path.read_bytes(), str(source_path))
    root = Path(output_root)
    segment_directory, report_directory = root / "segments", root / "reports"
    segment_directory.mkdir(parents=True, exist_ok=True)
    report_directory.mkdir(parents=True, exist_ok=True)
    # Content hashes establish data identity, while a stable path suffix retains
    # separate lineage when a user has intentionally or accidentally downloaded
    # identical bytes under two filenames.
    path_token = hashlib.sha256(str(source_path).encode("utf-8")).hexdigest()[:8]
    token = f"{result.source_sha256[:16]}-{path_token}"
    with (segment_directory / f"{token}.jsonl").open("w", encoding="utf-8") as handle:
        for bar in result.bars:
            handle.write(json.dumps(asdict(bar), separators=(",", ":")) + "\n")
    (report_directory / f"{token}.json").write_text(json.dumps(result.manifest(), indent=2) + "\n", encoding="utf-8")
    return result
