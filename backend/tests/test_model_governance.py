import unittest

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database.db import Base
from services.lab.model_governance import GovernanceError, activate_approved, approve_candidate, governance_summary, register_candidate


class ModelGovernanceTests(unittest.TestCase):
    def setUp(self):
        engine = create_engine("sqlite:///:memory:"); Base.metadata.create_all(engine); self.db = sessionmaker(bind=engine)()

    def tearDown(self): self.db.close()

    def test_candidate_requires_explicit_approval_before_activation_and_is_audited(self):
        register_candidate(self.db, "v1", "bundle-1", "data-1", "reviewer", "registered evidence")
        with self.assertRaisesRegex(GovernanceError, "approved"):
            activate_approved(self.db, "v1", "reviewer", "activate")
        approve_candidate(self.db, "v1", "reviewer", "review complete")
        activate_approved(self.db, "v1", "operator", "approved deployment")
        summary = governance_summary(self.db)
        self.assertEqual(summary["active_model_version"], "v1")
        self.assertIn("Governance metadata", summary["notice"])
