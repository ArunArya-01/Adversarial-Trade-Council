# Approved model artifact bundle

Do not commit datasets, model binaries, credentials, or unreviewed artifacts.
When a Colab experiment is approved, export a directory containing:

```text
model.joblib                 # selected model and preprocessing pipeline
feature_schema.json          # required manifest and ordered feature names
requirements-lock.txt        # exact Colab package versions
evaluation-report.json       # validation/test metrics and split boundaries
```

`feature_schema.json` must include `model_version`, target/horizon definition,
ordered features, training date range, random seed, package versions,
validation/test metrics, and limitations. The future backend loader must reject
an artifact whose manifest fails `ml.src.inference.validate_manifest`.

Before enabling backend inference, run the parity test with
`TRADEMIND_MODEL_ARTIFACT_DIR` set to the approved exported directory. No model
is currently exported or loaded by the application.
