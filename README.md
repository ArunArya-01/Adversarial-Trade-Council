# TradeMind AI — Trading Academy & AI Investment Lab

**A trading education application with a separate research-oriented Investment Lab. Academy practice uses clearly labelled simulated data; Lab results are historical or simulated unless a validated provider is explicitly enabled.**

---

## Product Vision

TradeMind AI currently has two deliberately separate modules:

| Pillar | Description |
| :--- | :--- |
| 📚 **Trading Academy** | Lessons, quizzes, simulated practice, and RSS market news |
| 🧪 **AI Investment Lab** | Validated historical imports, reproducible backtests, Colab ML scaffolding, simulated paper portfolios, risk controls, and evidence-bound research reports |

---

## Monorepo Structure

```
Adversarial-Trade-Council/
├── frontend/          ← Vite + React + Tailwind
└── backend/           ← FastAPI + SQLite
    ├── main.py
    ├── database/      ← SQLAlchemy ORM, SQLite
    ├── api/           ← Academy and Lab routes
    └── database/      ← SQLAlchemy ORM, SQLite
```

---

## Quick Start

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env      # add your GEMINI_API_KEY
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install && npm run dev
```

API docs available at: `http://localhost:8000/docs`. Canonical routes use `/api/academy/*` and `/api/lab/status`; legacy Academy routes remain temporarily available.

### Investment Lab historical CSV import

The Lab currently supports only local, explicitly historical OHLCV CSV imports:

```text
POST /api/lab/datasets/import
multipart fields: file=<dataset.csv>, source=<licensed provider or local export>
```

Required columns are `instrument, exchange, timestamp, timezone, frequency,
open, high, low, close, volume`. Imports are validated, content-hashed, and
stored separately as raw, cleaned, and derived-feature artifacts. The Groww
adapter is disabled until a verified server-side entitlement and token are
provided; no broker connection or live order execution exists.

### Historical backtesting

`POST /api/lab/backtests` accepts an imported `dataset_id` and one of
`buy_and_hold`, `sma_crossover`, or `momentum`. Signals are calculated at the
close and executed at the next bar's open (except the buy-and-hold reference,
which enters at the first available open). Fees, slippage, and maximum volume
participation are configurable. Each run returns a trade ledger, equity curve,
and comparison to buy-and-hold. Results are historical simulations, not
predictions or investment advice. An optional `evaluation_start` must exactly
match a dataset timestamp; bars before it remain available only to warm
indicators, while cash accounting and reported metrics begin at that timestamp.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Backend** | FastAPI (Python 3.10+) |
| **Database** | SQLite via SQLAlchemy |
| **AI / ML** | Versioned Google Colab research scaffolding; optional evidence-bound narration is disabled by default |
| **Practice Data** | Deterministic synthetic OHLCV; RSS news feeds |
| **Frontend** | React, Vite, Tailwind CSS |
| **Real-time** | No live market-data stream currently connected |

---

## Roadmap

- [x] **Phase 1** — Dual module foundation and canonical Academy/Lab API surface
- [x] **Phase 2** — Historical data ingestion and validation
- [x] **Phase 3** — Reproducible backtesting
- [x] **Phase 4** — Colab ML research and model artifact integration
- [x] **Phase 5** — Credential-safe Groww market-data adapter boundary
- [x] **Phase 6** — Auditable simulated paper trading and risk controls
- [x] **Phase 7** — Evidence-bound AI research reports

## Current limits

- Groww market data is disabled until the account owner supplies and verifies a
  server-side API entitlement and access token.
- No real broker orders, portfolio synchronization, or live trading are
  implemented.
- Model artifacts are not yet trained or deployed; the repository provides the
  reproducible Colab research structure and contracts only.

---

*For educational purposes only. Not financial advice.*
