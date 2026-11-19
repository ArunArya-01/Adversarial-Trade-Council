"""Run Phase 20 validation-only baselines in Google Colab or an equivalent environment."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description="Run TradeMind's validation-only NSE baseline experiment")
    parser.add_argument("--prepared", type=Path, required=True)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--seed", type=int, default=42)
    arguments = parser.parse_args()
    repository = Path(__file__).resolve().parents[2]
    sys.path.insert(0, str(repository / "ml"))
    from src.baseline_experiment import run_validation_baselines

    report = run_validation_baselines(arguments.prepared, arguments.manifest, arguments.output, arguments.seed)
    print(f"validation-only report written with {len(report['candidates'])} baseline candidates")
    print("The test partition remains sealed and unscored.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
