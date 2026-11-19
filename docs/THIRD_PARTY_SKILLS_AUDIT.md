# Third-party skills overlap audit

**Reviewed project:** [`Jakeschincariol/day-trader-skill`](https://github.com/Jakeschincariol/day-trader-skill) (reviewed 2026-11-01)

## Decision

TradeMind AI will borrow research-workflow concepts, not copy the external
project's skill folders, US data sources, Claude-plugin interface, or broker
executor. TradeMind remains an India-focused, FastAPI/React research and paper
trading application. Real broker execution is explicitly excluded.

| External capability | TradeMind equivalent today | Gap | Reusable idea | Decision / destination |
| --- | --- | --- | --- | --- |
| Market scanner | Historical SMA/RSI/momentum scanner; Lab dashboard | One-dataset-at-a-time only | Transparent pass/fail reasons, as-of time, universe scans | Integrate in Phases 18 and 27 |
| News analyst | RSS news page and evidence-bound research report | No verified NSE/company-event research pipeline | Timestamped source records and event-risk flags | Optional future research enhancement; no phase commitment |
| Entry planner | Backtest timing and paper-trade signal contract | No approved trade-plan object | Explicit entry condition, invalidation, next-bar execution assumption | Integrate in Phase 25 |
| Exit planner | Paper trade costs, realised P&L, risk limits | No reusable stop/target plan model | Stop, target, time-exit and gap-risk assumptions | Integrate in Phase 25 |
| Monte Carlo Time Machine | Historical backtesting and planned walk-forward evaluation | No scenario simulator | Seeded simulations, target/stop/neither outcomes, empirical setup replay | Integrate in Phases 21 and 26 as Trade Time Machine |
| Risk manager | Paper portfolio cash, concentration, exposure, drawdown safeguards | Portfolio-level scenario/correlation analysis absent | Deterministic PASS/BLOCK reasons and audit trail | Integrate in Phase 26 |
| Position sizing | Cash/exposure limits only | No risk-per-trade sizing policy | Size from cash, entry, stop, max loss, fees/slippage | Integrate in Phases 25 and 26 |
| Broker executor | None by design | N/A | None; its approval-gate philosophy is useful | **Excluded**: no broker executor or order tool |
| Price alerts | None | Needs verified live data and user notification design | Freshness-aware stop/target/data alerts | Deferred until after Phase 27 and verified live data |
| Fundamental analyst | None | No verified Indian fundamentals source | Evidence/source separation only | Optional future research enhancement |
| Congress/Pelosi tracker | None | US-specific and irrelevant to product scope | None | **Excluded** |

## Compatibility constraints

- The reviewed project uses US-market sources, intraday bars, SEC/House data,
  US sessions, and a Claude-skill/plugin workflow. These do not transfer
  directly to NSE equities or TradeMind's FastAPI architecture.
- Initial Trade Time Machine work uses daily NSE data. Intraday functionality
  is deferred until a verified Indian intraday source and session/calendar
  policy are available.
- All monetary values are INR. Calendar logic must use NSE trading sessions,
  corporate-action handling must be explicit, and benchmarks must use a
  documented NIFTY 50 series.
- Existing FastAPI services remain the canonical application interface. Future
  MCP tools will wrap structured service interfaces rather than reimplement
  business logic.

## Required safety boundary

- No live broker execution, unrestricted order tools, bank access, or frontend
  broker credentials.
- Paper trading only; deterministic risk checks must return an explicit reason.
- Simulated frequencies and model outputs are research evidence, not forecasts
  or guarantees.
- Sensitive operations require explicit approval when they are introduced.
