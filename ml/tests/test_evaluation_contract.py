import unittest
from datetime import datetime, timedelta

from src.evaluation import purged_timestamp_split, purged_train_validation_test_split


class EvaluationContractTests(unittest.TestCase):
    def test_split_embargoes_label_horizon_between_partitions(self):
        split = purged_train_validation_test_split(200, horizon=5)
        self.assertGreaterEqual(split.validation_start - split.train_end, 5)
        self.assertGreaterEqual(split.test_start - split.validation_end, 5)

    def test_split_rejects_insufficient_history(self):
        with self.assertRaises(ValueError):
            purged_train_validation_test_split(20, horizon=5)

    def test_timestamp_split_keeps_all_instruments_on_the_same_side_of_a_boundary(self):
        start = datetime(2025, 1, 1)
        timestamps = [f"{(start + timedelta(days=day)).date()}T15:30:00+05:30" for day in range(70) for _instrument in ("AAA", "BBB")]
        split = purged_timestamp_split(timestamps, horizon=5)
        self.assertTrue(set(split.train_timestamps).isdisjoint(split.validation_timestamps))
        self.assertTrue(set(split.validation_timestamps).isdisjoint(split.test_timestamps))
        self.assertGreaterEqual(len(set(timestamps)) - len(split.train_timestamps) - len(split.validation_timestamps) - len(split.test_timestamps), 10)
