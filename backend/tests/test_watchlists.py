import unittest

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database.db import Base
from services.lab.watchlists import WatchlistError, add_item, create, list_all


class WatchlistTests(unittest.TestCase):
    def setUp(self):
        engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(engine)
        self.db = sessionmaker(bind=engine)()

    def tearDown(self):
        self.db.close()

    def test_watchlist_keeps_symbol_provenance_without_market_claims(self):
        watchlist = create(self.db, "Quality research")
        watchlist = add_item(self.db, watchlist["id"], "reliance", "nse", "Review earnings data")
        self.assertEqual(watchlist["items"][0]["symbol"], "RELIANCE")
        self.assertIn("no live prices", watchlist["notice"])
        self.assertEqual(len(list_all(self.db)), 1)

    def test_duplicate_symbol_is_rejected(self):
        watchlist = create(self.db, "Duplicates")
        add_item(self.db, watchlist["id"], "TCS", "NSE", None)
        with self.assertRaisesRegex(WatchlistError, "already exists"):
            add_item(self.db, watchlist["id"], "tcs", "nse", None)
