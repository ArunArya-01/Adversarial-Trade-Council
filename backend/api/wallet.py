"""
api/wallet.py — TradeMind AI Virtual Wallet
============================================
Routes:
  GET  /api/wallet/balance   — portfolio summary (cash, positions, total equity, P&L)
  POST /api/wallet/buy       — execute virtual buy, deduct cash, get AI mentor feedback
  POST /api/wallet/sell      — close/reduce position, realise P&L, get mentor feedback
"""
from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database.db import get_db
from database.models import Position, Trade, TradeAction, Wallet as WalletModel
from agents.mentor import evaluate_trade, devils_advocate, MentorFeedback, AdversarialWarning

router = APIRouter(prefix="/wallet", tags=["Wallet"])


# ── Pydantic Schemas ──────────────────────────────────────────────────────────

class PositionOut(BaseModel):
    symbol: str
    qty: float
    avg_cost: float
    current_price: float
    market_value: float
    unrealised_pnl: float
    unrealised_pnl_pct: float


class BalanceResponse(BaseModel):
    user_id: int
    cash_balance: float
    positions: List[PositionOut]
    total_equity: float
    total_invested: float
    total_unrealised_pnl: float
    total_unrealised_pnl_pct: float


class BuyRequest(BaseModel):
    user_id: int = Field(default=1)
    symbol: str = Field(min_length=1, max_length=10, examples=["AAPL"])
    qty: float = Field(gt=0, description="Number of shares to buy")
    price: float = Field(gt=0, description="Current price per share")
    market_context: str = Field(
        default="Standard market conditions.",
        max_length=500,
    )


class SellRequest(BaseModel):
    user_id: int = Field(default=1)
    symbol: str = Field(min_length=1, max_length=10)
    qty: float = Field(gt=0, description="Number of shares to sell")
    price: float = Field(gt=0, description="Current price per share")
    market_context: str = Field(
        default="Standard market conditions.",
        max_length=500,
    )


class TradeResponse(BaseModel):
    success: bool
    message: str
    trade_id: int
    symbol: str
    action: str
    qty: float
    price: float
    total_value: float
    cash_remaining: float
    realised_pnl: Optional[float] = None
    mentor: Optional[dict] = None
    devil: Optional[dict] = None


# ── Helper: compute current portfolio value ────────────────────────────────────

def _portfolio_equity(positions: List[Position], price_map: dict) -> float:
    """Sum of market values of all open positions."""
    return sum(
        pos.qty * price_map.get(pos.symbol, pos.avg_cost)
        for pos in positions
    )


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/balance", response_model=BalanceResponse, summary="Get portfolio balance")
def get_balance(
    user_id: int = 1,
    db: Session = Depends(get_db),
) -> BalanceResponse:
    """
    Returns the current portfolio state:
      - Available cash
      - All open positions with unrealised P&L
      - Total equity (cash + market value of all positions)
    """
    wallet = db.query(WalletModel).filter(WalletModel.user_id == user_id).first()
    if wallet is None:
        raise HTTPException(status_code=404, detail=f"Wallet for user_id={user_id} not found.")

    positions = db.query(Position).filter(Position.user_id == user_id).all()

    # For Phase 1, current price = avg_cost (no live feed yet).
    # In Phase 2, this will pull from the MarketReplay current price.
    position_outs = []
    total_invested = 0.0
    total_market_value = 0.0

    for pos in positions:
        # Phase 1: treat avg_cost as current price (no live price feed yet)
        current_price = pos.avg_cost
        market_value = pos.qty * current_price
        cost_basis = pos.qty * pos.avg_cost
        unrealised_pnl = market_value - cost_basis
        unrealised_pnl_pct = (unrealised_pnl / cost_basis * 100) if cost_basis > 0 else 0.0

        total_invested += cost_basis
        total_market_value += market_value

        position_outs.append(PositionOut(
            symbol=pos.symbol,
            qty=pos.qty,
            avg_cost=round(pos.avg_cost, 4),
            current_price=round(current_price, 4),
            market_value=round(market_value, 4),
            unrealised_pnl=round(unrealised_pnl, 4),
            unrealised_pnl_pct=round(unrealised_pnl_pct, 2),
        ))

    total_equity = wallet.cash_balance + total_market_value
    total_unrealised_pnl = total_market_value - total_invested
    total_pnl_pct = (total_unrealised_pnl / total_invested * 100) if total_invested > 0 else 0.0

    return BalanceResponse(
        user_id=user_id,
        cash_balance=round(wallet.cash_balance, 2),
        positions=position_outs,
        total_equity=round(total_equity, 2),
        total_invested=round(total_invested, 2),
        total_unrealised_pnl=round(total_unrealised_pnl, 2),
        total_unrealised_pnl_pct=round(total_pnl_pct, 2),
    )


@router.post("/buy", response_model=TradeResponse, summary="Execute virtual buy")
async def buy(body: BuyRequest, db: Session = Depends(get_db)) -> TradeResponse:
    """
    Executes a virtual BUY order:
    1. Validates sufficient cash
    2. Creates/updates Position record
    3. Deducts cash from Wallet
    4. Records Trade with AI mentor feedback
    5. Returns trade result + mentor grade + devil's warning
    """
    wallet = db.query(WalletModel).filter(WalletModel.user_id == body.user_id).first()
    if wallet is None:
        raise HTTPException(status_code=404, detail="Wallet not found.")

    total_cost = body.qty * body.price
    if wallet.cash_balance < total_cost:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient funds. Need ${total_cost:,.2f}, have ${wallet.cash_balance:,.2f}.",
        )

    # ── Run AI mentor & devil concurrently ────────────────────────────────────
    trade_context = {
        "symbol": body.symbol,
        "action": "BUY",
        "qty": body.qty,
        "price": body.price,
        "total_cost": total_cost,
        "cash_before": wallet.cash_balance,
        "market_context": body.market_context,
    }
    mentor_result, devil_result = await asyncio.gather(
        evaluate_trade(trade_context),
        devils_advocate(trade_context),
    )

    # ── Update Position (average-in if existing) ──────────────────────────────
    position = (
        db.query(Position)
        .filter(Position.user_id == body.user_id, Position.symbol == body.symbol)
        .first()
    )
    if position:
        # Weighted average cost
        total_qty = position.qty + body.qty
        position.avg_cost = (
            (position.qty * position.avg_cost + body.qty * body.price) / total_qty
        )
        position.qty = total_qty
    else:
        position = Position(
            user_id=body.user_id,
            symbol=body.symbol,
            qty=body.qty,
            avg_cost=body.price,
        )
        db.add(position)

    # ── Deduct cash ───────────────────────────────────────────────────────────
    wallet.cash_balance -= total_cost

    # ── Record trade ──────────────────────────────────────────────────────────
    trade = Trade(
        user_id=body.user_id,
        symbol=body.symbol,
        action=TradeAction.BUY,
        qty=body.qty,
        price=body.price,
        total_value=total_cost,
        realised_pnl=None,
        mentor_grade=mentor_result.grade,
        mentor_feedback=mentor_result.what_went_right + " | " + mentor_result.lesson_tip,
        devils_warning="; ".join(devil_result.warnings),
    )
    db.add(trade)
    db.commit()
    db.refresh(trade)

    return TradeResponse(
        success=True,
        message=f"Bought {body.qty} shares of {body.symbol} at ${body.price:,.2f}.",
        trade_id=trade.id,
        symbol=body.symbol,
        action="BUY",
        qty=body.qty,
        price=body.price,
        total_value=total_cost,
        cash_remaining=round(wallet.cash_balance, 2),
        mentor=mentor_result.model_dump(),
        devil=devil_result.model_dump(),
    )


@router.post("/sell", response_model=TradeResponse, summary="Execute virtual sell")
async def sell(body: SellRequest, db: Session = Depends(get_db)) -> TradeResponse:
    """
    Executes a virtual SELL order:
    1. Validates open position exists with sufficient qty
    2. Calculates realised P&L
    3. Updates Position (or deletes if fully closed)
    4. Credits cash to Wallet
    5. Returns trade result + mentor grade
    """
    wallet = db.query(WalletModel).filter(WalletModel.user_id == body.user_id).first()
    if wallet is None:
        raise HTTPException(status_code=404, detail="Wallet not found.")

    position = (
        db.query(Position)
        .filter(Position.user_id == body.user_id, Position.symbol == body.symbol)
        .first()
    )
    if position is None:
        raise HTTPException(status_code=400, detail=f"No open position in {body.symbol}.")
    if body.qty > position.qty:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot sell {body.qty} shares — only {position.qty} held.",
        )

    total_proceeds = body.qty * body.price
    cost_basis = body.qty * position.avg_cost
    realised_pnl = total_proceeds - cost_basis

    # ── Run AI mentor concurrently ────────────────────────────────────────────
    trade_context = {
        "symbol": body.symbol,
        "action": "SELL",
        "qty": body.qty,
        "price": body.price,
        "avg_cost": position.avg_cost,
        "realised_pnl": realised_pnl,
        "total_proceeds": total_proceeds,
        "market_context": body.market_context,
    }
    mentor_result, devil_result = await asyncio.gather(
        evaluate_trade(trade_context),
        devils_advocate(trade_context),
    )

    # ── Update or remove position ─────────────────────────────────────────────
    if body.qty == position.qty:
        db.delete(position)
    else:
        position.qty -= body.qty

    # ── Credit cash ───────────────────────────────────────────────────────────
    wallet.cash_balance += total_proceeds

    # ── Record trade ──────────────────────────────────────────────────────────
    trade = Trade(
        user_id=body.user_id,
        symbol=body.symbol,
        action=TradeAction.SELL,
        qty=body.qty,
        price=body.price,
        total_value=total_proceeds,
        realised_pnl=realised_pnl,
        mentor_grade=mentor_result.grade,
        mentor_feedback=mentor_result.what_went_right + " | " + mentor_result.lesson_tip,
        devils_warning="; ".join(devil_result.warnings),
    )
    db.add(trade)
    db.commit()
    db.refresh(trade)

    return TradeResponse(
        success=True,
        message=(
            f"Sold {body.qty} shares of {body.symbol} at ${body.price:,.2f}. "
            f"P&L: {'▲' if realised_pnl >= 0 else '▼'} ${abs(realised_pnl):,.2f}"
        ),
        trade_id=trade.id,
        symbol=body.symbol,
        action="SELL",
        qty=body.qty,
        price=body.price,
        total_value=total_proceeds,
        cash_remaining=round(wallet.cash_balance, 2),
        realised_pnl=round(realised_pnl, 2),
        mentor=mentor_result.model_dump(),
        devil=devil_result.model_dump(),
    )


@router.get("/history", summary="Trade history for a user")
def trade_history(user_id: int = 1, limit: int = 20, db: Session = Depends(get_db)) -> list:
    """Returns the most recent trades for the given user."""
    trades = (
        db.query(Trade)
        .filter(Trade.user_id == user_id)
        .order_by(Trade.timestamp.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": t.id,
            "symbol": t.symbol,
            "action": t.action.value,
            "qty": t.qty,
            "price": t.price,
            "total_value": t.total_value,
            "realised_pnl": t.realised_pnl,
            "mentor_grade": t.mentor_grade,
            "timestamp": t.timestamp.isoformat(),
        }
        for t in trades
    ]
