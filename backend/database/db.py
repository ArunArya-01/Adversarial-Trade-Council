"""
database/db.py — TradeMind AI SQLite Engine & Session Factory
=============================================================
Provides:
  - `engine`        — SQLAlchemy engine pointed at trademind.db
  - `SessionLocal`  — Session factory for dependency injection
  - `get_db()`      — FastAPI dependency that yields a DB session
  - `init_db()`     — Creates all tables and seeds the default user/wallet
"""
from __future__ import annotations

import os
from contextlib import contextmanager
from typing import Generator

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session

from database.models import Base, User, Wallet

# ── Engine ────────────────────────────────────────────────────────────────────

# Allow DATABASE_URL override via env; default to a local file
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./trademind.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # required for SQLite + FastAPI threads
    echo=False,
)

# Enable WAL mode for better concurrent read performance
@event.listens_for(engine, "connect")
def _set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


# ── Session Factory ───────────────────────────────────────────────────────────

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


# ── FastAPI Dependency ────────────────────────────────────────────────────────

def get_db() -> Generator[Session, None, None]:
    """
    Yields a database session and ensures it is closed after the request,
    even if an exception occurs.

    Usage in a route:
        @router.get("/example")
        def example(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Database Initialisation ───────────────────────────────────────────────────

DEFAULT_WALLET_BALANCE = float(os.getenv("DEFAULT_WALLET_BALANCE", "100000.0"))


def init_db() -> None:
    """
    Creates all tables (if they don't exist) and seeds the Phase 1 default
    user (id=1, username='trader_1') and their $100k virtual wallet.

    This function is idempotent — safe to call on every startup.
    """
    # Create all tables
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        # Seed default user if not present
        user = db.get(User, 1)
        if user is None:
            user = User(id=1, username="trader_1", email=None, xp=0, streak=0)
            db.add(user)
            db.flush()  # get user.id before creating wallet

        # Seed default wallet if not present
        wallet = db.query(Wallet).filter(Wallet.user_id == 1).first()
        if wallet is None:
            wallet = Wallet(
                user_id=1,
                cash_balance=DEFAULT_WALLET_BALANCE,
                peak_balance=DEFAULT_WALLET_BALANCE,
            )
            db.add(wallet)

        db.commit()
        print(f"[DB] Initialised. Default user=1, wallet balance=${DEFAULT_WALLET_BALANCE:,.0f}")
