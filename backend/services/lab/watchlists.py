"""Persistent symbol research lists; deliberately no prices, signals, or orders."""

from __future__ import annotations

from uuid import uuid4

from sqlalchemy.orm import Session

from database.models import LabWatchlist, LabWatchlistItem


class WatchlistError(ValueError):
    pass


def serialize(db: Session, watchlist: LabWatchlist) -> dict:
    items = db.query(LabWatchlistItem).filter_by(watchlist_id=watchlist.id).order_by(LabWatchlistItem.symbol).all()
    return {"id": watchlist.id, "name": watchlist.name, "created_at": watchlist.created_at.isoformat(), "items": [{"id": item.id, "symbol": item.symbol, "exchange": item.exchange, "note": item.note, "created_at": item.created_at.isoformat()} for item in items], "notice": "Watchlists organize research symbols only; they contain no live prices, signals, or brokerage actions."}


def create(db: Session, name: str) -> dict:
    if not name.strip():
        raise WatchlistError("watchlist name is required")
    watchlist = LabWatchlist(id=str(uuid4()), name=name.strip())
    db.add(watchlist); db.commit(); db.refresh(watchlist)
    return serialize(db, watchlist)


def add_item(db: Session, watchlist_id: str, symbol: str, exchange: str, note: str | None) -> dict:
    watchlist = db.get(LabWatchlist, watchlist_id)
    if watchlist is None:
        raise WatchlistError("watchlist not found")
    symbol, exchange = symbol.strip().upper(), exchange.strip().upper()
    if not symbol or not exchange:
        raise WatchlistError("symbol and exchange are required")
    if db.query(LabWatchlistItem).filter_by(watchlist_id=watchlist_id, symbol=symbol, exchange=exchange).first():
        raise WatchlistError("symbol already exists in this watchlist")
    db.add(LabWatchlistItem(watchlist_id=watchlist_id, symbol=symbol, exchange=exchange, note=note.strip() if note else None))
    db.commit()
    return serialize(db, watchlist)


def list_all(db: Session) -> list[dict]:
    return [serialize(db, row) for row in db.query(LabWatchlist).order_by(LabWatchlist.created_at.desc())]
