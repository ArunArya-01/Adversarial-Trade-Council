# Investment Lab local data store

`raw/` contains the exact uploaded historical CSV, `clean/` contains validated
and sorted bars as JSON Lines, `features/` contains derived trailing-only
features, and `metadata/` records source, retrieval time, SHA-256 hash, date
range, instrument, frequency, and feature-schema version.

These artifacts are intentionally ignored by Git. Import only data you are
licensed to store and reproduce a result using the metadata hash and source.

Required CSV columns:

```text
instrument,exchange,timestamp,timezone,frequency,open,high,low,close,volume
```

`timestamp` must be ISO-8601 with an explicit UTC offset. The pipeline rejects
missing values, duplicate instrument/timestamp/frequency rows, negative volume,
and invalid OHLC relationships. Features at time *t* use data at or before *t*;
strategy execution timing is deferred to the backtesting phase.
