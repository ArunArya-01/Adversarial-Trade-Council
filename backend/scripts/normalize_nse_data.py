"""CLI for Phase 15 raw NSE segment normalization."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from services.lab.nse_normalization import NseNormalizationError, normalize_file


def main() -> int:
    parser = argparse.ArgumentParser(description="Normalize preserved NSE raw CSV segments without modifying them.")
    parser.add_argument("source", type=Path, help="raw CSV file or directory")
    parser.add_argument("--output", type=Path, required=True, help="separate normalized output directory")
    args = parser.parse_args()
    sources = [args.source] if args.source.is_file() else sorted(args.source.rglob("*.csv"))
    if not sources:
        parser.error("source contains no CSV files")
    reports = []
    for source in sources:
        try:
            result = normalize_file(source, args.output)
            reports.append({"source": str(source), "status": "normalized", "rows": result.rows_normalized, "rejected": len(result.rejected_rows)})
        except NseNormalizationError as error:
            reports.append({"source": str(source), "status": "rejected", "reason": str(error)})
    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / "batch-normalization-report.json").write_text(
        json.dumps({"transformation_version": "nse-normalizer-1.0", "sources": reports}, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(reports, indent=2))
    return 0 if all(report["status"] == "normalized" for report in reports) else 2


if __name__ == "__main__":
    raise SystemExit(main())
