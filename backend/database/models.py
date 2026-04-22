"""
database/models.py — TradeMind AI SQLAlchemy ORM Models
=========================================================
Defines the SQLite schema for user profiles, virtual wallets,
open positions, trade history, and lesson progress.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import (
    Column, DateTime, Float, ForeignKey,
    Integer, String, Enum as SAEnum,
)
from sqlalchemy.orm import DeclarativeBase, relationship
import enum


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


# ── Enums ─────────────────────────────────────────────────────────────────────

class TradeAction(str, enum.Enum):
    BUY  = "BUY"
    SELL = "SELL"


# ── Models ────────────────────────────────────────────────────────────────────

class User(Base):
    """
    Represents a learner on the platform.
    Phase 1: Only user_id=1 (seeded at startup). Auth added in Phase 3.
    """
    __tablename__ = "users"

    id         = Column(Integer, primary_key=True, index=True)
    username   = Column(String(64), unique=True, nullable=False, default="trader_1")
    email      = Column(String(128), unique=True, nullable=True)
    xp         = Column(Integer, default=0, nullable=False)
    streak     = Column(Integer, default=0, nullable=False)   # consecutive days active
    created_at = Column(DateTime, default=_now, nullable=False)

    wallet    = relationship("Wallet",   back_populates="user", uselist=False, cascade="all, delete-orphan")
    positions = relationship("Position", back_populates="user", cascade="all, delete-orphan")
    trades    = relationship("Trade",    back_populates="user", cascade="all, delete-orphan")
    progress  = relationship("LessonProgress", back_populates="user", cascade="all, delete-orphan")


class Wallet(Base):
    """
    Virtual $100k paper-trading wallet.
    cash_balance tracks available USD. Unrealised P&L is computed on the fly.
    """
    __tablename__ = "wallets"

    id            = Column(Integer, primary_key=True, index=True)
    user_id       = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    cash_balance  = Column(Float, default=100_000.0, nullable=False)
    peak_balance  = Column(Float, default=100_000.0, nullable=False)  # for drawdown calc
    created_at    = Column(DateTime, default=_now, nullable=False)
    updated_at    = Column(DateTime, default=_now, onupdate=_now, nullable=False)

    user = relationship("User", back_populates="wallet")


class Position(Base):
    """
    An open (unrealised) position in the virtual portfolio.
    One row per symbol per user. Closed positions are removed and recorded in Trade.
    """
    __tablename__ = "positions"

    id        = Column(Integer, primary_key=True, index=True)
    user_id   = Column(Integer, ForeignKey("users.id"), nullable=False)
    symbol    = Column(String(16), nullable=False)
    qty       = Column(Float, nullable=False)
    avg_cost  = Column(Float, nullable=False)   # average entry price per share
    opened_at = Column(DateTime, default=_now, nullable=False)

    user = relationship("User", back_populates="positions")


class Trade(Base):
    """
    Immutable record of every executed buy/sell action.
    Realised P&L is only populated on SELL trades.
    """
    __tablename__ = "trades"

    id            = Column(Integer, primary_key=True, index=True)
    user_id       = Column(Integer, ForeignKey("users.id"), nullable=False)
    symbol        = Column(String(16), nullable=False)
    action        = Column(SAEnum(TradeAction), nullable=False)
    qty           = Column(Float, nullable=False)
    price         = Column(Float, nullable=False)
    total_value   = Column(Float, nullable=False)   # qty * price
    realised_pnl  = Column(Float, nullable=True)    # populated on SELL

    # AI Mentor feedback (stored as text, JSON-parseable)
    mentor_grade      = Column(String(4), nullable=True)    # A, B, C, D, F
    mentor_feedback   = Column(String(2048), nullable=True)
    devils_warning    = Column(String(2048), nullable=True)

    timestamp = Column(DateTime, default=_now, nullable=False)

    user = relationship("User", back_populates="trades")


class LessonProgress(Base):
    """
    Tracks which lessons a user has completed and their quiz score.
    """
    __tablename__ = "lesson_progress"

    id           = Column(Integer, primary_key=True, index=True)
    user_id      = Column(Integer, ForeignKey("users.id"), nullable=False)
    lesson_id    = Column(Integer, nullable=False)
    score        = Column(Integer, default=0, nullable=False)   # 0–100
    xp_earned    = Column(Integer, default=0, nullable=False)
    completed_at = Column(DateTime, default=_now, nullable=False)

    user = relationship("User", back_populates="progress")
