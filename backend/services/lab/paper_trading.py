"""Auditable, Lab-only paper trading.  It never sends orders to a broker."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy.orm import Session

from database.models import PaperEquitySnapshot, PaperPortfolio, PaperPosition, PaperTrade


class PaperTradingError(ValueError):
    pass


@dataclass(frozen=True)
class PaperTradeSignal:
    signal_id: str
    side: str
    symbol: str
    quantity: int
    observed_price: float
    observed_at: datetime
    source: str
    data_kind: str
    strategy_version: str
    model_version: str | None = None
    benchmark_price: float | None = None

    def validate(self) -> None:
        if self.side not in {"BUY", "SELL"}:
            raise PaperTradingError("side must be BUY or SELL")
        if not self.signal_id.strip() or not self.symbol.strip() or not self.source.strip() or not self.strategy_version.strip():
            raise PaperTradingError("signal_id, symbol, source, and strategy_version are required")
        if self.quantity <= 0 or self.quantity != int(self.quantity):
            raise PaperTradingError("quantity must be a positive whole number")
        if self.observed_price <= 0:
            raise PaperTradingError("observed_price must be positive")
        if self.data_kind not in {"historical", "simulated"}:
            raise PaperTradingError("paper trading currently accepts historical or simulated data only")
        if self.observed_at.tzinfo is None:
            raise PaperTradingError("observed_at must include a timezone")
        if self.benchmark_price is not None and self.benchmark_price <= 0:
            raise PaperTradingError("benchmark_price must be positive")


def _utc(value: datetime) -> datetime:
    return value.astimezone(timezone.utc).replace(tzinfo=None)


def _positions_value(db: Session, portfolio_id: str) -> float:
    return sum(position.quantity * position.last_price for position in db.query(PaperPosition).filter_by(portfolio_id=portfolio_id))


def _portfolio_equity(db: Session, portfolio: PaperPortfolio) -> float:
    return portfolio.cash + _positions_value(db, portfolio.id)


def create_portfolio(db: Session, name: str, starting_capital: float, benchmark_symbol: str | None, fee_bps: float, slippage_bps: float, max_position_fraction: float, max_total_exposure_fraction: float, max_drawdown_fraction: float) -> PaperPortfolio:
    if not name.strip() or starting_capital <= 0:
        raise PaperTradingError("name and a positive starting_capital are required")
    if fee_bps < 0 or slippage_bps < 0:
        raise PaperTradingError("fees and slippage cannot be negative")
    if not 0 < max_position_fraction <= max_total_exposure_fraction <= 1:
        raise PaperTradingError("position and exposure limits must satisfy 0 < position <= exposure <= 1")
    if not 0 < max_drawdown_fraction < 1:
        raise PaperTradingError("max_drawdown_fraction must be between 0 and 1")
    portfolio = PaperPortfolio(
        id=str(uuid4()), name=name.strip(), initial_cash=starting_capital, cash=starting_capital,
        benchmark_symbol=benchmark_symbol.strip() if benchmark_symbol else None, fee_bps=fee_bps,
        slippage_bps=slippage_bps, max_position_fraction=max_position_fraction,
        max_total_exposure_fraction=max_total_exposure_fraction, max_drawdown_fraction=max_drawdown_fraction,
        high_watermark=starting_capital,
    )
    db.add(portfolio)
    db.flush()
    _snapshot(db, portfolio, datetime.now(timezone.utc), None)
    db.commit()
    db.refresh(portfolio)
    return portfolio


def execute_signal(db: Session, portfolio_id: str, signal: PaperTradeSignal) -> PaperTrade:
    signal.validate()
    portfolio = db.get(PaperPortfolio, portfolio_id)
    if portfolio is None:
        raise PaperTradingError("paper portfolio was not found")
    if db.query(PaperTrade).filter_by(signal_id=signal.signal_id).first():
        raise PaperTradingError("duplicate signal_id rejected")
    if signal.observed_at > datetime.now(timezone.utc):
        raise PaperTradingError("observed_at cannot be in the future")

    position = db.query(PaperPosition).filter_by(portfolio_id=portfolio.id, symbol=signal.symbol).first()
    latest_trade = (
        db.query(PaperTrade)
        .filter_by(portfolio_id=portfolio.id, symbol=signal.symbol)
        .order_by(PaperTrade.observed_at.desc())
        .first()
    )
    if latest_trade is not None and _utc(signal.observed_at) < latest_trade.observed_at:
        raise PaperTradingError("stale observation rejected; signals for a symbol must be chronological")
    execution_price = signal.observed_price * (1 + portfolio.slippage_bps / 10_000 if signal.side == "BUY" else 1 - portfolio.slippage_bps / 10_000)
    fee = signal.quantity * execution_price * portfolio.fee_bps / 10_000
    equity_before = _portfolio_equity(db, portfolio)
    if equity_before <= 0 or 1 - equity_before / portfolio.high_watermark >= portfolio.max_drawdown_fraction:
        raise PaperTradingError("maximum drawdown safeguard is active; no new simulated trade is accepted")

    realized_pnl = None
    if signal.side == "BUY":
        gross_cost = signal.quantity * execution_price + fee
        if gross_cost > portfolio.cash + 1e-9:
            raise PaperTradingError("insufficient virtual cash")
        existing_value = position.quantity * signal.observed_price if position else 0.0
        if (existing_value + signal.quantity * execution_price) / equity_before > portfolio.max_position_fraction + 1e-9:
            raise PaperTradingError("position concentration limit exceeded")
        if (_positions_value(db, portfolio.id) + signal.quantity * execution_price) / equity_before > portfolio.max_total_exposure_fraction + 1e-9:
            raise PaperTradingError("total exposure limit exceeded")
        if position is None:
            position = PaperPosition(portfolio_id=portfolio.id, symbol=signal.symbol, quantity=0, cost_basis=0, last_price=execution_price, observed_at=_utc(signal.observed_at), source=signal.source, data_kind=signal.data_kind)
            db.add(position)
        position.cost_basis = (position.cost_basis * position.quantity + gross_cost) / (position.quantity + signal.quantity)
        position.quantity += signal.quantity
        portfolio.cash -= gross_cost
    else:
        if position is None or position.quantity < signal.quantity:
            raise PaperTradingError("cannot sell more simulated shares than the position holds")
        proceeds = signal.quantity * execution_price - fee
        realized_pnl = (execution_price - position.cost_basis) * signal.quantity - fee
        position.quantity -= signal.quantity
        portfolio.cash += proceeds
        if position.quantity == 0:
            db.delete(position)

    if position is not None and signal.side == "BUY" or (position is not None and position.quantity > 0):
        position.last_price = signal.observed_price
        position.observed_at = _utc(signal.observed_at)
        position.source, position.data_kind = signal.source, signal.data_kind
    trade = PaperTrade(id=str(uuid4()), portfolio_id=portfolio.id, signal_id=signal.signal_id, side=signal.side, symbol=signal.symbol, quantity=signal.quantity, observed_price=signal.observed_price, execution_price=execution_price, fee=fee, realized_pnl=realized_pnl, observed_at=_utc(signal.observed_at), source=signal.source, data_kind=signal.data_kind, strategy_version=signal.strategy_version, model_version=signal.model_version)
    db.add(trade)
    if portfolio.benchmark_symbol and signal.symbol == portfolio.benchmark_symbol and signal.benchmark_price:
        portfolio.benchmark_base_price = portfolio.benchmark_base_price or signal.benchmark_price
    _snapshot(db, portfolio, signal.observed_at, signal.benchmark_price)
    db.commit()
    db.refresh(trade)
    return trade


def _snapshot(db: Session, portfolio: PaperPortfolio, timestamp: datetime, benchmark_price: float | None) -> None:
    positions_value = _positions_value(db, portfolio.id)
    equity = portfolio.cash + positions_value
    portfolio.high_watermark = max(portfolio.high_watermark, equity)
    benchmark_equity = None
    if portfolio.benchmark_base_price and benchmark_price:
        benchmark_equity = portfolio.initial_cash * benchmark_price / portfolio.benchmark_base_price
    db.add(PaperEquitySnapshot(portfolio_id=portfolio.id, timestamp=_utc(timestamp), cash=portfolio.cash, positions_value=positions_value, equity=equity, benchmark_equity=benchmark_equity))


def portfolio_report(db: Session, portfolio_id: str) -> dict:
    portfolio = db.get(PaperPortfolio, portfolio_id)
    if portfolio is None:
        raise PaperTradingError("paper portfolio was not found")
    positions = db.query(PaperPosition).filter_by(portfolio_id=portfolio.id).order_by(PaperPosition.symbol).all()
    trades = db.query(PaperTrade).filter_by(portfolio_id=portfolio.id).order_by(PaperTrade.created_at).all()
    snapshots = db.query(PaperEquitySnapshot).filter_by(portfolio_id=portfolio.id).order_by(PaperEquitySnapshot.timestamp).all()
    equity = _portfolio_equity(db, portfolio)
    unrealized = sum((position.last_price - position.cost_basis) * position.quantity for position in positions)
    realized = sum(trade.realized_pnl or 0 for trade in trades)
    return {
        "simulation": True,
        "notice": "Paper trading is simulated and does not guarantee real-world returns. No broker order was placed.",
        "portfolio": {"id": portfolio.id, "name": portfolio.name, "starting_capital": portfolio.initial_cash, "cash": portfolio.cash, "equity": equity, "realized_pnl": realized, "unrealized_pnl": unrealized, "drawdown": 1 - equity / portfolio.high_watermark if portfolio.high_watermark else 0, "benchmark_symbol": portfolio.benchmark_symbol},
        "positions": [{"symbol": p.symbol, "quantity": p.quantity, "cost_basis": p.cost_basis, "last_price": p.last_price, "market_value": p.quantity * p.last_price, "source": p.source, "data_kind": p.data_kind, "observed_at": p.observed_at.isoformat()} for p in positions],
        "trades": [{"id": t.id, "signal_id": t.signal_id, "side": t.side, "symbol": t.symbol, "quantity": t.quantity, "observed_price": t.observed_price, "execution_price": t.execution_price, "fee": t.fee, "realized_pnl": t.realized_pnl, "source": t.source, "data_kind": t.data_kind, "strategy_version": t.strategy_version, "model_version": t.model_version, "observed_at": t.observed_at.isoformat()} for t in trades],
        "equity_curve": [{"timestamp": s.timestamp.isoformat(), "cash": s.cash, "positions_value": s.positions_value, "equity": s.equity, "benchmark_equity": s.benchmark_equity} for s in snapshots],
    }
