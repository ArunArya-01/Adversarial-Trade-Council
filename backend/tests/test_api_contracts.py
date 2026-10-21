"""Contract tests for the canonical Phase 1 module APIs."""

import os
import tempfile
import unittest

TEST_DATABASE = os.path.join(tempfile.gettempdir(), "trademind-contract-tests.db")
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DATABASE}"

from fastapi.testclient import TestClient
from main import app


class ModuleApiContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_academy_chapters_contract(self):
        response = self.client.get("/api/academy/chapters")
        self.assertEqual(response.status_code, 200)
        self.assertGreater(len(response.json()), 0)
        self.assertIn("id", response.json()[0])

    def test_academy_quiz_contract(self):
        chapter = self.client.get("/api/academy/chapters/ch-1-market-anatomy").json()
        answers = {str(index): question["correct"] for index, question in enumerate(chapter["quiz"])}
        response = self.client.post(
            "/api/academy/quizzes/submit",
            json={"chapter_id": chapter["id"], "answers": answers},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["score"], 100)

    def test_academy_practice_is_explicitly_simulated(self):
        response = self.client.get("/api/academy/practice/candles?symbol=RELIANCE")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["data_source"], "simulated")
        self.assertEqual(len(payload["candles"]), 50)
        self.assertEqual(payload["symbol"], "RELIANCE")

    def test_lab_status_declares_unavailable_data(self):
        response = self.client.get("/api/lab/status")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["module"], "ai-investment-lab")
        self.assertEqual(payload["data_source"], "unavailable")
        self.assertGreater(len(payload["capabilities"]), 0)


if __name__ == "__main__":
    unittest.main()
