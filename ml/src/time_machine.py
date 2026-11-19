"""Seeded, daily-candle Trade Time Machine research simulation.

It samples only returns available before the chosen historical entry. It is a
scenario tool, not a probability forecast or trading instruction.
"""
from __future__ import annotations

import random
from dataclasses import dataclass
from statistics import pstdev
from typing import Mapping, Sequence


class TimeMachineError(ValueError):
    pass


@dataclass(frozen=True)
class SimulationConfig:
    entry_index: int
    target_fraction: float
    stop_fraction: float
    holding_sessions: int = 5
    simulations: int = 1_000
    seed: int = 42
    fee_bps: float = 10.0
    slippage_bps: float = 5.0


def _close(row: Mapping[str, object]) -> float:
    value = float(row["close"])
    if value <= 0:
        raise TimeMachineError("daily close must be positive")
    return value


def _outcome(path: Sequence[float], entry: float, config: SimulationConfig) -> tuple[str, float]:
    target, stop = entry * (1 + config.target_fraction), entry * (1 - config.stop_fraction)
    cost = 2 * (config.fee_bps + config.slippage_bps) / 10_000
    for price in path:
        if price >= target:
            return "target_hit", price / entry - 1 - cost
        if price <= stop:
            return "stop_hit", price / entry - 1 - cost
    return "neither_hit", path[-1] / entry - 1 - cost


def simulate_daily_trade(rows: Sequence[Mapping[str, object]], config: SimulationConfig) -> dict:
    """Compare actual forward outcome with pre-entry regime-aware simulations."""
    if config.holding_sessions < 1 or config.simulations < 1 or config.target_fraction <= 0 or not 0 < config.stop_fraction < 1:
        raise TimeMachineError("invalid target, stop, holding_sessions, or simulations")
    if config.entry_index < 21 or config.entry_index + config.holding_sessions >= len(rows):
        raise TimeMachineError("entry requires 21 prior sessions and a complete actual holding horizon")
    closes = [_close(row) for row in rows]
    returns = [closes[index] / closes[index - 1] - 1 for index in range(1, len(closes))]
    entry = closes[config.entry_index]
    # All candidate return observations end strictly before entry; the 20-day
    # volatility bucket also contains no post-entry information.
    entry_volatility = pstdev(returns[config.entry_index - 20:config.entry_index])
    candidates = []
    for index in range(20, config.entry_index):
        volatility = pstdev(returns[index - 20:index])
        candidates.append((returns[index], volatility))
    distances = sorted(abs(volatility - entry_volatility) for _, volatility in candidates)
    cutoff = distances[max(0, int(len(distances) * 0.34) - 1)]
    regime_returns = [value for value, volatility in candidates if abs(volatility - entry_volatility) <= cutoff] or [value for value, _ in candidates]
    generator = random.Random(config.seed)
    simulated = []
    for _ in range(config.simulations):
        price, path = entry, []
        for _session in range(config.holding_sessions):
            price *= 1 + generator.choice(regime_returns)
            path.append(price)
        outcome, net_return = _outcome(path, entry, config)
        simulated.append((outcome, net_return))
    actual_path = closes[config.entry_index + 1:config.entry_index + 1 + config.holding_sessions]
    actual_outcome, actual_return = _outcome(actual_path, entry, config)
    returns_only = [value for _, value in simulated]
    downside = [value for value in returns_only if value < 0]
    counts = {name: sum(outcome == name for outcome, _ in simulated) for name in ("target_hit", "stop_hit", "neither_hit")}
    return {
        "data_kind": "historical_and_simulated", "frequency": "1d", "entry_timestamp": rows[config.entry_index].get("timestamp"),
        "configuration": {**config.__dict__, "entry_price": entry, "regime_sample_size": len(regime_returns), "entry_volatility_20": entry_volatility},
        "simulated": {"outcome_counts": counts, "outcome_frequencies": {key: value / config.simulations for key, value in counts.items()}, "expected_net_return": sum(returns_only) / len(returns_only), "downside_mean_return": sum(downside) / len(downside) if downside else 0.0, "worst_net_return": min(returns_only)},
        "actual_historical_outcome": {"outcome": actual_outcome, "net_return": actual_return, "exit_timestamp": rows[config.entry_index + config.holding_sessions].get("timestamp")},
        "limitations": ["Daily OHLC/close data cannot establish intraday target/stop ordering.", "Frequencies are conditional historical simulations, not guaranteed future probabilities.", "Sampling is restricted to pre-entry returns but does not model corporate actions, liquidity, or opening gaps beyond configured costs."],
    }
