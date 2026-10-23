"""Chronological, purged evaluation utilities for Colab experiments."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ChronologicalSplit:
    train_end: int
    validation_start: int
    validation_end: int
    test_start: int


def purged_train_validation_test_split(row_count: int, horizon: int = 5, train_fraction: float = 0.60, validation_fraction: float = 0.20) -> ChronologicalSplit:
    """Return split boundaries with a label-horizon embargo between partitions."""
    if row_count < 3 * horizon + 30:
        raise ValueError("insufficient rows for purged chronological evaluation")
    if not 0 < train_fraction < 1 or not 0 < validation_fraction < 1 or train_fraction + validation_fraction >= 1:
        raise ValueError("invalid split fractions")
    train_end = int(row_count * train_fraction)
    validation_start = train_end + horizon
    validation_end = validation_start + int(row_count * validation_fraction)
    test_start = validation_end + horizon
    if test_start >= row_count:
        raise ValueError("insufficient test period after embargo")
    return ChronologicalSplit(train_end, validation_start, validation_end, test_start)


def evaluate_classifier(y_true, probability):
    """Return discrimination and calibration metrics for a held-out period."""
    from sklearn.calibration import calibration_curve
    from sklearn.metrics import average_precision_score, brier_score_loss, log_loss, roc_auc_score

    if len(y_true) != len(probability) or not len(y_true):
        raise ValueError("labels and probabilities must be non-empty and aligned")
    metrics = {
        "roc_auc": roc_auc_score(y_true, probability),
        "average_precision": average_precision_score(y_true, probability),
        "brier_score": brier_score_loss(y_true, probability),
        "log_loss": log_loss(y_true, probability),
    }
    observed, predicted = calibration_curve(y_true, probability, n_bins=10, strategy="quantile")
    metrics["calibration"] = {"predicted": predicted.tolist(), "observed": observed.tolist()}
    return metrics


def fit_and_predict_fold(model, x_train, y_train, x_evaluate):
    """Fit preprocessing/model only on the training partition, then predict later data."""
    model.fit(x_train, y_train)
    return model.predict_proba(x_evaluate)[:, 1]
