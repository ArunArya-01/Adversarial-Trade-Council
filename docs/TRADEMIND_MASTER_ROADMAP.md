# TradeMind AI master roadmap

## Product boundary

TradeMind is an India-focused NSE/NIFTY 50 investment-research and paper
trading platform. It uses INR, documented NSE sessions, verified Indian data
sources, explicit corporate-action handling, and provenance-preserving data
pipelines. It is not a live brokerage product.

## Completed foundation (Phases 1–17)

- Separate Academy and Investment Lab modules.
- Validated single-file historical CSV import, feature generation, provenance,
  historical backtesting, paper portfolios and deterministic risk safeguards.
- Colab-first ML contracts, artifact-manifest validation, and evidence-bound
  research reports; **no trained/approved model exists**.
- Disabled-by-default, read-only Groww adapter boundary; no credentials or
  broker orders.
- Historical scanner, watchlists, Lab dashboard workflows, and exports.
- Phase 15 raw NSE normalizer: 119 supported raw daily segments transformed
  into separate canonical JSONL segments/manifests; 11 unsupported NIFTY Total
  Return/constituent-list files are explicitly reported for later policy work.
- Phase 16 registry stitcher: 55 canonical ticker-specific series generated
  and bulk-imported with zero conflicting overlaps; 1,298 identical overlap
  records and 98 potential calendar gaps are preserved for the Phase 17
  quality audit. Four observed ticker transitions are split rather than merged.
- Phase 17 quality audit: all 55 series audited against NIFTY 50 Price Return;
  no structural blockers found. Large-return/volume, gap, and ticker-transition
  candidates are preserved as warnings, and blocked datasets are refused by
  downstream historical loaders.

## Pending original roadmap — preserve order

| Phase | Scope | Dependency / acceptance summary |
| --- | --- | --- |
| 15 | Raw NSE data normalization | **Complete.** Convert preserved raw downloads reproducibly; normalize dates/numbers/schema, retain hashes and rejects. |
| 16 | Dataset stitching and registry | **Complete.** Merge yearly segments, flag overlap/gaps, bulk-import canonical series with lineage. |
| 17 | Historical data quality audit | **Complete.** Report sessions, duplicates, OHLC errors, anomalies, corporate actions, and benchmark alignment. |
| 18 | Multi-asset historical universe | **Complete.** Audited locally imported NSE equities can be scanned at one exact shared historical close. The downloaded current NIFTY 50 list is explicitly coverage-only, not a reconstruction of historical index membership. |
| 19 | Complete Colab preparation | **Complete.** Build a hash-recorded, no-imputation prepared CSV/manifest from Phase 17-audited NSE data; labels require matched stock/benchmark five-session horizons. No model is trained in this phase. |
| 20 | Baseline ML experiment | **Implementation complete; Colab execution pending.** Hash-verified prepared data uses timestamp-grouped purged splits, dummy-prior and logistic baselines, validation-only calibration/metrics, and a sealed unscored test partition. No artifact is exported or approved. |
| 21 | Walk-forward ML evaluation | **Implementation in progress; execution blocked pending Phase 20 Colab report.** The first seeded daily Trade Time Machine is implemented with pre-entry regime sampling, costs, target/stop/neither outcomes, and actual-versus-simulated comparison. Multi-fold ML evaluation awaits the required real baseline report. |
| 22 | Artifact approval/export | **Implementation in progress; no artifact can be approved yet.** The bundle validator requires a model/data/evaluation hash chain, dependency lockfile, completed walk-forward and out-of-sample evidence, and explicit human approval. |
| 23 | FastAPI inference integration | **Safety boundary complete; prediction integration deferred.** FastAPI exposes a fail-closed artifact status only. It remains unavailable without a complete, explicitly approved bundle; even a validated artifact is not runtime-loaded until feature-parity review is complete. |
| 24 | Model governance | Versioning, drift checks, audit logs, approval and rollback. |
| 25 | Paper-trading strategy integration | Evidence-backed entry/exit plans, position sizing and deterministic risk decision before simulated fills. |
| 26 | Portfolio/risk analytics | Exposure, concentration, drawdown, scenarios, attribution, risk sizing, and Trade Time Machine extensions. |
| 27 | Research dashboard completion | Universe scanner, data-quality, backtest/walk-forward, risk, artifact and provenance views. |
| 28 | Groww read-only enablement | Only after verified entitlement/credentials; freshness/rate limits; no orders. |
| 29 | Production hardening | Auth, ownership, migrations, secrets, audit/monitoring, CI and deployment review. |

## Incorporated capabilities and dependencies

### Trade Time Machine (Phases 21 and 26)

An India-focused research simulation engine, not a predictor.

**Initial daily-data scope:**

- Historical strategy/setup replay on normalized NSE equities.
- Seeded Monte Carlo paths using historical volatility and market-regime-aware
  sampling; sample only from information available before the simulated entry.
- Entry, target, stop, costs, slippage, target-hit/stop-hit/neither-hit,
  expected-return, reward/risk, drawdown, and downside-risk reporting.
- Compare simulated distributions with actual historical setup outcomes.
- Save immutable configuration, seed, dataset/artifact versions, assumptions,
  output metrics and limitations.
- Validate with walk-forward and out-of-sample periods.

**Deferred intraday extension:** use verified Indian intraday candles, an NSE
calendar/session model, explicit opening/closing auction rules, and observed
liquidity. Do not synthesize intraday bars from daily data.

**Acceptance criteria:** repeatable same-seed result; transparent assumptions;
cost/slippage included; actual-versus-simulated comparison; no statement that a
simulated frequency guarantees a future probability.

### Entry, exit, sizing and risk (Phases 25 and 26)

- A plan must identify historical/simulated source, entry condition, stop,
  target, time exit, invalidation, costs and gap-risk limitation.
- Position sizing uses configured INR capital, maximum loss, entry/stop
  distance, fees/slippage and portfolio exposure limits.
- Risk evaluates deterministic PASS/BLOCK reasons for data freshness, maximum
  loss, concentration, daily/portfolio drawdown and exposure.
- Plans can create paper-trade proposals only after all checks pass; they never
  create broker orders.

### Optional future enhancements

- Source-cited Indian news/event research and verified fundamentals.
- Price alerts only after Phase 27 and verified live data; alerts are not trade
  instructions.
- No US Congress-trade tracker and no broker executor.

## Future MCP compatibility

Keep Python service contracts independent of FastAPI/MCP transport. Once their
underlying services are tested, potential wrappers are:

`get_stock_history`, `scan_market`, `run_backtest`, `simulate_trade`,
`calculate_position_size`, `analyze_portfolio_risk`, and
`get_model_evaluation`.

MCP is deferred. Each tool must call an existing validated service, return
structured provenance/freshness/limitations, and must not expose live orders.

## Planned candle evidence and algorithmic research

- **Candle snapshots:** Phase 27 will render/export timestamped candlestick
  images from validated historical data for Academy explanations and Lab proof.
  Every image will identify its instrument, date range, frequency, source and
  whether it is historical/simulated; it will not fabricate future candles.
- **Algorithmic trading:** Phases 21 and 25 will support deterministic,
  versioned strategy rules in backtests and paper-trading proposals. Algorithms
  remain research/simulation tools until a separately approved final project;
  this roadmap contains no live or automatic order execution.

## Phase 15 proposed implementation gate

Before starting Phase 15, review and approve this design:

1. Raw files stay in `data/TradeMindData/originals/` and are never overwritten.
2. Normalized outputs and quality reports are separately versioned.
3. Initial benchmark policy is documented explicitly (NIFTY 50 Price Return
   unless a later corporate-action/total-return policy is approved).
4. Every transformation records source hash, parser version, reject reason and
   output hash.
5. Tests cover NSE dates, Indian numeric separators, descending exports,
   duplicate overlap, malformed rows and reproducibility.
