"""
main.py — TradeMind AI FastAPI Application
==========================================
Entry point for the backend server.

Run with:
    cd backend
    uvicorn main:app --reload --port 8000

Architecture
------------
  /api/trade/*    — Full RL→Council→Safety pipeline
  /api/safety/*   — Safety Stack status and kill-switch management
  /api/agents/*   — Individual RL and council endpoints
  /ws/council     — Real-time thought-log WebSocket stream
  /ws/market      — Real-time synthetic market tick stream
  /health         — System health check
"""
from __future__ import annotations

import asyncio
import json
import sys
import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# Ensure the backend directory is on sys.path when run via `uvicorn main:app`
sys.path.insert(0, os.path.dirname(__file__))

from core.config import get_settings
from core.safety import HardKillSwitch, SafetyStack
from core import logger as log
from agents.rl_brain import RLBrain
from agents.council import CouncilSession
from api.routes import trade as trade_router
from api.routes import safety as safety_router
from api.routes import agents as agents_router
from api.routes.agents import council_ws_endpoint
from data.websocket_handler import default_streamer


# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan context.
    Initialises heavy objects once at startup and tears them down cleanly.
    """
    cfg = get_settings()

    log.info("=" * 60, agent="system")
    log.info("  TradeMind AI — Backend Starting", agent="system")
    log.info("=" * 60, agent="system")

    # ── Initialise singletons ──────────────────────────────────────────────
    log.info("Initialising RL Brain (PPO)…", agent="system")
    rl_brain = RLBrain(checkpoint_path=cfg.ppo_checkpoint_path)

    log.info("Initialising Council of Agents…", agent="system")
    council = CouncilSession()

    log.info("Initialising Safety Stack (TMR)…", agent="system")
    safety_stack = SafetyStack()

    # Attach to app state for dependency injection via Request
    app.state.rl_brain = rl_brain
    app.state.council = council
    app.state.safety_stack = safety_stack

    # ── Start market data streamer ─────────────────────────────────────────
    streamer_task = asyncio.create_task(default_streamer.run(interval_sec=1.0))

    log.info("✅ All systems online. TradeMind AI is ready.", agent="system")
    log.info(f"   Strict Mode: {cfg.strict_mode}", agent="system")
    log.info(f"   Max Drawdown: {cfg.max_daily_drawdown:.1%}", agent="system")
    log.info(f"   Gemini: {'configured' if cfg.gemini_configured else '⚠ NOT configured — mock mode'}", agent="system")

    yield  # ── Server is running ──

    # ── Shutdown ───────────────────────────────────────────────────────────
    log.info("TradeMind AI shutting down…", agent="system")
    streamer_task.cancel()
    try:
        await streamer_task
    except asyncio.CancelledError:
        pass
    log.info("Shutdown complete.", agent="system")


# ── App Factory ───────────────────────────────────────────────────────────────

def create_app() -> FastAPI:
    cfg = get_settings()

    app = FastAPI(
        title="TradeMind AI",
        description=(
            "High-fidelity algorithmic trading platform with RL + Multi-Agent Swarm Intelligence. "
            "Phase 1: Sandbox backend with PPO, Council deliberation, and TMR Safety Stack."
        ),
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # ── CORS ──────────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cfg.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── REST Routers ──────────────────────────────────────────────────────────
    app.include_router(trade_router.router, prefix="/api")
    app.include_router(safety_router.router, prefix="/api")
    app.include_router(agents_router.router, prefix="/api")

    # ── WebSocket: Council Thought Log ────────────────────────────────────────
    @app.websocket("/ws/council")
    async def ws_council(websocket: WebSocket) -> None:
        """
        Real-time council deliberation stream.
        Send {"type": "RUN_DELIBERATION"} to trigger a full RL→Council run.
        Receives: DELIBERATION_START, THOUGHT_LOG, DELIBERATION_COMPLETE, PING
        """
        # Inject app reference so the handler can access app.state
        websocket.app = app
        await council_ws_endpoint(websocket)

    # ── WebSocket: Market Data Ticks ──────────────────────────────────────────
    market_clients: list[WebSocket] = []

    async def _broadcast_tick(tick: dict) -> None:
        dead = []
        for ws in market_clients:
            try:
                await ws.send_json(tick)
            except Exception:
                dead.append(ws)
        for ws in dead:
            market_clients.remove(ws)

    default_streamer.on_tick(_broadcast_tick)

    @app.websocket("/ws/market")
    async def ws_market(websocket: WebSocket) -> None:
        """
        Real-time synthetic market tick stream.
        Emits one tick per symbol per second: AAPL, NVDA, BTC-USD, SPY.
        """
        await websocket.accept()
        market_clients.append(websocket)
        log.info("Market data client connected.", agent="system")
        try:
            while True:
                # Just keep connection alive; data is pushed by streamer
                await asyncio.sleep(30)
        except WebSocketDisconnect:
            market_clients.remove(websocket)
            log.info("Market data client disconnected.", agent="system")

    # ── Health Check ──────────────────────────────────────────────────────────
    @app.get("/health", tags=["System"])
    async def health() -> dict:
        """Lightweight health probe — safe to poll every 30s from the frontend."""
        cfg = get_settings()
        return {
            "status": "ok",
            "version": "0.1.0",
            "kill_switch_active": HardKillSwitch.active,
            "gemini_configured": cfg.gemini_configured,
            "alpaca_configured": cfg.alpaca_configured,
            "strict_mode": cfg.strict_mode,
        }

    return app


app = create_app()
