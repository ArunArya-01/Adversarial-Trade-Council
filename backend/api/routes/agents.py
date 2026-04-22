"""
api/routes/agents.py — Agent Endpoints & WebSocket
====================================================
GET  /api/agents/rl/signal             — single RL forward pass
POST /api/agents/council/deliberate    — full council deliberation
WS   /ws/council                       — real-time thought log stream
"""
from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter, Request, WebSocket, WebSocketDisconnect, Depends

from api.models import (
    RLSignalResponse,
    CouncilDeliberateRequest,
    CouncilVerdictResponse,
    AgentVoteResponse,
    ThoughtLogEntry,
)
from agents.rl_brain import RLSignal
from core import logger as log

router = APIRouter(prefix="/agents", tags=["Agents"])


def _get_rl_brain(request: Request):
    return request.app.state.rl_brain


def _get_council(request: Request):
    return request.app.state.council


# ── RL Brain ──────────────────────────────────────────────────────────────────

@router.get("/rl/signal", response_model=RLSignalResponse, summary="Run RL forward pass")
async def get_rl_signal(request: Request) -> RLSignalResponse:
    """
    Generates a fresh synthetic observation and runs it through the PPO policy.
    Returns action, confidence, and raw action probabilities (XAI data).
    """
    brain = request.app.state.rl_brain
    signal: RLSignal = brain.get_signal()
    return RLSignalResponse(
        action=signal.action,
        action_id=signal.action_id,
        confidence=signal.confidence,
        raw_probs=signal.raw_probs,
        obs_dim=len(signal.obs),
    )


# ── Council ───────────────────────────────────────────────────────────────────

@router.post(
    "/council/deliberate",
    response_model=CouncilVerdictResponse,
    summary="Full council deliberation",
)
async def council_deliberate(
    body: CouncilDeliberateRequest,
    request: Request,
) -> CouncilVerdictResponse:
    """
    Runs all three LLM agents concurrently and returns the quorum verdict.
    If GEMINI_API_KEY is not configured, falls back to deterministic mock responses.
    """
    brain = request.app.state.rl_brain
    council = request.app.state.council

    # Build a synthetic RLSignal from the request body
    action_map = {"BUY": 1, "SELL": 2, "HOLD": 0}
    action_id = action_map[body.rl_action]
    probs = [0.1, 0.1, 0.1]
    probs[action_id] = body.rl_confidence
    remaining = (1.0 - body.rl_confidence) / 2
    for i in range(3):
        if i != action_id:
            probs[i] = remaining

    from agents.rl_brain import RLSignal
    rl_signal = RLSignal(
        action=body.rl_action,
        action_id=action_id,
        confidence=body.rl_confidence,
        raw_probs=probs,
        obs=brain.sample_observation().tolist(),
    )

    verdict = await council.deliberate(
        rl_signal=rl_signal,
        market_context=body.market_context,
    )

    return CouncilVerdictResponse(
        approved=verdict.approved,
        quorum_verdict=verdict.quorum_verdict,
        votes=[
            AgentVoteResponse(
                agent=v.agent_name,
                verdict=v.verdict,
                confidence=v.confidence,
                reasoning=v.reasoning,
            )
            for v in verdict.votes
        ],
        thought_logs=[ThoughtLogEntry(**t) for t in verdict.thought_logs],
        deliberation_ms=verdict.deliberation_ms,
    )


# ── WebSocket: Real-time Thought Log Stream ───────────────────────────────────

class _ConnectionManager:
    """Manages active WebSocket connections for the council thought-log stream."""

    def __init__(self) -> None:
        self.active: list[WebSocket] = []

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        self.active.append(ws)
        log.info(f"WebSocket client connected. Total: {len(self.active)}", agent="system")

    def disconnect(self, ws: WebSocket) -> None:
        if ws in self.active:
            self.active.remove(ws)
        log.info(f"WebSocket client disconnected. Total: {len(self.active)}", agent="system")

    async def broadcast(self, message: dict) -> None:
        """Broadcast a JSON message to all connected clients."""
        dead: list[WebSocket] = []
        for ws in self.active:
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)


ws_manager = _ConnectionManager()


async def _stream_deliberation(request: Request, ws: WebSocket) -> None:
    """
    Runs a full council deliberation and streams each thought log entry
    to the WebSocket client in real time.
    """
    brain = request.app.state.rl_brain
    council = request.app.state.council

    rl_signal = brain.get_signal()

    # Announce start
    await ws.send_json({
        "type": "DELIBERATION_START",
        "rl_signal": rl_signal.to_dict(),
    })

    verdict = await council.deliberate(
        rl_signal=rl_signal,
        market_context="Real-time WebSocket deliberation session.",
    )

    # Stream each thought log entry with a small delay for visual drama
    for entry in verdict.thought_logs:
        await ws.send_json({"type": "THOUGHT_LOG", "data": entry})
        await asyncio.sleep(0.12)

    # Send final verdict
    await ws.send_json({
        "type": "DELIBERATION_COMPLETE",
        "verdict": verdict.to_dict(),
    })


# Note: WebSocket route is registered directly on the FastAPI app in main.py
# to avoid router prefix issues. This function is exported for use there.
async def council_ws_endpoint(websocket: WebSocket) -> None:
    """
    WebSocket endpoint at ws://localhost:8000/ws/council
    Compatible with the frontend ThoughtLog component.

    Message types sent to client:
      DELIBERATION_START   — RL signal that kicked off deliberation
      THOUGHT_LOG          — individual agent thought entry
      DELIBERATION_COMPLETE — final council verdict
      PING                 — keepalive
    """
    await ws_manager.connect(websocket)
    try:
        while True:
            # Wait for a trigger from the client (or keepalive ping)
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                msg = json.loads(data)

                if msg.get("type") == "RUN_DELIBERATION":
                    await _stream_deliberation(websocket.app, websocket)
                else:
                    # Echo unknown messages for debugging
                    await websocket.send_json({"type": "ACK", "received": msg})

            except asyncio.TimeoutError:
                # Keepalive
                await websocket.send_json({"type": "PING"})

    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as exc:
        log.warn(f"WebSocket error: {exc}", agent="system")
        ws_manager.disconnect(websocket)
