# TradeMind AI — Trading Academy & AI Sandbox

**A full-stack educational trading ecosystem that teaches retail users how to trade through interactive lessons, a live market replay simulator, and real-time AI mentorship.**

---

## Product Vision

TradeMind AI is a "One-Stop Destination" for trading education:

| Pillar | Description |
| :--- | :--- |
| 📚 **Interactive Curriculum** | Step-by-step modules covering market fundamentals, chart reading, and risk management |
| 💰 **$100k Virtual Sandbox** | A paper-trading wallet with tick-by-tick market replay |
| 🤖 **AI Mentor + Devil's Advocate** | LLM agents that grade your trades in real-time and surface adversarial risks |
| 📰 **Agentic News Feed** | AI swarm that translates institutional jargon into plain beginner English |

---

## Monorepo Structure

```
Adversarial-Trade-Council/
├── frontend/          ← Vite + React + Tailwind (Phase 2)
└── backend/           ← FastAPI + SQLite + LangChain (Phase 1 — active)
    ├── main.py
    ├── database/      ← SQLAlchemy ORM, SQLite
    ├── api/           ← /lessons, /wallet, /news routes
    ├── engine/        ← Market Replay CSV streamer
    └── agents/        ← AI Mentor, Devil's Advocate, News Interpreter
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

### Frontend (Phase 2)
```bash
cd frontend
npm install && npm run dev
```

API docs available at: `http://localhost:8000/docs`

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Backend** | FastAPI (Python 3.10+) |
| **Database** | SQLite via SQLAlchemy |
| **AI Agents** | LangChain + Google Gemini 1.5 Flash |
| **Data Engine** | Pandas (CSV market replay) |
| **Frontend** | React, Vite, Tailwind CSS |
| **Real-time** | WebSocket (market tick stream) |

---

## Roadmap

- [x] **Phase 1** — Backend scaffold: lessons, wallet, news, replay engine, AI agents
- [ ] **Phase 2** — React frontend: Dashboard, Lesson Player, Sandbox, News Feed
- [ ] **Phase 3** — Live paper trading via Alpaca API
- [ ] **Phase 4** — User auth, leaderboard, streak tracking

---

*For educational purposes only. Not financial advice.*
