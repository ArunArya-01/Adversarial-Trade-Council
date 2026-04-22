"""
api/models.py — TradeMind AI Pydantic Schemas
==============================================
All request/response models used across the API layer.
These are the DTOs that flow between the React frontend and the Python backend.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Literal, Optional

from pydantic import BaseModel, Field, model_validator


# ── Shared primitives ─────────────────────────────────────────────────────────

class ThoughtLogEntry(BaseModel):
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    agent: str
    severity: Literal["DEBUG", "INFO", "WARNING", "CRITICAL"] = "INFO"
    message: str


# ── RL Brain ──────────────────────────────────────────────────────────────────

class RLSignalResponse(BaseModel):
    """Response from GET /api/agents/rl/signal"""
    action: Literal["BUY", "SELL", "HOLD"]
    action_id: int = Field(ge=0, le=2)
    confidence: float = Field(ge=0.0, le=1.0)
    raw_probs: List[float] = Field(description="[P(HOLD), P(BUY), P(SELL)]")
    obs_dim: int


# ── Council ───────────────────────────────────────────────────────────────────

class AgentVoteResponse(BaseModel):
    agent: str
    verdict: Literal["BUY", "SELL", "HOLD", "VETO", "NO_VETO"]
    confidence: float = Field(ge=0.0, le=1.0)
    reasoning: str


class CouncilDeliberateRequest(BaseModel):
    """Request body for POST /api/agents/council/deliberate"""
    rl_action: Literal["BUY", "SELL", "HOLD"]
    rl_confidence: float = Field(ge=0.0, le=1.0, default=0.5)
    market_context: str = Field(
        default="No additional context provided.",
        max_length=2000,
    )


class CouncilVerdictResponse(BaseModel):
    """Full council deliberation result"""
    approved: bool
    quorum_verdict: Literal["BUY", "SELL", "HOLD", "VETO"]
    votes: List[AgentVoteResponse]
    thought_logs: List[ThoughtLogEntry]
    deliberation_ms: int


# ── Safety Stack ──────────────────────────────────────────────────────────────

class SafetyCheckResult(BaseModel):
    name: str
    passed: bool
    reason: str
    value: float
    threshold: float


class SafetyEvaluateRequest(BaseModel):
    """Request body for POST /api/safety/evaluate"""
    portfolio_value: float = Field(gt=0, description="Current portfolio value in USD")
    peak_value: float = Field(gt=0, description="Peak portfolio value today in USD")
    position_size: float = Field(gt=0, description="Proposed position size in USD")
    total_capital: float = Field(gt=0, description="Total capital available in USD")
    vix_proxy: float = Field(ge=0.0, description="Current VIX or implied volatility proxy")


class SafetyVerdictResponse(BaseModel):
    approved: bool
    kill_switch_active: bool
    triggered_checks: List[str]
    checks: List[SafetyCheckResult]
    thought_logs: List[ThoughtLogEntry]


class SafetyStatusResponse(BaseModel):
    kill_switch_active: bool
    triggered_at: Optional[str]
    reason: str
    max_daily_drawdown: float
    max_position_size: float
    max_vix_threshold: float


class KillSwitchResetResponse(BaseModel):
    success: bool
    message: str


# ── Trade Proposal (full pipeline) ───────────────────────────────────────────

class TradeProposalRequest(BaseModel):
    """
    Request body for POST /api/trade/evaluate
    Runs the full pipeline: RL → Council → Safety → Final Decision
    """
    symbol: str = Field(min_length=1, max_length=10, examples=["AAPL", "BTC-USD"])
    action: Literal["BUY", "SELL", "HOLD"]
    quantity: float = Field(gt=0, description="Number of shares / units")
    entry_price: float = Field(gt=0)
    stop_loss: float = Field(gt=0)
    take_profit: float = Field(gt=0)
    portfolio_value: float = Field(gt=0, description="Current portfolio value in USD")
    peak_value: float = Field(gt=0)
    total_capital: float = Field(gt=0)
    vix_proxy: float = Field(ge=0.0, default=18.0)
    market_context: str = Field(
        default="Standard market conditions.",
        max_length=2000,
    )

    @model_validator(mode="after")
    def validate_prices(self) -> "TradeProposalRequest":
        if self.action == "BUY" and self.stop_loss >= self.entry_price:
            raise ValueError("stop_loss must be below entry_price for BUY trades.")
        if self.action == "SELL" and self.stop_loss <= self.entry_price:
            raise ValueError("stop_loss must be above entry_price for SELL trades.")
        return self


class TradeDecisionResponse(BaseModel):
    """Full pipeline output — what the frontend Trade Executor receives."""
    symbol: str
    action: Literal["BUY", "SELL", "HOLD"]
    final_approved: bool
    rl_signal: RLSignalResponse
    council_verdict: CouncilVerdictResponse
    safety_verdict: SafetyVerdictResponse
    risk_reward: float
    execution_timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    pipeline_ms: int = Field(description="Total end-to-end latency in milliseconds")


# ── Health ────────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: Literal["ok", "degraded"]
    version: str
    kill_switch_active: bool
    gemini_configured: bool
    alpaca_configured: bool
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
