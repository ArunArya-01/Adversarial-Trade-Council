"""Deterministic entry/exit plans and INR sizing for paper-trade research only."""
from __future__ import annotations

from dataclasses import asdict, dataclass


class TradePlanningError(ValueError):
    pass


@dataclass(frozen=True)
class TradePlan:
    symbol: str
    entry_price: float
    stop_price: float
    target_price: float
    time_exit_sessions: int
    source: str
    data_kind: str
    strategy_version: str

    def validate(self) -> None:
        if not all((self.symbol.strip(), self.source.strip(), self.strategy_version.strip())):
            raise TradePlanningError("symbol, source, and strategy_version are required")
        if self.data_kind not in {"historical", "simulated"}:
            raise TradePlanningError("plans are limited to historical or simulated evidence")
        if not (self.entry_price > self.stop_price > 0 and self.target_price > self.entry_price and self.time_exit_sessions > 0):
            raise TradePlanningError("long plan requires positive stop below entry, target above entry, and time exit")


def size_long_position(plan: TradePlan, capital_inr: float, max_loss_fraction: float, max_position_fraction: float, fee_bps: float = 10, slippage_bps: float = 5) -> dict:
    """Return a conservative whole-share paper size; never a broker order."""
    plan.validate()
    if capital_inr <= 0 or not 0 < max_loss_fraction < 1 or not 0 < max_position_fraction <= 1 or fee_bps < 0 or slippage_bps < 0:
        raise TradePlanningError("invalid INR capital, risk limits, fees, or slippage")
    entry = plan.entry_price * (1 + slippage_bps / 10_000)
    exit_at_stop = plan.stop_price * (1 - slippage_bps / 10_000)
    per_share_loss = entry - exit_at_stop + (entry + exit_at_stop) * fee_bps / 10_000
    risk_budget, position_budget = capital_inr * max_loss_fraction, capital_inr * max_position_fraction
    quantity = int(min(risk_budget / per_share_loss, position_budget / entry))
    if quantity < 1:
        return {"eligible": False, "reason": "risk and position limits do not permit one whole share", "quantity": 0, "plan": asdict(plan)}
    gross_entry = quantity * entry
    return {"eligible": True, "simulation": True, "quantity": quantity, "estimated_entry_cost_inr": gross_entry + gross_entry * fee_bps / 10_000, "maximum_estimated_loss_inr": quantity * per_share_loss, "reward_risk_ratio": (plan.target_price - plan.entry_price) / (plan.entry_price - plan.stop_price), "plan": asdict(plan), "notice": "Paper-trade sizing only; gap risk can exceed the configured stop loss and no broker order is created."}
