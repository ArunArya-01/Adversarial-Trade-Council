"""Transparent, long-only backtesting for validated historical bars.

Signals are calculated at each bar close and executed at the following bar open.
This prevents same-bar look-ahead. The engine applies fees, slippage, and a
volume participation limit; it does not model shorting, leverage, or live fills.
"""

from __future__ import annotations

import math
from dataclasses import asdict, dataclass, replace
from statistics import pstdev
from typing import Literal

from services.lab.data_pipeline import MarketBar

StrategyName = Literal["buy_and_hold", "sma_crossover", "momentum"]


class BacktestValidationError(ValueError):
    pass


@dataclass(frozen=True)
class BacktestConfig:
    strategy: StrategyName
    initial_cash: float = 100_000.0
    fee_bps: float = 10.0
    slippage_bps: float = 5.0
    max_participation_rate: float = 0.10
    fast_window: int = 5
    slow_window: int = 20
    momentum_window: int = 20
    evaluation_start: str | None = None

    def validate(self) -> None:
        if self.initial_cash <= 0:
            raise BacktestValidationError("initial_cash must be positive")
        if self.fee_bps < 0 or self.slippage_bps < 0:
            raise BacktestValidationError("fees and slippage cannot be negative")
        if not 0 < self.max_participation_rate <= 1:
            raise BacktestValidationError("max_participation_rate must be in (0, 1]")
        if self.fast_window < 2 or self.slow_window <= self.fast_window:
            raise BacktestValidationError("slow_window must be greater than fast_window >= 2")
        if self.momentum_window < 1:
            raise BacktestValidationError("momentum_window must be positive")


def _mean(values: list[float]) -> float:
    return sum(values) / len(values)


def target_weights(bars: list[MarketBar], config: BacktestConfig) -> list[int]:
    """Return close-known target weights (0/1); execution occurs next bar."""
    if config.strategy == "buy_and_hold":
        return [1] * len(bars)
    closes = [bar.close for bar in bars]
    weights: list[int] = []
    for index, _ in enumerate(bars):
        if config.strategy == "sma_crossover":
            if index + 1 < config.slow_window:
                weights.append(0)
            else:
                fast = _mean(closes[index + 1 - config.fast_window:index + 1])
                slow = _mean(closes[index + 1 - config.slow_window:index + 1])
                weights.append(int(fast > slow))
        elif config.strategy == "momentum":
            weights.append(int(index >= config.momentum_window and closes[index] > closes[index - config.momentum_window]))
        else:
            raise BacktestValidationError(f"unsupported strategy: {config.strategy}")
    return weights


def _annualization_factor(frequency: str) -> int:
    return {"1d": 252, "1h": 1638, "1m": 98_280}.get(frequency.lower(), 252)


def _metrics(equity_curve: list[dict], ledger: list[dict], initial_cash: float, frequency: str) -> dict:
    equities = [point["equity"] for point in equity_curve]
    returns = [equities[i] / equities[i - 1] - 1 for i in range(1, len(equities)) if equities[i - 1] > 0]
    peak, max_drawdown = equities[0], 0.0
    for equity in equities:
        peak = max(peak, equity)
        max_drawdown = min(max_drawdown, equity / peak - 1)
    volatility = pstdev(returns) * math.sqrt(_annualization_factor(frequency)) if len(returns) > 1 else None
    sharpe = None
    if returns and pstdev(returns) > 0:
        sharpe = (_mean(returns) / pstdev(returns)) * math.sqrt(_annualization_factor(frequency))
    completed = [entry["realized_pnl"] for entry in ledger if entry["side"] == "SELL" and entry["realized_pnl"] is not None]
    turnover = sum(entry["notional"] for entry in ledger) / initial_cash
    return {
        "cumulative_return": equities[-1] / initial_cash - 1,
        "max_drawdown": max_drawdown,
        "annualized_volatility": volatility,
        "sharpe_ratio": sharpe,
        "win_rate": sum(value > 0 for value in completed) / len(completed) if completed else None,
        "turnover": turnover,
        "trade_count": len(ledger),
        "closed_trade_count": len(completed),
    }


def run_backtest(bars: list[MarketBar], config: BacktestConfig) -> dict:
    config.validate()
    if len(bars) < 2:
        raise BacktestValidationError("at least two historical bars are required")
    weights = target_weights(bars, config)
    start_index = 0
    if config.evaluation_start:
        matches = [index for index, bar in enumerate(bars) if bar.timestamp == config.evaluation_start]
        if not matches:
            raise BacktestValidationError("evaluation_start must exactly match a dataset timestamp")
        start_index = matches[0]
    if len(bars) - start_index < 2:
        raise BacktestValidationError("evaluation period must contain at least two bars")
    fee_rate, slippage_rate = config.fee_bps / 10_000, config.slippage_bps / 10_000
    cash, shares, cost_basis = config.initial_cash, 0, 0.0
    ledger: list[dict] = []
    curve: list[dict] = []
    pending_target = 1 if config.strategy == "buy_and_hold" else (weights[start_index - 1] if start_index else 0)

    for index in range(start_index, len(bars)):
        bar = bars[index]
        signal_timestamp = bars[index - 1].timestamp if index else None
        max_quantity = max(0, math.floor(bar.volume * config.max_participation_rate))
        desired_quantity = 0
        if pending_target:
            affordable = math.floor(cash / (bar.open * (1 + slippage_rate) * (1 + fee_rate)))
            desired_quantity = min(affordable, max_quantity)
        if pending_target and desired_quantity > shares:
            quantity = desired_quantity - shares
            price = bar.open * (1 + slippage_rate)
            notional, fee = quantity * price, quantity * price * fee_rate
            cash -= notional + fee
            cost_basis = (cost_basis * shares + notional + fee) / (shares + quantity)
            shares += quantity
            ledger.append({"side": "BUY", "signal_timestamp": signal_timestamp, "execution_timestamp": bar.timestamp, "quantity": quantity, "execution_price": price, "notional": notional, "fee": fee, "slippage_bps": config.slippage_bps, "realized_pnl": None})
        elif not pending_target and shares:
            quantity = min(shares, max_quantity)
            if quantity:
                price = bar.open * (1 - slippage_rate)
                notional, fee = quantity * price, quantity * price * fee_rate
                realized = (price - cost_basis) * quantity - fee
                cash += notional - fee
                shares -= quantity
                if not shares:
                    cost_basis = 0.0
                ledger.append({"side": "SELL", "signal_timestamp": signal_timestamp, "execution_timestamp": bar.timestamp, "quantity": quantity, "execution_price": price, "notional": notional, "fee": fee, "slippage_bps": config.slippage_bps, "realized_pnl": realized})
        equity = cash + shares * bar.close
        curve.append({"timestamp": bar.timestamp, "cash": cash, "shares": shares, "close": bar.close, "equity": equity, "target_weight": pending_target})
        pending_target = weights[index]

    # The final position is marked to market, rather than force-closed with an
    # invented next-bar execution price.
    return {
        "strategy": config.strategy,
        "assumptions": {
            "signal_timing": "signal at close t, execute at open t+1; buy-and-hold enters first available open",
            "long_only": True,
            "fee_bps": config.fee_bps,
            "slippage_bps": config.slippage_bps,
            "max_participation_rate": config.max_participation_rate,
            "final_position": "marked to last available close, not force-closed",
            "evaluation_start": bars[start_index].timestamp,
            "indicator_history_before_evaluation": start_index,
        },
        "initial_cash": config.initial_cash,
        "final_equity": curve[-1]["equity"],
        "metrics": _metrics(curve, ledger, config.initial_cash, bars[0].frequency),
        "equity_curve": curve,
        "trade_ledger": ledger,
        "parameters": asdict(config),
    }


def run_backtest_comparison(bars: list[MarketBar], config: BacktestConfig) -> dict:
    """Run a selected strategy and the same-cost buy-and-hold reference."""
    strategy_result = run_backtest(bars, config)
    baseline_config = replace(config, strategy="buy_and_hold")
    baseline_result = run_backtest(bars, baseline_config)
    return {
        "strategy_result": strategy_result,
        "baseline": {
            "name": "buy_and_hold",
            "metrics": baseline_result["metrics"],
            "final_equity": baseline_result["final_equity"],
        },
        "excess_cumulative_return": (
            strategy_result["metrics"]["cumulative_return"] - baseline_result["metrics"]["cumulative_return"]
        ),
    }
