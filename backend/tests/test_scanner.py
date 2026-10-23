import unittest

from services.lab.data_pipeline import MarketBar
from services.lab.scanner import ScannerError, scan_latest


def bars(count=25):
    return [MarketBar("RELIANCE", "NSE", f"2025-01-{index + 1:02d}T09:15:00+05:30", "Asia/Kolkata", "1d", 100 + index, 101 + index, 99 + index, 100 + index, 1000) for index in range(count)]


class ScannerTests(unittest.TestCase):
    def test_scanner_returns_timestamped_historical_qualification(self):
        result = scan_latest(bars(), minimum_rsi=50, require_positive_momentum=True)
        self.assertEqual(result["data_kind"], "historical")
        self.assertTrue(result["qualified"])
        self.assertIn("not a live quote", result["notice"])

    def test_scanner_rejects_insufficient_history(self):
        with self.assertRaisesRegex(ScannerError, "lacks enough history"):
            scan_latest(bars(10))
