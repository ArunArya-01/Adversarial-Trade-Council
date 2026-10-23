import unittest
from datetime import datetime, timezone

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database.db import Base
from services.lab.paper_trading import PaperTradeSignal, PaperTradingError, create_portfolio, execute_signal, portfolio_report


class PaperTradingTests(unittest.TestCase):
    def setUp(self):
        engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(engine)
        self.db = sessionmaker(bind=engine)()
        self.portfolio = create_portfolio(self.db, "Risk test", 10_000, "NIFTY", 10, 5, 0.30, 0.80, 0.20)
        self.observed_at = datetime(2025, 1, 1, tzinfo=timezone.utc)

    def tearDown(self):
        self.db.close()

    def signal(self, **overrides):
        values = {"signal_id": "entry-1", "side": "BUY", "symbol": "RELIANCE", "quantity": 10, "observed_price": 100, "observed_at": self.observed_at, "source": "validated-fixture", "data_kind": "historical", "strategy_version": "baseline-v1", "model_version": None, "benchmark_price": 200}
        values.update(overrides)
        return PaperTradeSignal(**values)

    def test_cash_positions_and_provenance_reconcile(self):
        execute_signal(self.db, self.portfolio.id, self.signal())
        report = portfolio_report(self.db, self.portfolio.id)
        self.assertEqual(report["positions"][0]["quantity"], 10)
        self.assertEqual(report["trades"][0]["strategy_version"], "baseline-v1")
        self.assertAlmostEqual(report["portfolio"]["cash"], 8_998.4995)
        self.assertAlmostEqual(report["portfolio"]["equity"], 9_998.4995)

    def test_sell_records_realized_pnl_and_removes_position(self):
        execute_signal(self.db, self.portfolio.id, self.signal())
        execute_signal(self.db, self.portfolio.id, self.signal(signal_id="exit-1", side="SELL", quantity=10, observed_price=120))
        report = portfolio_report(self.db, self.portfolio.id)
        self.assertEqual(report["positions"], [])
        self.assertGreater(report["trades"][-1]["realized_pnl"], 0)

    def test_concentration_and_duplicate_signal_are_rejected(self):
        with self.assertRaisesRegex(PaperTradingError, "concentration"):
            execute_signal(self.db, self.portfolio.id, self.signal(quantity=31))
        execute_signal(self.db, self.portfolio.id, self.signal())
        with self.assertRaisesRegex(PaperTradingError, "duplicate"):
            execute_signal(self.db, self.portfolio.id, self.signal())

    def test_invalid_live_data_and_naked_sell_are_rejected(self):
        with self.assertRaisesRegex(PaperTradingError, "historical or simulated"):
            execute_signal(self.db, self.portfolio.id, self.signal(data_kind="live"))
        with self.assertRaisesRegex(PaperTradingError, "cannot sell"):
            execute_signal(self.db, self.portfolio.id, self.signal(side="SELL"))

    def test_out_of_order_observation_is_rejected_as_stale(self):
        execute_signal(self.db, self.portfolio.id, self.signal())
        with self.assertRaisesRegex(PaperTradingError, "stale observation"):
            execute_signal(self.db, self.portfolio.id, self.signal(signal_id="stale", observed_at=datetime(2024, 12, 31, tzinfo=timezone.utc)))
