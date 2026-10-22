import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

from services.lab.backtesting import BacktestConfig, run_backtest, run_backtest_comparison
from services.lab.data_pipeline import validate_csv


HEADER = "instrument,exchange,timestamp,timezone,frequency,open,high,low,close,volume\n"


def bars_from_prices(prices, volume=10_000):
    rows = []
    for index, price in enumerate(prices, start=1):
        timestamp = datetime(2025, 2, 1, 9, 15, tzinfo=timezone(timedelta(hours=5, minutes=30))) + timedelta(days=index - 1)
        rows.append(
            f"RELIANCE,NSE,{timestamp.isoformat()},Asia/Kolkata,1d,"
            f"{price},{price + 1},{price - 1},{price},{volume}"
        )
    return validate_csv(HEADER + "\n".join(rows) + "\n")


class BacktestingTests(unittest.TestCase):
    def test_buy_and_hold_enters_at_first_open_and_marks_to_last_close(self):
        result = run_backtest(
            bars_from_prices([100, 110, 120]),
            BacktestConfig(strategy="buy_and_hold", initial_cash=1_000, fee_bps=0, slippage_bps=0),
        )
        self.assertEqual(result["trade_ledger"][0]["execution_timestamp"], "2025-02-01T09:15:00+05:30")
        self.assertEqual(result["final_equity"], 1_200)
        self.assertAlmostEqual(result["metrics"]["cumulative_return"], 0.20)

    def test_sma_signal_executes_on_following_bar_not_same_close(self):
        result = run_backtest(
            bars_from_prices([100, 101, 102, 103, 104]),
            BacktestConfig(strategy="sma_crossover", initial_cash=1_000, fee_bps=0, slippage_bps=0, fast_window=2, slow_window=3),
        )
        self.assertEqual(len(result["trade_ledger"]), 1)
        self.assertEqual(result["trade_ledger"][0]["signal_timestamp"], "2025-02-03T09:15:00+05:30")
        self.assertEqual(result["trade_ledger"][0]["execution_timestamp"], "2025-02-04T09:15:00+05:30")

    def test_fees_slippage_and_volume_participation_reduce_execution(self):
        result = run_backtest(
            bars_from_prices([100, 100], volume=2),
            BacktestConfig(strategy="buy_and_hold", initial_cash=1_000, fee_bps=100, slippage_bps=100, max_participation_rate=0.5),
        )
        self.assertEqual(result["trade_ledger"][0]["quantity"], 1)
        self.assertLess(result["final_equity"], 1_000)
        self.assertEqual(result["assumptions"]["max_participation_rate"], 0.5)

    def test_comparison_includes_buy_and_hold_reference(self):
        result = run_backtest_comparison(
            bars_from_prices(list(range(100, 130))),
            BacktestConfig(strategy="momentum", fee_bps=0, slippage_bps=0, momentum_window=3),
        )
        self.assertEqual(result["baseline"]["name"], "buy_and_hold")
        self.assertIn("excess_cumulative_return", result)

    def test_out_of_sample_start_uses_prior_history_only_for_warmup(self):
        bars = bars_from_prices(list(range(100, 130)))
        result = run_backtest(
            bars,
            BacktestConfig(strategy="sma_crossover", fee_bps=0, slippage_bps=0, fast_window=2, slow_window=3, evaluation_start=bars[10].timestamp),
        )
        self.assertEqual(result["equity_curve"][0]["timestamp"], bars[10].timestamp)
        self.assertEqual(result["assumptions"]["indicator_history_before_evaluation"], 10)

    def test_backtest_api_uses_imported_dataset_only(self):
        from fastapi.testclient import TestClient
        from main import app

        csv_content = HEADER + "\n".join(
            f"RELIANCE,NSE,2025-03-{index:02d}T09:15:00+05:30,Asia/Kolkata,1d,{100 + index},{101 + index},{99 + index},{100 + index},10000"
            for index in range(1, 26)
        ) + "\n"
        with tempfile.TemporaryDirectory() as directory, patch.dict("os.environ", {"LAB_DATA_ROOT": directory}):
            client = TestClient(app)
            imported = client.post("/api/lab/datasets/import", data={"source": "test fixture"}, files={"file": ("sample.csv", csv_content.encode(), "text/csv")})
            response = client.post("/api/lab/backtests", json={"dataset_id": imported.json()["dataset_id"], "strategy": "sma_crossover"})
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["data_kind"], "historical")
        self.assertEqual(response.json()["baseline"]["name"], "buy_and_hold")
