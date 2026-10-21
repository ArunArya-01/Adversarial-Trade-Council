"""Honest availability API for the AI Investment Lab's first UI release.

No market-data provider, strategy result, model, or portfolio is fabricated here.
Those services arrive only after their respective validated implementation phases.
"""

from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/lab", tags=["AI Investment Lab"])


class CapabilityStatus(BaseModel):
    id: str
    label: str
    status: Literal["planned", "unavailable"]
    message: str


class LabStatus(BaseModel):
    module: Literal["ai-investment-lab"]
    data_source: Literal["unavailable"]
    as_of: datetime
    capabilities: list[CapabilityStatus]
    notice: str


CAPABILITIES = [
    CapabilityStatus(id="scanner", label="Stock Scanner", status="planned", message="Requires validated historical or live market data."),
    CapabilityStatus(id="watchlists", label="Watchlists", status="planned", message="Watchlist persistence is scheduled for a later phase."),
    CapabilityStatus(id="market-data", label="Market Data", status="unavailable", message="No approved historical or live provider is connected."),
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
        data_source="unavailable",
        as_of=datetime.now(timezone.utc),
        capabilities=CAPABILITIES,
        notice="Research infrastructure is planned. This module does not provide investment signals, market prices, or trading functionality.",
    )
