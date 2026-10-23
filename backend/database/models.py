from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON
from datetime import datetime
from .db import Base

class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, default="default_user", index=True)
    completed_lessons = Column(JSON, default=list)
    completed_scenarios = Column(JSON, default=list)
    total_xp = Column(Integer, default=0)
    virtual_cash = Column(Float, default=15000.0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class PaperPortfolio(Base):
    """A Lab-only simulated portfolio; it is never connected to a broker."""
    __tablename__ = "paper_portfolios"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    initial_cash = Column(Float, nullable=False)
    cash = Column(Float, nullable=False)
    benchmark_symbol = Column(String, nullable=True)
    benchmark_base_price = Column(Float, nullable=True)
    fee_bps = Column(Float, nullable=False)
    slippage_bps = Column(Float, nullable=False)
    max_position_fraction = Column(Float, nullable=False)
    max_total_exposure_fraction = Column(Float, nullable=False)
    max_drawdown_fraction = Column(Float, nullable=False)
    high_watermark = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class PaperPosition(Base):
    __tablename__ = "paper_positions"

    id = Column(Integer, primary_key=True)
    portfolio_id = Column(String, index=True, nullable=False)
    symbol = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    cost_basis = Column(Float, nullable=False)
    last_price = Column(Float, nullable=False)
    observed_at = Column(DateTime, nullable=False)
    source = Column(String, nullable=False)
    data_kind = Column(String, nullable=False)


class PaperTrade(Base):
    __tablename__ = "paper_trades"

    id = Column(String, primary_key=True)
    portfolio_id = Column(String, index=True, nullable=False)
    signal_id = Column(String, unique=True, index=True, nullable=False)
    side = Column(String, nullable=False)
    symbol = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    observed_price = Column(Float, nullable=False)
    execution_price = Column(Float, nullable=False)
    fee = Column(Float, nullable=False)
    realized_pnl = Column(Float, nullable=True)
    observed_at = Column(DateTime, nullable=False)
    source = Column(String, nullable=False)
    data_kind = Column(String, nullable=False)
    strategy_version = Column(String, nullable=False)
    model_version = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class PaperEquitySnapshot(Base):
    __tablename__ = "paper_equity_snapshots"

    id = Column(Integer, primary_key=True)
    portfolio_id = Column(String, index=True, nullable=False)
    timestamp = Column(DateTime, nullable=False)
    cash = Column(Float, nullable=False)
    positions_value = Column(Float, nullable=False)
    equity = Column(Float, nullable=False)
    benchmark_equity = Column(Float, nullable=True)


class LabWatchlist(Base):
    __tablename__ = "lab_watchlists"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class LabWatchlistItem(Base):
    __tablename__ = "lab_watchlist_items"

    id = Column(Integer, primary_key=True)
    watchlist_id = Column(String, index=True, nullable=False)
    symbol = Column(String, nullable=False)
    exchange = Column(String, nullable=False)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
