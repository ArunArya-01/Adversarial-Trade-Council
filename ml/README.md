# TradeMind AI ML research

This directory is intentionally designed for **Google Colab**, not the FastAPI
runtime. It contains research code and notebook templates; it does not contain a
trained model, dataset, secret, or claim of predictive performance.

## Initial experiment

The initial target is the binary probability that an instrument's return over
the next five trading sessions exceeds the return of its matched benchmark over
the same period. A prediction is made after the close at time `t`; only inputs
known at or before that close may be used. A strategy using the prediction must
execute no earlier than the next executable bar.

## Colab workflow

1. Copy a licensed historical dataset and its Phase 2 provenance metadata into
   your approved Colab/Drive location. Do not commit it here.
2. Open notebooks in numeric order and set `DATASET_PATH` and
   `BENCHMARK_PATH` to those approved locations.
3. Record the dataset SHA-256, date range, feature schema, package versions,
   random seed, split boundaries, and results in the run manifest.
4. Evaluate baselines before more complex models. Do not export a model unless
   the held-out evaluation and calibration have been reviewed.
5. Export only the approved artifact bundle described in `artifacts/README.md`.

## Leakage controls

- All splits are chronological.
- Training folds are purged by at least the label horizon before validation or
  test periods begin.
- Preprocessing is fit on each training fold only.
- Overlapping forward-return labels are not allowed to cross split boundaries.
- Hyperparameters are selected using validation only; the final test period is
  reserved until selection is complete.

The notebooks include logistic regression, random forest, XGBoost, LightGBM,
LSTM, and Transformer experiment paths. Their inclusion is not evidence that
they are appropriate, trained, or superior to a baseline.
