"""Honest availability API for the AI Investment Lab's first UI release.

No market-data provider, strategy result, model, or portfolio is fabricated here.
Those services arrive only after their respective validated implementation phases.
"""

from datetime import datetime, timezone
from typing import Literal, Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel, Field

from services.lab.backtesting import BacktestConfig, BacktestValidationError, run_backtest_comparison
from services.lab.data_pipeline import DatasetValidationError, LocalDatasetStore
from services.lab.market_data import GrowwMarketDataAdapter

router = APIRouter(prefix="/lab", tags=["AI Investment Lab"])


class CapabilityStatus(BaseModel):
    id: str
    label: str
    status: Literal["available", "planned", "unavailable"]
    message: str


class LabStatus(BaseModel):
    module: Literal["ai-investment-lab"]
    data_source: Literal["local-csv-only"]
    as_of: datetime
    capabilities: list[CapabilityStatus]
    notice: str


CAPABILITIES = [
    CapabilityStatus(id="scanner", label="Stock Scanner", status="planned", message="Requires validated historical or live market data."),
    CapabilityStatus(id="watchlists", label="Watchlists", status="planned", message="Watchlist persistence is scheduled for a later phase."),
    CapabilityStatus(id="market-data", label="Market Data", status="planned", message="Local historical CSV imports are supported; no approved provider or live feed is connected."),
    CapabilityStatus(id="strategies", label="Strategy Lab", status="available", message="Transparent buy-and-hold, moving-average crossover, and momentum baselines are available through the historical backtest API."),
    CapabilityStatus(id="backtesting", label="Backtesting", status="available", message="Historical backtests apply documented fees, slippage, next-bar execution, and volume participation limits."),
    CapabilityStatus(id="ml", label="ML Experiments", status="planned", message="Training is reserved for the Colab research phase."),
    CapabilityStatus(id="paper-trading", label="Paper Trading", status="planned", message="A separate Lab portfolio is not active yet."),
    CapabilityStatus(id="risk", label="Risk Analytics", status="planned", message="Risk analytics depend on validated data and portfolio services."),
]


@router.get("/status", response_model=LabStatus)
def lab_status():
    return LabStatus(
        module="ai-investment-lab",
        data_source="local-csv-only",
        as_of=datetime.now(timezone.utc),
        capabilities=CAPABILITIES,
        notice="Local historical CSV import is available. This module does not provide live prices, investment signals, model results, or trading functionality.",
    )


@router.get("/market-data/status")
def market_data_status():
    """Return configuration state only; this endpoint never contacts Groww."""
    return GrowwMarketDataAdapter().status().to_dict()


class DatasetSummary(BaseModel):
    dataset_id: str
    source: str
    original_filename: str
    retrieved_at: datetime
    content_sha256: str
    row_count: int
    instrument: str
    exchange: str
    frequency: str
    first_timestamp: str
    last_timestamp: str
    data_kind: Literal["historical"]
    feature_schema_version: str


@router.post("/datasets/import", response_model=DatasetSummary, status_code=status.HTTP_201_CREATED)
async def import_historical_csv(file: UploadFile = File(...), source: str = Form(...)):
    if not (file.filename or "").lower().endswith(".csv"):
        raise HTTPException(status_code=415, detail="only .csv historical datasets are supported")
    try:
        metadata = LocalDatasetStore().ingest(
            content=await file.read(), source=source, original_filename=file.filename or "dataset.csv"
        )
    except DatasetValidationError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    return metadata


@router.get("/datasets", response_model=list[DatasetSummary])
def list_historical_datasets():
    return LocalDatasetStore().list_datasets()


class BacktestRequest(BaseModel):
    dataset_id: str
    strategy: Literal["buy_and_hold", "sma_crossover", "momentum"]
    initial_cash: float = Field(default=100_000.0, gt=0)
    fee_bps: float = Field(default=10.0, ge=0)
    slippage_bps: float = Field(default=5.0, ge=0)
    max_participation_rate: float = Field(default=0.10, gt=0, le=1)
    fast_window: int = Field(default=5, ge=2)
    slow_window: int = Field(default=20, ge=3)
    momentum_window: int = Field(default=20, ge=1)
    evaluation_start: Optional[str] = None


@router.post("/backtests")
def run_historical_backtest(request: BacktestRequest):
    """Run a reproducible historical backtest; results are not investment advice."""
    try:
        bars = LocalDatasetStore().load_clean_bars(request.dataset_id)
        config = BacktestConfig(**request.model_dump(exclude={"dataset_id"}))
        result = run_backtest_comparison(bars, config)
    except (DatasetValidationError, BacktestValidationError) as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    return {
        "dataset_id": request.dataset_id,
        "data_kind": "historical",
        "notice": "Historical simulation only. It does not predict returns or guarantee future performance.",
        **result,
    }
