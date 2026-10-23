"""Honest availability API for the AI Investment Lab's first UI release.

No market-data provider, strategy result, model, or portfolio is fabricated here.
Those services arrive only after their respective validated implementation phases.
"""

from datetime import datetime, timezone
from typing import Literal, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database.db import get_db
from services.lab.backtesting import BacktestConfig, BacktestValidationError, run_backtest_comparison
from services.lab.data_pipeline import DatasetValidationError, LocalDatasetStore
from services.lab.market_data import GrowwMarketDataAdapter
from services.lab.paper_trading import PaperTradeSignal, PaperTradingError, create_portfolio, execute_signal, portfolio_report
from services.lab.research import ResearchError, build_report
from services.lab.watchlists import WatchlistError, add_item, create as create_watchlist, list_all

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
    CapabilityStatus(id="watchlists", label="Watchlists", status="available", message="Persistent research watchlists organize symbols and notes without inventing live prices or signals."),
    CapabilityStatus(id="market-data", label="Market Data", status="planned", message="Local historical CSV imports are supported; no approved provider or live feed is connected."),
    CapabilityStatus(id="strategies", label="Strategy Lab", status="available", message="Transparent buy-and-hold, moving-average crossover, and momentum baselines are available through the historical backtest API."),
    CapabilityStatus(id="backtesting", label="Backtesting", status="available", message="Historical backtests apply documented fees, slippage, next-bar execution, and volume participation limits."),
    CapabilityStatus(id="ml", label="ML Experiments", status="planned", message="Training is reserved for the Colab research phase."),
    CapabilityStatus(id="paper-trading", label="Paper Trading", status="available", message="Separate auditable virtual portfolios support historical or simulated data only; no broker orders are sent."),
    CapabilityStatus(id="risk", label="Risk Analytics", status="available", message="Paper portfolios enforce cash, exposure, concentration, duplicate-signal, and maximum-drawdown safeguards."),
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


class WatchlistRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)


class WatchlistItemRequest(BaseModel):
    symbol: str = Field(min_length=1, max_length=40)
    exchange: str = Field(min_length=1, max_length=20)
    note: Optional[str] = Field(default=None, max_length=500)


@router.get("/watchlists")
def get_watchlists(db: Session = Depends(get_db)):
    return list_all(db)


@router.post("/watchlists", status_code=status.HTTP_201_CREATED)
def post_watchlist(request: WatchlistRequest, db: Session = Depends(get_db)):
    try:
        return create_watchlist(db, request.name)
    except WatchlistError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


@router.post("/watchlists/{watchlist_id}/items", status_code=status.HTTP_201_CREATED)
def post_watchlist_item(watchlist_id: str, request: WatchlistItemRequest, db: Session = Depends(get_db)):
    try:
        return add_item(db, watchlist_id, request.symbol, request.exchange, request.note)
    except WatchlistError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


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


class PaperPortfolioRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    starting_capital: float = Field(gt=0)
    benchmark_symbol: Optional[str] = Field(default=None, max_length=40)
    fee_bps: float = Field(default=10, ge=0)
    slippage_bps: float = Field(default=5, ge=0)
    max_position_fraction: float = Field(default=0.25, gt=0, le=1)
    max_total_exposure_fraction: float = Field(default=0.80, gt=0, le=1)
    max_drawdown_fraction: float = Field(default=0.20, gt=0, lt=1)


class PaperSignalRequest(BaseModel):
    signal_id: str = Field(min_length=1, max_length=120)
    side: Literal["BUY", "SELL"]
    symbol: str = Field(min_length=1, max_length=40)
    quantity: int = Field(gt=0)
    observed_price: float = Field(gt=0)
    observed_at: datetime
    source: str = Field(min_length=1, max_length=160)
    data_kind: Literal["historical", "simulated"]
    strategy_version: str = Field(min_length=1, max_length=120)
    model_version: Optional[str] = Field(default=None, max_length=120)
    benchmark_price: Optional[float] = Field(default=None, gt=0)


class ResearchReportRequest(BaseModel):
    portfolio_id: str
    dataset_id: Optional[str] = None
    candidate_symbol: Optional[str] = Field(default=None, max_length=40)
    question: Optional[str] = Field(default=None, max_length=500)


def _paper_error(error: PaperTradingError) -> HTTPException:
    return HTTPException(status_code=422, detail=str(error))


@router.post("/paper-portfolios", status_code=status.HTTP_201_CREATED)
def create_paper_portfolio(request: PaperPortfolioRequest, db: Session = Depends(get_db)):
    """Create a virtual Lab portfolio. This is not a brokerage account."""
    try:
        portfolio = create_portfolio(db, **request.model_dump())
        return portfolio_report(db, portfolio.id)
    except PaperTradingError as error:
        raise _paper_error(error) from error


@router.get("/paper-portfolios/{portfolio_id}")
def get_paper_portfolio(portfolio_id: str, db: Session = Depends(get_db)):
    try:
        return portfolio_report(db, portfolio_id)
    except PaperTradingError as error:
        raise _paper_error(error) from error


@router.get("/paper-portfolios/{portfolio_id}/trades.csv")
def export_paper_trades(portfolio_id: str, db: Session = Depends(get_db)):
    import csv
    import io
    from fastapi.responses import StreamingResponse

    try:
        report = portfolio_report(db, portfolio_id)
    except PaperTradingError as error:
        raise _paper_error(error) from error
    output = io.StringIO()
    rows = report["trades"]
    fieldnames = list(rows[0].keys()) if rows else ["id", "signal_id", "side", "symbol", "quantity", "observed_price", "execution_price", "fee", "realized_pnl", "source", "data_kind", "strategy_version", "model_version", "observed_at"]
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": f'attachment; filename="paper-trades-{portfolio_id}.csv"'})


@router.post("/paper-portfolios/{portfolio_id}/signals", status_code=status.HTTP_201_CREATED)
def apply_paper_signal(portfolio_id: str, request: PaperSignalRequest, db: Session = Depends(get_db)):
    """Execute a simulated trade against supplied historical/simulated observation data."""
    try:
        trade = execute_signal(db, portfolio_id, PaperTradeSignal(**request.model_dump()))
        return {"simulation": True, "notice": "Simulated fill only; no broker order was placed.", "trade_id": trade.id, "portfolio": portfolio_report(db, portfolio_id)}
    except PaperTradingError as error:
        raise _paper_error(error) from error


@router.post("/research/reports")
def create_research_report(request: ResearchReportRequest, db: Session = Depends(get_db)):
    """Explain only verified Lab records; never produces an order or a signal."""
    try:
        portfolio = portfolio_report(db, request.portfolio_id)
        dataset = LocalDatasetStore().get_metadata(request.dataset_id) if request.dataset_id else None
        return build_report(portfolio, dataset, request.candidate_symbol, request.question)
    except (PaperTradingError, ResearchError, DatasetValidationError) as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
