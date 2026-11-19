import unittest

from src.time_machine import SimulationConfig, simulate_daily_trade


def rows():
    return [{"timestamp": f"2025-01-{index + 1:02d}T15:30:00+05:30", "close": 100 + index + (index % 3)} for index in range(35)]


class TimeMachineTests(unittest.TestCase):
    def test_seeded_daily_simulation_is_repeatable_and_compares_actual_outcome(self):
        config = SimulationConfig(entry_index=25, target_fraction=.03, stop_fraction=.02, simulations=50, seed=7)
        first, second = simulate_daily_trade(rows(), config), simulate_daily_trade(rows(), config)
        self.assertEqual(first, second)
        self.assertEqual(sum(first["simulated"]["outcome_counts"].values()), 50)
        self.assertIn(first["actual_historical_outcome"]["outcome"], {"target_hit", "stop_hit", "neither_hit"})

    def test_rejects_entry_without_sufficient_pre_entry_or_actual_history(self):
        with self.assertRaisesRegex(ValueError, "entry requires"):
            simulate_daily_trade(rows(), SimulationConfig(entry_index=10, target_fraction=.03, stop_fraction=.02))
