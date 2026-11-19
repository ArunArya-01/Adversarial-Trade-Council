"""Phase 20 validation-only baseline experiment for prepared NSE research data."""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from src.data_validation import ResearchValidationError, validate_feature_schema
from src.evaluation import evaluate_classifier, purged_timestamp_split
from src.features import FEATURE_SCHEMA_VERSION
from src.labels import TARGET_NAME


EXPERIMENT_VERSION = "nse-baseline-experiment-1.0"


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_prepared_research_data(prepared_path: str | Path, manifest_path: str | Path):
    """Verify the Phase 19 file/hash/schema before a baseline can read it."""
    import pandas as pd

    prepared, manifest_file = Path(prepared_path), Path(manifest_path)
    if not prepared.exists() or not manifest_file.exists():
        raise ResearchValidationError("prepared.csv and prepared-manifest.json are both required")
    manifest = json.loads(manifest_file.read_text(encoding="utf-8"))
    if manifest.get("prepared_file") != prepared.name:
        raise ResearchValidationError("prepared manifest does not name the supplied prepared file")
    if manifest.get("prepared_file_sha256") != _sha256(prepared):
        raise ResearchValidationError("prepared file hash differs from its manifest")
    if manifest.get("feature_schema_version") != FEATURE_SCHEMA_VERSION or manifest.get("target_name") != TARGET_NAME or manifest.get("horizon_sessions") != 5:
        raise ResearchValidationError("prepared manifest does not satisfy the reviewed Phase 19 feature/target contract")
    features = manifest.get("feature_names")
    if not isinstance(features, list) or not features:
        raise ResearchValidationError("prepared manifest has no ordered feature names")
    frame = pd.read_csv(prepared)
    validate_feature_schema(frame.columns, features, TARGET_NAME)
    required = ["timestamp", "instrument", "dataset_id", *features, TARGET_NAME]
    if frame[required].isna().any().any():
        raise ResearchValidationError("prepared data contains missing model inputs or target; imputation is not permitted in Phase 20")
    if not set(frame[TARGET_NAME].unique()).issubset({0, 1}):
        raise ResearchValidationError("prepared target must be binary")
    return frame, manifest


def run_validation_baselines(prepared_path: str | Path, manifest_path: str | Path, output_directory: str | Path, random_seed: int = 42) -> dict[str, Any]:
    """Fit baseline candidates on train timestamps and score validation only.

    Test rows are allocated by timestamp but are never sent to a model or
    metric function. Phase 21 may score the sealed test only after model
    selection and evaluation policy are frozen.
    """
    try:
        import sklearn
        from sklearn.dummy import DummyClassifier
        from sklearn.linear_model import LogisticRegression
        from sklearn.pipeline import Pipeline
        from sklearn.preprocessing import StandardScaler
    except ImportError as error:
        raise ResearchValidationError("scikit-learn is required for Phase 20; install the reviewed Colab dependencies before fitting") from error

    frame, manifest = load_prepared_research_data(prepared_path, manifest_path)
    split = purged_timestamp_split(frame["timestamp"].tolist(), horizon=manifest["horizon_sessions"])
    features, target = manifest["feature_names"], manifest["target_name"]
    train = frame[frame["timestamp"].isin(split.train_timestamps)]
    validation = frame[frame["timestamp"].isin(split.validation_timestamps)]
    test = frame[frame["timestamp"].isin(split.test_timestamps)]
    if train[target].nunique() < 2 or validation[target].nunique() < 2:
        raise ResearchValidationError("train and validation partitions must each contain both target classes")
    models = {
        "dummy_prior": DummyClassifier(strategy="prior"),
        "logistic_regression": Pipeline([("scale", StandardScaler()), ("classifier", LogisticRegression(random_state=random_seed, max_iter=1000, solver="liblinear"))]),
    }
    candidates = []
    for name, model in models.items():
        model.fit(train[features], train[target])
        probability = model.predict_proba(validation[features])[:, 1]
        candidates.append({"name": name, "validation_metrics": evaluate_classifier(validation[target], probability)})
    candidates.sort(key=lambda item: item["validation_metrics"]["log_loss"])
    output = Path(output_directory)
    output.mkdir(parents=True, exist_ok=True)
    report_path = output / "baseline-validation-report.json"
    if report_path.exists():
        raise ResearchValidationError("baseline validation report already exists; choose a new immutable output directory")
    report = {
        "experiment_version": EXPERIMENT_VERSION,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "random_seed": random_seed,
        "framework": {"scikit_learn": sklearn.__version__},
        "input": {"prepared_file": Path(prepared_path).name, "prepared_file_sha256": manifest["prepared_file_sha256"], "prepared_manifest": Path(manifest_path).name, "feature_names": features, "target_name": target, "horizon_sessions": manifest["horizon_sessions"]},
        "split": split.report(),
        "partition_rows": {"train": len(train), "validation": len(validation), "test": len(test)},
        "candidates": candidates,
        "selection_rule": "Validation log loss only; this report does not select, export, approve, or score a final model.",
        "sealed_test": "Test data was allocated by timestamp but was not passed to model fitting or metric evaluation.",
        "limitations": ["Historical research only; metrics do not imply predictive value or investment suitability.", "No model artifact is created in Phase 20.", "A later approved protocol is required before scoring the sealed test set."],
    }
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    return report
