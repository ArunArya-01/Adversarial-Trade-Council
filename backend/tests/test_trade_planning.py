import unittest
from services.lab.trade_planning import TradePlan, TradePlanningError, size_long_position


class TradePlanningTests(unittest.TestCase):
    def test_sizes_whole_shares_with_costs_and_risk_cap(self):
        result = size_long_position(TradePlan("RELIANCE", 100, 95, 110, 5, "audited fixture", "historical", "plan-v1"), 100_000, .01, .20)
        self.assertTrue(result["eligible"]); self.assertGreater(result["quantity"], 0); self.assertLessEqual(result["maximum_estimated_loss_inr"], 1000)
        self.assertTrue(result["simulation"])

    def test_rejects_live_and_invalid_stop_plan(self):
        with self.assertRaisesRegex(TradePlanningError, "historical or simulated"):
            size_long_position(TradePlan("X", 100, 95, 110, 1, "x", "live", "v1"), 1000, .01, .2)
