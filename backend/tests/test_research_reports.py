import unittest

from services.lab.research import DisabledNarrator, build_report


PORTFOLIO = {
    "simulation": True,
    "portfolio": {"id": "portfolio-1", "name": "Fixture", "starting_capital": 1000, "cash": 700, "equity": 1100, "realized_pnl": 25, "unrealized_pnl": 75, "drawdown": 0.05},
    "positions": [{"symbol": "RELIANCE", "quantity": 2, "observed_at": "2025-01-02T00:00:00+00:00", "source": "fixture", "data_kind": "historical"}],
    "trades": [{"id": "trade-1", "source": "fixture", "data_kind": "historical", "observed_at": "2025-01-01T00:00:00+00:00"}],
    "equity_curve": [{"timestamp": "2025-01-02T00:00:00+00:00"}],
}


class ResearchReportTests(unittest.TestCase):
    def test_report_separates_evidence_and_never_enables_trading(self):
        report = build_report(PORTFOLIO, None, "RELIANCE", "What is known?", DisabledNarrator())
        self.assertEqual(report["verified_evidence"]["observed_facts"]["candidate_assessment"]["status"], "observed_in_portfolio")
        self.assertAlmostEqual(report["verified_evidence"]["calculated_metrics"]["portfolio_return"], 0.1)
        self.assertEqual(report["ai_narration"]["status"], "unavailable")
        self.assertFalse(report["safety"]["can_submit_orders"])

    def test_missing_candidate_is_explicitly_not_evaluable(self):
        report = build_report(PORTFOLIO, None, "TCS", None, DisabledNarrator())
        assessment = report["verified_evidence"]["observed_facts"]["candidate_assessment"]
        self.assertEqual(assessment["status"], "not_evaluable")
        self.assertIn("No verified", assessment["reason"])
