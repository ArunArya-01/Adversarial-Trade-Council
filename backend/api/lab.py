"""Honest availability API for the AI Investment Lab's first UI release.

No market-data provider, strategy result, model, or portfolio is fabricated here.
Those services arrive only after their respective validated implementation phases.
"""

from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel

from services.lab.data_pipeline import DatasetValidationError, LocalDatasetStore

router = APIRouter(prefix="/lab", tags=["AI Investment Lab"])


class CapabilityStatus(BaseModel):
    id: str
    label: str
    status: Literal["planned", "unavailable"]
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
    CapabilityStatus(id="strategies", label="Strategy Lab", status="planned", message="Strategies and backtests have not been implemented."),
    CapabilityStatus(id="backtesting", label="Backtesting", status="planned", message="No performance results are available until reproducible backtesting is implemented."),
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
