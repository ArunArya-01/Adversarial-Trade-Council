"""
api/routes/safety.py — Safety Stack Endpoints
==============================================
GET  /api/safety/status   — current TMR / kill-switch state
POST /api/safety/evaluate — run TMR checks on given portfolio metrics
POST /api/safety/reset    — admin-only kill-switch reset
"""
from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException, Request

from api.models import (
    SafetyEvaluateRequest,
    SafetyVerdictResponse,
    SafetyCheckResult,
    SafetyStatusResponse,
    KillSwitchResetResponse,
    ThoughtLogEntry,
)
from core.config import get_settings
from core.safety import HardKillSwitch
from core import logger as log

router = APIRouter(prefix="/safety", tags=["Safety Stack"])


def _get_safety(request: Request):
    return request.app.state.safety_stack


@router.get("/status", response_model=SafetyStatusResponse, summary="Kill-switch & TMR status")
async def safety_status() -> SafetyStatusResponse:
    """Returns the current hard kill-switch flag and configured safety thresholds."""
    cfg = get_settings()
    ks = HardKillSwitch.status()
    return SafetyStatusResponse(
        kill_switch_active=ks["active"],
        triggered_at=ks.get("triggered_at"),
        reason=ks.get("reason", ""),
        max_daily_drawdown=cfg.max_daily_drawdown,
        max_position_size=cfg.max_position_size,
        max_vix_threshold=cfg.max_vix_threshold,
    )


@router.post("/evaluate", response_model=SafetyVerdictResponse, summary="Run TMR safety checks")
async def evaluate_safety(
    body: SafetyEvaluateRequest,
    safety=_get_safety.__wrapped__ if hasattr(_get_safety, "__wrapped__") else None,
    request: Request = None,
) -> SafetyVerdictResponse:
    """
    Runs all three TMR validators against the provided portfolio metrics.
    Use this to pre-screen a trade before running the full council deliberation.
    """
    stack = request.app.state.safety_stack
    verdict = stack.evaluate(
        portfolio_value=body.portfolio_value,
        peak_value=body.peak_value,
        position_size=body.position_size,
        total_capital=body.total_capital,
        vix_proxy=body.vix_proxy,
    )

    return SafetyVerdictResponse(
        approved=verdict.approved,
        kill_switch_active=verdict.kill_switch_active,
        triggered_checks=verdict.triggered_checks,
        checks=[SafetyCheckResult(**c.__dict__) for c in verdict.checks],
        thought_logs=[ThoughtLogEntry(**t) for t in verdict.thought_logs],
    )


@router.post("/reset", response_model=KillSwitchResetResponse, summary="Admin kill-switch reset")
async def reset_kill_switch(
    x_admin_token: str = Header(
        ...,
        alias="X-Admin-Token",
        description="Admin secret token from .env → ADMIN_SECRET_TOKEN",
    ),
) -> KillSwitchResetResponse:
    """
    Manually resets the hard kill-switch.
    Requires the X-Admin-Token header matching ADMIN_SECRET_TOKEN in .env.
    """
    success = HardKillSwitch.reset(x_admin_token)
    if not success:
        raise HTTPException(
            status_code=403,
            detail="Invalid admin token. Kill-switch NOT reset.",
        )
    return KillSwitchResetResponse(
        success=True,
        message="Kill-switch successfully reset. Trading is now active.",
    )
