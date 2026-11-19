import json
import tempfile
import unittest
from pathlib import Path

from services.lab.nse_normalization import NseNormalizationError, normalize_bytes, normalize_file


STOCK = '''Symbol  ,Series  ,Date  ,Open Price  ,High Price  ,Low Price  ,Close Price  ,Total Traded Quantity  
"RELIANCE","EQ","23-Oct-2024","2,500.00","2,550.00","2,490.00","2,540.00","1,20,000"\n"RELIANCE","EQ","22-Oct-2024","2,450.00","2,510.00","2,440.00","2,500.00","90,000"\n'''.encode()
NIFTY = '''Index Name,Date,Open,High,Low,Close\n"NIFTY 50","23 Oct 2024","24500","24600","24400","24550"\n'''.encode()


class NseNormalizationTests(unittest.TestCase):
    def test_equity_segment_normalizes_indian_numbers_and_sorts_dates(self):
        result = normalize_bytes(STOCK, "stocks/reliance.csv")
        self.assertEqual(result.source_kind, "nse_equity_bhavcopy_export")
        self.assertEqual(result.bars[0].timestamp, "2024-10-22T15:30:00+05:30")
        self.assertEqual(result.bars[1].volume, 120000.0)
        self.assertEqual(result.manifest()["volume_status"], "reported")

    def test_benchmark_records_that_volume_is_unavailable(self):
        result = normalize_bytes(NIFTY)
        self.assertEqual(result.bars[0].instrument, "NIFTY 50")
        self.assertEqual(result.bars[0].volume, 0.0)
        self.assertEqual(result.volume_status, "unavailable_zero")

    def test_malformed_rows_are_reported_without_changing_valid_rows(self):
        result = normalize_bytes(STOCK + b'"RELIANCE","EQ","21-Oct-2024","bad","2","1","2","1"\n')
        self.assertEqual(result.rows_normalized, 2)
        self.assertEqual(len(result.rejected_rows), 1)

    def test_duplicate_sessions_are_rejected(self):
        duplicate = STOCK + b'"RELIANCE","EQ","23-Oct-2024","2","3","1","2","1"\n'
        with self.assertRaisesRegex(NseNormalizationError, "duplicate session"):
            normalize_bytes(duplicate)

    def test_output_is_reproducible_and_has_provenance_manifest(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory, "reliance.csv")
            source.write_bytes(STOCK)
            output = Path(directory, "normalized")
            first, second = normalize_file(source, output), normalize_file(source, output)
            self.assertEqual(first.source_sha256, second.source_sha256)
            manifest = json.loads(next((output / "reports").glob("*.json")).read_text())
            self.assertEqual(manifest["source_sha256"], first.source_sha256)
            self.assertEqual(manifest["rows_normalized"], 2)

    def test_identical_downloads_keep_separate_source_lineage_outputs(self):
        with tempfile.TemporaryDirectory() as directory:
            root, output = Path(directory), Path(directory, "normalized")
            Path(root, "one.csv").write_bytes(STOCK)
            Path(root, "two.csv").write_bytes(STOCK)
            normalize_file(Path(root, "one.csv"), output)
            normalize_file(Path(root, "two.csv"), output)
            self.assertEqual(len(list((output / "segments").glob("*.jsonl"))), 2)
            self.assertEqual(len(list((output / "reports").glob("*.json"))), 2)
