"""
main.py — TradeMind AI FastAPI Application
==========================================
The single entry point for the backend server.

Run with:
    cd backend
    uvicorn main:app --reload --port 8000

Endpoints
---------
  GET  /health               — system health
  GET  /api/lessons          — list all lessons
  GET  /api/lessons/{id}     — full lesson content + quiz
  POST /api/lessons/{id}/complete — record completion + XP
  GET  /api/wallet/balance   — portfolio summary
  POST /api/wallet/buy       — execute virtual buy + AI feedback
  POST /api/wallet/sell      — execute virtual sell + AI feedback
  GET  /api/wallet/history   — recent trade log
  GET  /api/news             — AI-simplified news feed
  WS   /ws/replay            — tick-by-tick market data stream
"""
from __future__ import annotations

import asyncio
import sys
import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# ── Path fix: ensure `backend/` is on sys.path when run via uvicorn ───────────
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()   # load .env before importing anything that reads env vars

from database.db import init_db
from engine.replay import default_replay
from api import lessons, wallet, news


# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Runs setup on startup and teardown on shutdown."""
    print("=" * 55)
    print("  TradeMind AI — Backend Starting")
    print("=" * 55)

    # Initialise SQLite database (create tables + seed user_id=1)
    init_db()

    # Pre-load market replay data
    try:
        default_replay.load("AAPL")
        print(f"[Replay] AAPL loaded — {default_replay.total_candles} candles ready.")
    except FileNotFoundError as e:
        print(f"[Replay] WARNING: {e}. WebSocket replay will be unavailable.")

    print("✅ TradeMind AI is ready.")
    print(f"   Docs: http://localhost:8000/docs")
    print(f"   Gemini: {'configured ✓' if os.getenv('GEMINI_API_KEY', '') not in ('', 'your_gemini_api_key_here') else '⚠ not configured — mock mode'}")

    yield  # ── Server is running ──────────────────────────────────────────────

    print("TradeMind AI shutting down.")


# ── App Factory ───────────────────────────────────────────────────────────────

def create_app() -> FastAPI:
    cors_origins = [
        o.strip()
        for o in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
        if o.strip()
    ]

    app = FastAPI(
        title="TradeMind AI",
        description=(
            "Full-stack trading education platform. "
            "Includes interactive lessons, a $100k virtual sandbox, "
            "AI mentor/devil's advocate, and a beginner-friendly news feed."
        ),
        version="0.2.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # ── CORS ──────────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── REST Routers ──────────────────────────────────────────────────────────
    app.include_router(lessons.router, prefix="/api")
    app.include_router(wallet.router,  prefix="/api")
    app.include_router(news.router,    prefix="/api")

    # ── WebSocket: Market Replay Stream ───────────────────────────────────────
    replay_clients: list[WebSocket] = []

    @app.websocket("/ws/replay")
    async def ws_replay(websocket: WebSocket) -> None:
        """
        Streams AAPL candlestick data tick-by-tick to the chart.

        On connect: immediately sends the last 60 candles (snapshot) so the
        chart populates instantly, then streams new candles every 0.8s.

        Message types sent to client:
          SNAPSHOT  — initial batch of historical candles
          CANDLE    — a single new candle (live replay)
          RESET     — replay has looped back to the start
        """
        await websocket.accept()
        replay_clients.append(websocket)

        try:
            # Send historical snapshot immediately on connect
            snapshot = default_replay.get_snapshot(60)
            if snapshot:
                await websocket.send_json({"type": "SNAPSHOT", "candles": snapshot})

            # Stream candles one by one
            async for candle in default_replay.stream(interval_sec=0.8, loop=True):
                # Check if client is still connected before sending
                try:
                    await websocket.send_json(candle)
                except Exception:
                    break

        except WebSocketDisconnect:
            pass
        except Exception as exc:
            print(f"[WS/replay] Error: {exc}")
        finally:
            if websocket in replay_clients:
                replay_clients.remove(websocket)

    # ── Health Check ──────────────────────────────────────────────────────────
    @app.get("/health", tags=["System"])
    async def health() -> dict:
        """Lightweight health probe — safe to poll from the frontend."""
        return {
            "status": "ok",
            "version": "0.2.0",
            "replay_loaded": default_replay.total_candles > 0,
            "replay_symbol": default_replay.symbol or None,
            "gemini_configured": (
                bool(os.getenv("GEMINI_API_KEY"))
                and os.getenv("GEMINI_API_KEY") != "your_gemini_api_key_here"
            ),
        }

    return app


app = create_app()
