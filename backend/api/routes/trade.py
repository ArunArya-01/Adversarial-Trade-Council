"""
api/routes/trade.py — Full Pipeline Trade Evaluation
======================================================
POST /api/trade/evaluate  — runs RL → Council → Safety → Final Decision
GET  /api/trade/status    — current system state snapshot
"""
from __future__ import annotations

import time

from fastapi import APIRouter, Depends, HTTPException, Request

from api.models import (
    TradeProposalRequest,
    TradeDecisionResponse,
    RLSignalResponse,
    CouncilVerdictResponse,
    AgentVoteResponse,
    SafetyVerdictResponse,
    SafetyCheckResult,
    ThoughtLogEntry,
)
from core import logger as log

router = APIRouter(prefix="/trade", tags=["Trade Pipeline"])


def _get_rl_brain(request: Request):
    return request.app.state.rl_brain


def _get_council(request: Request):
    return request.app.state.council


def _get_safety(request: Request):
    return request.app.state.safety_stack


@router.post("/evaluate", response_model=TradeDecisionResponse, summary="Full RL→Council→Safety pipeline")
async def evaluate_trade(
    proposal: TradeProposalRequest,
    rl_brain=Depends(_get_rl_brain),
    council=Depends(_get_council),
    safety=Depends(_get_safety),
) -> TradeDecisionResponse:
    """
    The main entry point for the TradeMind decision pipeline:
    1. RL Brain generates action probabilities for the proposed symbol
    2. Council of 3 LLM agents deliberate and vote
    3. Safety Stack runs TMR validation
    4. Final approval is AND of council + safety verdicts
    """
    t_start = time.monotonic()

    log.info(
        f"Trade evaluation requested: {proposal.action} {proposal.symbol} "
        f"@ ${proposal.entry_price:,.2f}",
        agent="system",
    )

    # ── Step 1: RL Signal ─────────────────────────────────────────────────────
    rl_signal = rl_brain.get_signal()  # Uses synthetic obs for now
    rl_response = RLSignalResponse(
        action=rl_signal.action,
        action_id=rl_signal.action_id,
        confidence=rl_signal.confidence,
        raw_probs=rl_signal.raw_probs,
        obs_dim=len(rl_signal.obs),
    )

    # ── Step 2: Council Deliberation ─────────────────────────────────────────
    council_verdict = await council.deliberate(
        rl_signal=rl_signal,
        market_context=proposal.market_context,
    )
    council_response = CouncilVerdictResponse(
        approved=council_verdict.approved,
        quorum_verdict=council_verdict.quorum_verdict,
        votes=[
            AgentVoteResponse(
                agent=v.agent_name,
                verdict=v.verdict,
                confidence=v.confidence,
                reasoning=v.reasoning,
            )
            for v in council_verdict.votes
        ],
        thought_logs=[ThoughtLogEntry(**t) for t in council_verdict.thought_logs],
        deliberation_ms=council_verdict.deliberation_ms,
    )

    # ── Step 3: Safety Stack ──────────────────────────────────────────────────
    position_value = proposal.quantity * proposal.entry_price
    safety_verdict = safety.evaluate(
        portfolio_value=proposal.portfolio_value,
        peak_value=proposal.peak_value,
        position_size=position_value,
        total_capital=proposal.total_capital,
        vix_proxy=proposal.vix_proxy,
    )
    safety_response = SafetyVerdictResponse(
        approved=safety_verdict.approved,
        kill_switch_active=safety_verdict.kill_switch_active,
        triggered_checks=safety_verdict.triggered_checks,
        checks=[
            SafetyCheckResult(**c.__dict__)
            for c in safety_verdict.checks
        ],
        thought_logs=[ThoughtLogEntry(**t) for t in safety_verdict.thought_logs],
    )

    # ── Step 4: Final Decision ────────────────────────────────────────────────
    # Both council AND safety must approve
    final_approved = council_verdict.approved and safety_verdict.approved

    # Risk:Reward ratio
    if proposal.action == "BUY":
        risk = proposal.entry_price - proposal.stop_loss
        reward = proposal.take_profit - proposal.entry_price
    elif proposal.action == "SELL":
        risk = proposal.stop_loss - proposal.entry_price
        reward = proposal.entry_price - proposal.take_profit
    else:
        risk, reward = 1.0, 0.0

    rr_ratio = round(reward / risk, 2) if risk > 0 else 0.0

    elapsed_ms = int((time.monotonic() - t_start) * 1000)

    log.info(
        f"Pipeline complete in {elapsed_ms}ms — "
        f"{'✅ APPROVED' if final_approved else '🚫 BLOCKED'} | R:R={rr_ratio}",
        agent="system",
    )

    return TradeDecisionResponse(
        symbol=proposal.symbol,
        action=proposal.action,
        final_approved=final_approved,
        rl_signal=rl_response,
        council_verdict=council_response,
        safety_verdict=safety_response,
        risk_reward=rr_ratio,
        pipeline_ms=elapsed_ms,
    )


@router.get("/status", summary="Current system state")
async def trade_status(request: Request) -> dict:
    """Returns current kill-switch state and basic system health."""
    from core.safety import HardKillSwitch
    from core.config import get_settings

    cfg = get_settings()
    ks = HardKillSwitch.status()

    return {
        "kill_switch": ks,
        "strict_mode": cfg.strict_mode,
        "max_daily_drawdown": cfg.max_daily_drawdown,
        "gemini_configured": cfg.gemini_configured,
        "alpaca_configured": cfg.alpaca_configured,
    }
