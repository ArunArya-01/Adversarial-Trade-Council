"""CLI for Phase 16 canonical NSE-series registry generation."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from services.lab.nse_registry import import_ready_registry_series, write_registry


def main() -> int:
    parser = argparse.ArgumentParser(description="Stitch normalized NSE segments and report every overlap/gap.")
    parser.add_argument("normalized_root", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--lab-output", type=Path, help="optional Lab data root for conflict-free bulk import")
    args = parser.parse_args()
    series = write_registry(args.normalized_root, args.output)
    summary = {"series": len(series), "ready": sum(item.status == "ready_for_quality_audit" for item in series), "blocked": sum(item.status != "ready_for_quality_audit" for item in series), "identical_overlaps": sum(len(item.identical_overlaps) for item in series), "conflicting_overlaps": sum(len(item.conflicting_overlaps) for item in series), "potential_calendar_gaps": sum(len(item.potential_calendar_gaps) for item in series)}
    if args.lab_output:
        summary["lab_imported"] = len(import_ready_registry_series(args.output, args.lab_output))
    print(json.dumps(summary, indent=2))
    return 0 if summary["blocked"] == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())
