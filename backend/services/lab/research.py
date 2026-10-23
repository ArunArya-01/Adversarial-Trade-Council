"""Evidence-bound research reports for the AI Investment Lab.

Generated language is deliberately optional.  Facts, calculations, and source
records are assembled by application code first and are never replaced by an
LLM response.  This module has no tools for orders or risk-control changes.
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any, Protocol


class ResearchError(ValueError):
    pass


class Narrator(Protocol):
    def narrate(self, evidence: dict[str, Any], question: str | None) -> dict[str, str]: ...


class DisabledNarrator:
    """Safe default: the report remains useful without sending data externally."""

    def narrate(self, evidence: dict[str, Any], question: str | None) -> dict[str, str]:
        return {
            "status": "unavailable",
            "message": "Optional AI narration is disabled. This evidence-bound report contains no generated investment recommendation.",
        }


class GeminiNarrator:
    """Optional server-side narrator that cannot alter the verified report."""

    def __init__(self, api_key: str, model_name: str = "gemini-1.5-flash"):
        self.api_key = api_key
        self.model_name = model_name

    def narrate(self, evidence: dict[str, Any], question: str | None) -> dict[str, str]:
        try:
            import google.generativeai as genai

            genai.configure(api_key=self.api_key)
            prompt = (
                "Return exactly one of these labels: data_insufficient, simulation_only, uncertainty_high. "
                "Choose only from supplied evidence; do not write a sentence, quote prices, metrics, predictions, "
                "or buy/sell advice. Evidence: " + repr(evidence) + " Question: " + (question or "summarize")
            )
            label = (genai.GenerativeModel(self.model_name).generate_content(prompt).text or "").strip()
            messages = {
                "data_insufficient": "The provided records are insufficient for a broader research conclusion.",
                "simulation_only": "The available evidence is simulated and must not be treated as live-market evidence.",
                "uncertainty_high": "The available evidence has material uncertainty and does not support a decision.",
            }
            if label not in messages:
                raise RuntimeError("model response was outside the approved narration vocabulary")
            return {"status": "generated", "classification": label, "message": messages[label]}
        except Exception:
            # A model failure never removes or changes the evidence payload.
            return {"status": "unavailable", "message": "AI narration failed; the verified evidence is still available below."}


def configured_narrator() -> Narrator:
    if os.getenv("RESEARCH_ASSISTANT_ENABLED", "false").lower() != "true":
        return DisabledNarrator()
    api_key = os.getenv("GEMINI_API_KEY", "")
    return GeminiNarrator(api_key) if api_key else DisabledNarrator()


def build_report(portfolio: dict[str, Any], dataset: dict[str, Any] | None, candidate_symbol: str | None, question: str | None, narrator: Narrator | None = None) -> dict[str, Any]:
    """Build a report separated into source facts, derived metrics and commentary."""
    if not portfolio.get("simulation"):
        raise ResearchError("research reports require a verified simulated portfolio record")
    summary = portfolio["portfolio"]
    positions = portfolio.get("positions", [])
    trades = portfolio.get("trades", [])
    latest_timestamp = portfolio.get("equity_curve", [{}])[-1].get("timestamp") if portfolio.get("equity_curve") else None
    sources = [
        {"record_type": "paper_portfolio", "id": summary["id"], "data_kind": "simulated", "as_of": latest_timestamp},
        *[{"record_type": "paper_trade", "id": trade["id"], "source": trade["source"], "data_kind": trade["data_kind"], "observed_at": trade["observed_at"]} for trade in trades],
    ]
    if dataset:
        sources.append({"record_type": "historical_dataset", "id": dataset["dataset_id"], "source": dataset["source"], "data_kind": "historical", "as_of": dataset["last_timestamp"], "content_sha256": dataset["content_sha256"]})
    return_pct = summary["equity"] / summary["starting_capital"] - 1
    candidate = candidate_symbol.strip().upper() if candidate_symbol else None
    matching_position = next((p for p in positions if p["symbol"].upper() == candidate), None) if candidate else None
    candidate_assessment = None
    if candidate:
        candidate_assessment = {
            "symbol": candidate,
            "status": "observed_in_portfolio" if matching_position else "not_evaluable",
            "reason": "A simulated position record exists; this is not a recommendation." if matching_position else "No verified position or analysis record was supplied for this candidate.",
        }
    evidence = {
        "observed_facts": {
            "portfolio_name": summary["name"], "simulation": True, "cash": summary["cash"], "positions": [{"symbol": p["symbol"], "quantity": p["quantity"], "observed_at": p["observed_at"], "source": p["source"], "data_kind": p["data_kind"]} for p in positions],
            "trade_count": len(trades), "candidate_assessment": candidate_assessment,
        },
        "calculated_metrics": {"equity": summary["equity"], "portfolio_return": return_pct, "realized_pnl": summary["realized_pnl"], "unrealized_pnl": summary["unrealized_pnl"], "drawdown": summary["drawdown"]},
        "model_estimates": [],
        "source_records": sources,
        "assumptions_and_limits": [
            "All portfolio fills are simulated; no broker order was placed.",
            "The report has no verified live market quote, fundamental dataset, or active model prediction.",
            "Historical or simulated observations may not represent current market conditions.",
            "Portfolio performance is not a guarantee of future returns.",
        ],
        "data_freshness": {"as_of": latest_timestamp, "status": "historical_or_simulated_only", "live_market_data": "unavailable"},
    }
    narration = (narrator or configured_narrator()).narrate(evidence, question)
    return {"report_type": "evidence_bound_research", "created_at": datetime.now(timezone.utc).isoformat(), "question": question, "verified_evidence": evidence, "ai_narration": narration, "safety": {"can_submit_orders": False, "can_bypass_risk_controls": False, "investment_advice": False}}
