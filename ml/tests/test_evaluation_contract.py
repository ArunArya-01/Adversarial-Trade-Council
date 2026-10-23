import unittest

from src.evaluation import purged_train_validation_test_split


class EvaluationContractTests(unittest.TestCase):
    def test_split_embargoes_label_horizon_between_partitions(self):
        split = purged_train_validation_test_split(200, horizon=5)
        self.assertGreaterEqual(split.validation_start - split.train_end, 5)
        self.assertGreaterEqual(split.test_start - split.validation_end, 5)

    def test_split_rejects_insufficient_history(self):
        with self.assertRaises(ValueError):
            purged_train_validation_test_split(20, horizon=5)
