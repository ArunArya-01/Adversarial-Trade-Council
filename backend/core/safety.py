"""
core/safety.py — TradeMind Safety Stack
=========================================
Implements Aviation-Grade Triple-Modular Redundancy (TMR) for trade safety.

Architecture
------------
Three independent validators run in isolation:
  1. DrawdownCheck   — daily P&L against peak capital
  2. PositionCheck   — per-trade size relative to total capital
  3. VolatilityCheck — VIX-proxy ceiling gate

A trade is APPROVED only when ALL three checks pass (unanimous quorum).
If the DrawdownCheck detects a breach ≥ MAX_DAILY_DRAWDOWN, the
HardKillSwitch singleton fires and BLOCKS ALL subsequent trade execution
until an admin explicitly resets it via POST /api/safety/reset.

This module is intentionally stateless except for the singleton kill-switch
so it can be used safely in async FastAPI handlers.
"""
from __future__ import annotations

import threading
from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from typing import List, Optional

from core.config import get_settings
from core import logger as log


# ── Data Models ───────────────────────────────────────────────────────────────

@dataclass
class CheckResult:
    """Result of a single TMR validator."""
    name: str
    passed: bool
    reason: str
    value: float
    threshold: float


@dataclass
class SafetyVerdict:
    """Aggregate result from all three TMR checks."""
    approved: bool
    kill_switch_active: bool
    checks: List[CheckResult]
    thought_logs: List[dict] = field(default_factory=list)

    @property
    def triggered_checks(self) -> List[str]:
        return [c.name for c in self.checks if not c.passed]

    def summary(self) -> str:
        if self.kill_switch_active:
            return "🛑 HARD KILL-SWITCH ACTIVE — all trading halted."
        status = "✅ APPROVED" if self.approved else "🚫 BLOCKED"
        failed = ", ".join(self.triggered_checks) or "none"
        return f"{status} | Failed checks: {failed}"


# ── Hard Kill-Switch Singleton ────────────────────────────────────────────────

class _KillSwitchState:
    """
    Thread-safe singleton tracking the hard kill-switch state.
    Triggered automatically on drawdown breach; reset requires admin auth.
    """

    _instance: Optional["_KillSwitchState"] = None
    _lock: threading.Lock = threading.Lock()

    def __new__(cls) -> "_KillSwitchState":
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    instance = super().__new__(cls)
                    instance._active = False
                    instance._triggered_at: Optional[datetime] = None
                    instance._trigger_reason: str = ""
                    cls._instance = instance
        return cls._instance

    @property
    def active(self) -> bool:
        return self._active

    def trigger(self, reason: str) -> None:
        with self._lock:
            if not self._active:
                self._active = True
                self._triggered_at = datetime.now(timezone.utc)
                self._trigger_reason = reason
                log.critical(
                    f"🛑 HARD KILL-SWITCH FIRED — {reason}",
                    agent="safety_stack",
                )

    def reset(self, admin_token: str) -> bool:
        """
        Reset the kill-switch. Returns True if reset was successful.
        Validates admin_token against settings.
        """
        cfg = get_settings()
        if admin_token != cfg.admin_secret_token:
            log.warn("Kill-switch reset attempted with invalid token.", agent="safety_stack")
            return False
        with self._lock:
            self._active = False
            self._triggered_at = None
            self._trigger_reason = ""
        log.info("✅ Kill-switch manually reset by admin.", agent="safety_stack")
        return True

    def status(self) -> dict:
        return {
            "active": self._active,
            "triggered_at": self._triggered_at.isoformat() if self._triggered_at else None,
            "reason": self._trigger_reason,
        }


# Module-level singleton – import this wherever you need kill-switch access
HardKillSwitch = _KillSwitchState()


# ── Individual TMR Validators ─────────────────────────────────────────────────

class DrawdownCheck:
    """
    Check 1 of 3: Fires the hard kill-switch and blocks the trade if
    the current daily P&L loss exceeds MAX_DAILY_DRAWDOWN of peak capital.
    """

    name = "DrawdownCheck"

    def evaluate(self, portfolio_value: float, peak_value: float) -> CheckResult:
        cfg = get_settings()
        if peak_value <= 0:
            return CheckResult(
                name=self.name,
                passed=False,
                reason="Peak value must be positive.",
                value=0.0,
                threshold=cfg.max_daily_drawdown,
            )

        drawdown = (peak_value - portfolio_value) / peak_value
        passed = drawdown < cfg.max_daily_drawdown

        if not passed:
            HardKillSwitch.trigger(
                f"Daily drawdown {drawdown:.2%} exceeded threshold {cfg.max_daily_drawdown:.2%}."
            )

        reason = (
            f"Drawdown {drawdown:.2%} < threshold {cfg.max_daily_drawdown:.2%} — OK"
            if passed
            else f"Drawdown {drawdown:.2%} ≥ threshold {cfg.max_daily_drawdown:.2%} — KILL-SWITCH TRIGGERED"
        )

        return CheckResult(
            name=self.name,
            passed=passed,
            reason=reason,
            value=drawdown,
            threshold=cfg.max_daily_drawdown,
        )


class PositionSizeCheck:
    """
    Check 2 of 3: Blocks trades where the proposed position size
    exceeds MAX_POSITION_SIZE of total portfolio capital.
    """

    name = "PositionSizeCheck"

    def evaluate(self, position_size: float, total_capital: float) -> CheckResult:
        cfg = get_settings()
        if total_capital <= 0:
            return CheckResult(
                name=self.name,
                passed=False,
                reason="Total capital must be positive.",
                value=0.0,
                threshold=cfg.max_position_size,
            )

        size_fraction = position_size / total_capital
        passed = size_fraction <= cfg.max_position_size
        reason = (
            f"Position {size_fraction:.2%} ≤ limit {cfg.max_position_size:.2%} — OK"
            if passed
            else f"Position {size_fraction:.2%} > limit {cfg.max_position_size:.2%} — BLOCKED"
        )

        return CheckResult(
            name=self.name,
            passed=passed,
            reason=reason,
            value=size_fraction,
            threshold=cfg.max_position_size,
        )


class VolatilityCheck:
    """
    Check 3 of 3: Blocks trades when implied volatility (VIX proxy)
    exceeds MAX_VIX_THRESHOLD, indicating extreme market stress.
    """

    name = "VolatilityCheck"

    def evaluate(self, vix_proxy: float) -> CheckResult:
        cfg = get_settings()
        passed = vix_proxy <= cfg.max_vix_threshold
        reason = (
            f"VIX proxy {vix_proxy:.1f} ≤ ceiling {cfg.max_vix_threshold:.1f} — OK"
            if passed
            else f"VIX proxy {vix_proxy:.1f} > ceiling {cfg.max_vix_threshold:.1f} — BLOCKED"
        )

        return CheckResult(
            name=self.name,
            passed=passed,
            reason=reason,
            value=vix_proxy,
            threshold=cfg.max_vix_threshold,
        )


# ── Safety Stack Orchestrator ─────────────────────────────────────────────────

class SafetyStack:
    """
    The TradeMind Safety Stack.

    Runs all three TMR validators and aggregates results into a SafetyVerdict.
    All three must pass for a trade to be approved (unanimous quorum).

    Usage
    -----
    stack = SafetyStack()
    verdict = stack.evaluate(
        portfolio_value=98_000,
        peak_value=100_000,
        position_size=4_500,
        total_capital=98_000,
        vix_proxy=18.5,
    )
    print(verdict.approved)   # True / False
    print(verdict.summary())  # Human-readable verdict
    """

    def __init__(self) -> None:
        self._drawdown = DrawdownCheck()
        self._position = PositionSizeCheck()
        self._volatility = VolatilityCheck()

    def evaluate(
        self,
        portfolio_value: float,
        peak_value: float,
        position_size: float,
        total_capital: float,
        vix_proxy: float,
    ) -> SafetyVerdict:
        thought_logs: list[dict] = []

        # ── Gate 0: Hard Kill-Switch override ────────────────────────────────
        if HardKillSwitch.active:
            t = log.critical(
                "🛑 Trade blocked — hard kill-switch is ACTIVE. Admin reset required.",
                agent="safety_stack",
            )
            thought_logs.append(t)
            return SafetyVerdict(
                approved=False,
                kill_switch_active=True,
                checks=[],
                thought_logs=thought_logs,
            )

        # ── TMR: Run all three checks ─────────────────────────────────────────
        drawdown_result = self._drawdown.evaluate(portfolio_value, peak_value)
        position_result = self._position.evaluate(position_size, total_capital)
        volatility_result = self._volatility.evaluate(vix_proxy)

        checks = [drawdown_result, position_result, volatility_result]

        for c in checks:
            severity = "INFO" if c.passed else "WARNING"
            t = log.thought(
                f"[TMR/{c.name}] {c.reason}",
                agent="safety_stack",
                severity=severity,
            )
            thought_logs.append(t)

        approved = all(c.passed for c in checks)

        if approved:
            t = log.info("✅ TMR unanimous — trade approved.", agent="safety_stack")
        else:
            t = log.warn(
                f"🚫 TMR failed — blocked by: {[c.name for c in checks if not c.passed]}",
                agent="safety_stack",
            )
        thought_logs.append(t)

        return SafetyVerdict(
            approved=approved,
            kill_switch_active=HardKillSwitch.active,
            checks=checks,
            thought_logs=thought_logs,
        )
