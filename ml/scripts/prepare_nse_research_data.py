"""CLI for Phase 19 local preparation before uploading an approved copy to Colab."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description="Prepare audited NSE historical data for the TradeMind Colab research workflow")
    parser.add_argument("--lab-root", type=Path, default=Path("backend/data/lab"), help="local Lab data root containing clean/ and metadata/")
    parser.add_argument("--output", type=Path, required=True, help="new or empty destination for prepared.csv and prepared-manifest.json")
    arguments = parser.parse_args()
    repository = Path(__file__).resolve().parents[2]
    sys.path[:0] = [str(repository / "ml"), str(repository / "backend")]
    from services.lab.data_pipeline import LocalDatasetStore
    from src.preparation import prepare_nse_research_data

    manifest = prepare_nse_research_data(LocalDatasetStore(arguments.lab_root), arguments.output)
    print(f"prepared {manifest['row_count']} rows from {len(manifest['included_datasets'])} audited NSE equities")
    print(f"manifest: {arguments.output / 'prepared-manifest.json'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
