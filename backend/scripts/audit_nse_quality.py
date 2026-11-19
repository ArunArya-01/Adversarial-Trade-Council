"""CLI for Phase 17 NSE historical quality audit."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from services.lab.nse_quality import write_quality_audit


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit stitched NSE historical series without changing source bars.")
    parser.add_argument("stitched_root", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--lab-root", type=Path)
    args = parser.parse_args()
    audits = write_quality_audit(args.stitched_root, args.output, args.lab_root)
    summary = {"series": len(audits), "audited": sum(item["status"] == "audited" for item in audits), "warnings": sum(item["status"] == "audited_with_warnings" for item in audits), "blocked": sum(item["status"] == "blocked" for item in audits), "large_return_candidates": sum(len(item.get("large_return_candidates", [])) for item in audits), "volume_anomaly_candidates": sum(len(item.get("volume_anomaly_candidates", [])) for item in audits)}
    print(json.dumps(summary, indent=2))
    return 0 if not summary["blocked"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
