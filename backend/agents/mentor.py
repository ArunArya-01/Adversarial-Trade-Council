"""
agents/mentor.py — TradeMind AI Mentor & Devil's Advocate
==========================================================
Two LangChain/Gemini-powered agents that evaluate trades in real-time:

  evaluate_trade()   — Patient mentor grading the trade A-F with XAI reasoning
  devils_advocate()  — Adversarial risk officer surfacing worst-case scenarios

Both functions fail gracefully with deterministic mock responses when
GEMINI_API_KEY is not configured, so the API works immediately out of the box.
"""
from __future__ import annotations

import json
import os
import random
from typing import List, Literal

from pydantic import BaseModel


# ── Response Models ───────────────────────────────────────────────────────────

class MentorFeedback(BaseModel):
    grade: Literal["A", "B", "C", "D", "F"]
    what_went_right: str
    what_went_wrong: str
    lesson_tip: str
    risk_reward_comment: str


class AdversarialWarning(BaseModel):
    risk_level: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    warnings: List[str]
    alternative_strategy: str
    worst_case_scenario: str


# ── System Prompts ────────────────────────────────────────────────────────────

_MENTOR_SYSTEM = """You are TradeMind's patient and encouraging trading mentor.
A beginner student just executed a trade. Your job is to evaluate it educationally.
Be constructive, specific, and reference real trading principles.
Output strict JSON with exactly these fields:
{
  "grade": "A" | "B" | "C" | "D" | "F",
  "what_went_right": "<1-2 sentences — what the student did well>",
  "what_went_wrong": "<1-2 sentences — what could be improved, or 'Nothing — solid trade!' if grade is A>",
  "lesson_tip": "<1 actionable tip linking to a trading concept (R:R, position sizing, etc.)>",
  "risk_reward_comment": "<brief comment on the implied risk:reward of this trade>"
}
Grade rubric: A=excellent setup, B=good with minor issues, C=mediocre risk management,
D=significant flaws, F=dangerous position sizing or no stop-loss logic evident."""

_DEVIL_SYSTEM = """You are TradeMind's cynical Devil's Advocate — a seasoned risk officer.
A beginner just made a trade. Your job is to find every possible reason this trade could fail.
Be specific, educational, but brutally honest. Do NOT sugarcoat.
Output strict JSON with exactly these fields:
{
  "risk_level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "warnings": ["<warning 1>", "<warning 2>", "<warning 3>"],
  "alternative_strategy": "<one alternative approach the trader should have considered>",
  "worst_case_scenario": "<the single most likely way this trade catastrophically fails>"
}"""


# ── LLM Helper ────────────────────────────────────────────────────────────────

async def _call_gemini(system: str, user_msg: str) -> dict:
    """Calls Gemini via LangChain. Falls back to mock on error or missing key."""
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key or api_key == "your_gemini_api_key_here":
        return {}  # signal to use mock

    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
        from langchain_core.messages import SystemMessage, HumanMessage

        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=api_key,
            temperature=0.5,
            max_output_tokens=512,
        )
        response = await llm.ainvoke([
            SystemMessage(content=system),
            HumanMessage(content=user_msg),
        ])
        content = response.content.strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        return json.loads(content)
    except Exception as exc:
        print(f"[Mentor] LLM call failed: {exc} — using mock.")
        return {}


# ── Mock Fallbacks ────────────────────────────────────────────────────────────

def _mock_mentor(trade: dict) -> dict:
    action = trade.get("action", "BUY")
    pnl = trade.get("realised_pnl")

    if pnl is not None:
        grade = "A" if pnl > 0 else ("C" if pnl > -500 else "D")
    else:
        # Evaluate the BUY quality heuristically
        grade = random.choice(["A", "B", "B", "C"])

    tips = [
        "Always set your stop-loss before entering a trade, not after.",
        "Check your Risk:Reward ratio — aim for at least 2:1 before entering.",
        "Never risk more than 1-2% of your account on a single trade.",
        "Confirm your entry with at least two independent signals.",
        "Volume should confirm price moves — low-volume breakouts often fail.",
    ]

    return {
        "grade": grade,
        "what_went_right": (
            f"[MOCK — add GEMINI_API_KEY for real AI feedback] "
            f"You executed a {action} trade with a defined entry price. "
            f"Having a clear entry is the first step of a disciplined trade."
        ),
        "what_went_wrong": (
            "Without a live AI review, we can't assess your stop-loss placement "
            "or position sizing. Make sure both are defined before every trade."
        ),
        "lesson_tip": random.choice(tips),
        "risk_reward_comment": (
            f"Ensure your take-profit target is at least 2× your stop-loss distance "
            f"from entry. This gives you a 2:1 R:R minimum."
        ),
    }


def _mock_devil(trade: dict) -> dict:
    action = trade.get("action", "BUY")
    symbol = trade.get("symbol", "this stock")

    warnings_buy = [
        f"You are buying {symbol} without confirming the broader market trend direction.",
        "There is no evidence of a defined stop-loss — a single bad news event could wipe this position.",
        "Position sizing is unverified — ensure this trade does not exceed 2% of your account risk.",
    ]
    warnings_sell = [
        f"Selling {symbol} here may be premature if the trend is still intact.",
        "Check whether you are selling due to a signal or due to fear — emotional exits destroy P&L.",
        "Confirm that capital from this sale is deployed into a better opportunity, not left idle.",
    ]

    return {
        "risk_level": random.choice(["LOW", "MEDIUM", "MEDIUM", "HIGH"]),
        "warnings": warnings_buy if action == "BUY" else warnings_sell,
        "alternative_strategy": (
            f"[MOCK] Consider a scaled entry — buy 50% now and add the remaining "
            f"50% only if price confirms with a close above the key resistance level."
        ),
        "worst_case_scenario": (
            f"[MOCK] A macro shock (unexpected Fed rate decision or earnings miss) "
            f"gaps {symbol} down 10% overnight, triggering your stop-loss at the open "
            f"with significant negative slippage beyond your planned risk."
        ),
    }


# ── Public API ────────────────────────────────────────────────────────────────

async def evaluate_trade(trade: dict) -> MentorFeedback:
    """
    Evaluates a trade and returns structured mentor feedback.

    Parameters
    ----------
    trade : dict
        Must include: symbol, action, qty, price, and optionally realised_pnl,
        avg_cost, market_context.
    """
    pnl_val = trade.get("realised_pnl")
    pnl_str = f"${pnl_val:,.2f}" if pnl_val is not None else "N/A (open position)"
    user_msg = (
        f"Trade details:\n"
        f"  Symbol: {trade.get('symbol')}\n"
        f"  Action: {trade.get('action')}\n"
        f"  Quantity: {trade.get('qty')} shares\n"
        f"  Price: ${trade.get('price', 0):,.2f}\n"
        f"  Total value: ${trade.get('total_value', trade.get('total_proceeds', 0)):,.2f}\n"
        f"  Realised P&L: {pnl_str}\n"
        f"  Market context: {trade.get('market_context', 'None provided')}\n"
        "Please evaluate this trade for the student."
    )

    raw = await _call_gemini(_MENTOR_SYSTEM, user_msg)
    if not raw:
        raw = _mock_mentor(trade)

    return MentorFeedback(
        grade=raw.get("grade", "C"),
        what_went_right=raw.get("what_went_right", ""),
        what_went_wrong=raw.get("what_went_wrong", ""),
        lesson_tip=raw.get("lesson_tip", ""),
        risk_reward_comment=raw.get("risk_reward_comment", ""),
    )


async def devils_advocate(trade: dict) -> AdversarialWarning:
    """
    Generates adversarial risk warnings for the given trade.
    Always surfaces the bear case, regardless of trade quality.
    """
    user_msg = (
        f"A beginner just made this trade:\n"
        f"  Symbol: {trade.get('symbol')}\n"
        f"  Action: {trade.get('action')}\n"
        f"  Quantity: {trade.get('qty')} shares at ${trade.get('price', 0):,.2f}\n"
        f"  Market context: {trade.get('market_context', 'None provided')}\n"
        "Find every reason this could fail."
    )

    raw = await _call_gemini(_DEVIL_SYSTEM, user_msg)
    if not raw:
        raw = _mock_devil(trade)

    return AdversarialWarning(
        risk_level=raw.get("risk_level", "MEDIUM"),
        warnings=raw.get("warnings", []),
        alternative_strategy=raw.get("alternative_strategy", ""),
        worst_case_scenario=raw.get("worst_case_scenario", ""),
    )
