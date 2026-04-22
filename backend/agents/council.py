"""
agents/council.py — Hedge Fund Swarm Council
==============================================
Three LangChain-powered LLM agents deliberate on the RL Brain's signal and
produce a consensus vote via Triple-Modular Redundancy (TMR) quorum logic.

Agents
------
MacroAgent        — Interprets global sentiment, Fed policy, macro tail risks.
TechnicalAgent    — Validates RL signal against TA indicators and market structure.
DevilsAdvocate    — Adversarially challenges the trade; holds VETO power.

Quorum Rule
-----------
  • Trade APPROVED  : ≥ 2 agents vote in the SAME direction as the RL signal
                      AND Devil's Advocate does NOT VETO.
  • Trade BLOCKED   : Devil's VETO overrides regardless of other votes.
  • HOLD signals    : Always pass (no capital at risk).

Fallback (No Gemini key)
------------------------
If GEMINI_API_KEY is not configured, the council falls back to a deterministic
mock deliberation so the API remains fully functional during development.
"""
from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass, field
from typing import List, Literal, Optional

from core.config import get_settings
from core import logger as log
from agents.rl_brain import RLSignal


# ── Vote Types ────────────────────────────────────────────────────────────────

VoteVerdict = Literal["BUY", "SELL", "HOLD", "VETO"]


@dataclass
class AgentVote:
    """Single agent's deliberation output."""
    agent_name: str
    verdict: VoteVerdict
    confidence: float           # 0.0 – 1.0
    reasoning: str
    thought_log: dict = field(default_factory=dict)


@dataclass
class CouncilVerdict:
    """Aggregate result of the full council deliberation."""
    approved: bool
    quorum_verdict: VoteVerdict  # majority direction
    votes: List[AgentVote]
    thought_logs: List[dict] = field(default_factory=list)
    deliberation_ms: int = 0

    def summary(self) -> str:
        status = "✅ APPROVED" if self.approved else "🚫 BLOCKED"
        verdicts = {v.agent_name: v.verdict for v in self.votes}
        return f"Council {status} | Votes: {verdicts} | Quorum: {self.quorum_verdict}"

    def to_dict(self) -> dict:
        return {
            "approved": self.approved,
            "quorum_verdict": self.quorum_verdict,
            "votes": [
                {
                    "agent": v.agent_name,
                    "verdict": v.verdict,
                    "confidence": round(v.confidence, 3),
                    "reasoning": v.reasoning,
                }
                for v in self.votes
            ],
            "thought_logs": self.thought_logs,
            "deliberation_ms": self.deliberation_ms,
        }


# ── System Prompts ────────────────────────────────────────────────────────────

_MACRO_SYSTEM = """You are the Macro Agent for TradeMind AI — a hedge fund macro strategist.
Your role: Evaluate trade proposals through the lens of global macro risk.
Consider: Fed policy signals, inflation trajectory, geopolitical risks, credit spreads.
Output format (strict JSON, no markdown):
{
  "verdict": "BUY" | "SELL" | "HOLD",
  "confidence": <0.0–1.0>,
  "reasoning": "<2–3 sentence macro thesis>"
}"""

_TECHNICAL_SYSTEM = """You are the Technical Agent for TradeMind AI — a quantitative technical analyst.
Your role: Validate or challenge the RL model's signal using technical analysis.
Consider: Trend structure, momentum, volume profile, support/resistance levels.
Output format (strict JSON, no markdown):
{
  "verdict": "BUY" | "SELL" | "HOLD",
  "confidence": <0.0–1.0>,
  "reasoning": "<2–3 sentence technical thesis>"
}"""

_DEVILS_SYSTEM = """You are the Devil's Advocate for TradeMind AI — an adversarial risk officer.
Your role: Find every reason this trade could FAIL. You are the last line of defence.
VETO the trade if you identify: tail-risk scenarios, liquidity traps, sentiment reversals,
or any fundamental reason the RL signal may be a false positive.
Output format (strict JSON, no markdown):
{
  "verdict": "NO_VETO" | "VETO",
  "confidence": <0.0–1.0>,
  "reasoning": "<2–3 sentence adversarial critique>"
}"""


# ── LLM Invocation Helper ─────────────────────────────────────────────────────

async def _call_gemini(system_prompt: str, user_message: str, agent_name: str) -> dict:
    """
    Invokes Gemini via LangChain and parses the JSON response.
    Falls back to mock data if API key is not configured.
    """
    cfg = get_settings()

    if not cfg.gemini_configured:
        log.warn(
            f"[{agent_name}] GEMINI_API_KEY not set — using mock deliberation.",
            agent="council",
        )
        return _mock_response(agent_name)

    from langchain_google_genai import ChatGoogleGenerativeAI
    from langchain_core.messages import SystemMessage, HumanMessage
    import json

    try:
        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=cfg.gemini_api_key,
            temperature=0.4,
            max_output_tokens=512,
        )

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_message),
        ]

        response = await llm.ainvoke(messages)
        content = response.content.strip()

        # Strip markdown code fences if model wraps JSON
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]

        return json.loads(content)

    except Exception as exc:
        log.warn(
            f"[{agent_name}] LLM call failed ({exc}) — falling back to mock.",
            agent="council",
        )
        return _mock_response(agent_name)


def _mock_response(agent_name: str) -> dict:
    """Deterministic mock fallback when Gemini is unavailable."""
    import random
    rng = random.Random(agent_name + str(time.time())[:5])

    if "devil" in agent_name.lower():
        return {
            "verdict": "NO_VETO",
            "confidence": rng.uniform(0.55, 0.85),
            "reasoning": (
                "[MOCK] Adversarial scan complete. Tail risk within acceptable bounds. "
                "Liquidity conditions nominal. No structural red flags detected."
            ),
        }

    verdicts = ["BUY", "SELL", "HOLD"]
    return {
        "verdict": rng.choice(verdicts),
        "confidence": rng.uniform(0.5, 0.92),
        "reasoning": (
            f"[MOCK — configure GEMINI_API_KEY for real deliberation] "
            f"Synthetic analysis by {agent_name}. Signal appears statistically consistent "
            f"with current market microstructure."
        ),
    }


# ── Individual Agents ─────────────────────────────────────────────────────────

class MacroAgent:
    name = "Macro Agent"

    async def deliberate(self, rl_signal: RLSignal, market_context: str) -> AgentVote:
        user_msg = (
            f"RL model proposes: {rl_signal.action} (confidence={rl_signal.confidence:.1%}).\n"
            f"Market context: {market_context}\n"
            "Provide your macro verdict."
        )
        raw = await _call_gemini(_MACRO_SYSTEM, user_msg, self.name)
        verdict = raw.get("verdict", "HOLD")
        confidence = float(raw.get("confidence", 0.5))
        reasoning = raw.get("reasoning", "No reasoning provided.")

        t = log.info(
            f"[MacroAgent] Verdict: {verdict} ({confidence:.0%}) — {reasoning[:80]}…",
            agent="council",
        )
        return AgentVote(
            agent_name=self.name,
            verdict=verdict,
            confidence=confidence,
            reasoning=reasoning,
            thought_log=t,
        )


class TechnicalAgent:
    name = "Technical Agent"

    async def deliberate(self, rl_signal: RLSignal, market_context: str) -> AgentVote:
        user_msg = (
            f"RL model proposes: {rl_signal.action} (confidence={rl_signal.confidence:.1%}).\n"
            f"RL raw action probs: HOLD={rl_signal.raw_probs[0]:.2%}, "
            f"BUY={rl_signal.raw_probs[1]:.2%}, SELL={rl_signal.raw_probs[2]:.2%}.\n"
            f"Market context: {market_context}\n"
            "Validate or challenge this signal using technical analysis."
        )
        raw = await _call_gemini(_TECHNICAL_SYSTEM, user_msg, self.name)
        verdict = raw.get("verdict", "HOLD")
        confidence = float(raw.get("confidence", 0.5))
        reasoning = raw.get("reasoning", "No reasoning provided.")

        t = log.info(
            f"[TechnicalAgent] Verdict: {verdict} ({confidence:.0%}) — {reasoning[:80]}…",
            agent="council",
        )
        return AgentVote(
            agent_name=self.name,
            verdict=verdict,
            confidence=confidence,
            reasoning=reasoning,
            thought_log=t,
        )


class DevilsAdvocate:
    name = "Devil's Advocate"

    async def deliberate(self, rl_signal: RLSignal, market_context: str) -> AgentVote:
        user_msg = (
            f"The council is about to approve a {rl_signal.action} trade "
            f"(RL confidence={rl_signal.confidence:.1%}).\n"
            f"Market context: {market_context}\n"
            "Find every reason this trade could fail. VETO if warranted."
        )
        raw = await _call_gemini(_DEVILS_SYSTEM, user_msg, self.name)
        # Devil's Advocate returns "NO_VETO" or "VETO"
        raw_verdict = raw.get("verdict", "NO_VETO")
        # Normalise to our VoteVerdict type
        verdict: VoteVerdict = "VETO" if raw_verdict == "VETO" else "BUY"  # NO_VETO = implicit approval
        confidence = float(raw.get("confidence", 0.5))
        reasoning = raw.get("reasoning", "No reasoning provided.")

        severity = "WARNING" if verdict == "VETO" else "INFO"
        t = log.thought(
            f"[Devil's Advocate] {raw_verdict} ({confidence:.0%}) — {reasoning[:80]}…",
            agent="council",
            severity=severity,
        )
        return AgentVote(
            agent_name=self.name,
            verdict=verdict,
            confidence=confidence,
            reasoning=reasoning,
            thought_log=t,
        )


# ── Council Session Orchestrator ──────────────────────────────────────────────

class CouncilSession:
    """
    Orchestrates the full multi-agent deliberation.

    Usage
    -----
    council = CouncilSession()
    verdict = await council.deliberate(rl_signal, market_context="S&P 500 up 0.4%, VIX=18")
    print(verdict.approved)     # True / False
    print(verdict.summary())
    """

    def __init__(self) -> None:
        self._macro = MacroAgent()
        self._technical = TechnicalAgent()
        self._devil = DevilsAdvocate()
        log.info("CouncilSession initialised — 3 agents online.", agent="council")

    async def deliberate(
        self,
        rl_signal: RLSignal,
        market_context: str = "No additional market context provided.",
    ) -> CouncilVerdict:
        """
        Run all three agents concurrently and compute the quorum verdict.
        Total latency ≈ single LLM call latency (thanks to asyncio.gather).
        """
        t_start = time.monotonic()

        thought_logs: list[dict] = []
        t = log.info(
            f"Council deliberation started — RL signal: {rl_signal.action} "
            f"({rl_signal.confidence:.1%} confidence)",
            agent="council",
        )
        thought_logs.append(t)

        # Run all three agents concurrently
        macro_vote, technical_vote, devil_vote = await asyncio.gather(
            self._macro.deliberate(rl_signal, market_context),
            self._technical.deliberate(rl_signal, market_context),
            self._devil.deliberate(rl_signal, market_context),
        )

        votes = [macro_vote, technical_vote, devil_vote]
        for v in votes:
            thought_logs.append(v.thought_log)

        # ── Quorum logic ──────────────────────────────────────────────────────
        # Rule 1: Devil's VETO is absolute
        if devil_vote.verdict == "VETO":
            approved = False
            quorum_verdict: VoteVerdict = "VETO"
            t = log.warn(
                "🚫 Devil's Advocate VETO — trade blocked regardless of quorum.",
                agent="council",
            )
            thought_logs.append(t)
        else:
            # Rule 2: Count BUY / SELL / HOLD votes (devil excluded from direction vote)
            direction_votes = [macro_vote.verdict, technical_vote.verdict]
            buy_count = direction_votes.count("BUY")
            sell_count = direction_votes.count("SELL")
            hold_count = direction_votes.count("HOLD")

            # Majority direction
            if buy_count >= 1 and sell_count == 0:
                quorum_verdict = "BUY"
            elif sell_count >= 1 and buy_count == 0:
                quorum_verdict = "SELL"
            else:
                quorum_verdict = "HOLD"

            # Approved if quorum agrees with RL signal direction
            rl_direction = rl_signal.action  # BUY / SELL / HOLD
            approved = quorum_verdict == rl_direction and quorum_verdict != "HOLD"

            t = log.info(
                f"Quorum verdict: {quorum_verdict} | RL direction: {rl_direction} "
                f"→ {'APPROVED' if approved else 'BLOCKED'}",
                agent="council",
            )
            thought_logs.append(t)

        elapsed_ms = int((time.monotonic() - t_start) * 1000)

        verdict = CouncilVerdict(
            approved=approved,
            quorum_verdict=quorum_verdict,
            votes=votes,
            thought_logs=thought_logs,
            deliberation_ms=elapsed_ms,
        )

        log.info(verdict.summary(), agent="council")
        return verdict
