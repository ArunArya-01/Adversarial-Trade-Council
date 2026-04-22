"""
agents/news_interpreter.py — TradeMind AI News Swarm
=====================================================
Fetches mock institutional financial headlines and uses LangChain/Gemini
to translate each one into plain English for beginner retail traders.

Phase 1: 5 hardcoded institutional-style headlines (mock, no API keys needed).
Phase 2: Replace `_MOCK_HEADLINES` with live RSS/financial API fetch.

Each output item contains:
  - headline     : the original institutional phrasing
  - source       : publication name
  - simplified   : beginner-friendly plain English explanation
  - sentiment    : BULLISH | BEARISH | NEUTRAL
  - beginner_tip : one concrete action a retail trader can take
  - category     : MACRO | EARNINGS | FED | SECTOR | CRYPTO
"""
from __future__ import annotations

import asyncio
import json
import os
import random


# ── Mock Institutional Headlines (Phase 1) ────────────────────────────────────

_MOCK_HEADLINES = [
    {
        "id": 1,
        "headline": "Fed Signals Hawkish Pause as Core PCE Remains Sticky Above 2.8% Target",
        "source": "Wall Street Journal",
        "category": "FED",
    },
    {
        "id": 2,
        "headline": "NVDA Reports Q3 Beat on Data Center Revenue; Gross Margin Guidance Disappoints",
        "source": "Bloomberg",
        "category": "EARNINGS",
    },
    {
        "id": 3,
        "headline": "Inverted Yield Curve Deepens as 2s10s Spread Widens to -45bps on Recession Fears",
        "source": "Reuters",
        "category": "MACRO",
    },
    {
        "id": 4,
        "headline": "Semiconductor Sector ETF (SOXX) Sees $2.1B Outflow as Geopolitical Tensions Escalate in Taiwan Strait",
        "source": "Financial Times",
        "category": "SECTOR",
    },
    {
        "id": 5,
        "headline": "BTC Spot ETF Sees Record $850M Single-Day Net Inflow; Futures Open Interest Hits All-Time High",
        "source": "CoinDesk",
        "category": "CRYPTO",
    },
]


# ── Fallback simplified content (used when Gemini is not configured) ──────────

_FALLBACKS = {
    1: {
        "simplified": (
            "The US central bank (the Federal Reserve) is keeping interest rates high "
            "because inflation is still above their 2% target. Think of it like the Fed "
            "refusing to turn off the financial brakes until the car (the economy) slows down enough."
        ),
        "sentiment": "BEARISH",
        "beginner_tip": (
            "High interest rates hurt growth stocks the most (tech companies). "
            "When rates stay high, consider reducing exposure to high-valuation growth stocks "
            "and look at dividend-paying value stocks, which tend to weather rate environments better."
        ),
    },
    2: {
        "simplified": (
            "NVIDIA made more money than analysts expected in its data center business "
            "(selling AI chips to companies like Microsoft and Google). However, their prediction "
            "for future profit margins was lower than hoped — meaning costs may be rising."
        ),
        "sentiment": "NEUTRAL",
        "beginner_tip": (
            "An earnings 'beat' on revenue but a 'miss' on margin guidance often causes "
            "volatile stock price swings. Wait for the dust to settle (1-2 trading days) "
            "before entering a position — let the market find its new fair value first."
        ),
    },
    3: {
        "simplified": (
            "A key economic warning signal is flashing. Normally, long-term bonds pay more "
            "interest than short-term ones. When this flips (inverted curve), it often "
            "means investors fear an economic slowdown or recession is coming."
        ),
        "sentiment": "BEARISH",
        "beginner_tip": (
            "An inverted yield curve has preceded every US recession since 1955. "
            "This doesn't mean sell everything, but consider building a cash position "
            "and favouring defensive sectors: utilities, healthcare, and consumer staples."
        ),
    },
    4: {
        "simplified": (
            "Large investors (institutions) pulled $2.1 billion out of semiconductor stocks "
            "because of rising tensions between China and Taiwan. Taiwan manufactures the "
            "world's most advanced chips — any conflict there would devastate the tech supply chain."
        ),
        "sentiment": "BEARISH",
        "beginner_tip": (
            "Geopolitical risk is notoriously hard to trade. Avoid making large bets on "
            "geopolitical outcomes — reduce position size in affected sectors and wait for "
            "clarity before adding exposure."
        ),
    },
    5: {
        "simplified": (
            "Investors poured a record $850 million into Bitcoin ETFs (funds that hold real Bitcoin) "
            "in a single day. This is significant because ETFs are bought by large institutional investors "
            "who previously couldn't hold Bitcoin easily — it signals mainstream adoption."
        ),
        "sentiment": "BULLISH",
        "beginner_tip": (
            "Large ETF inflows can be a bullish signal, but Bitcoin remains highly volatile. "
            "If you want exposure, limit crypto to a small portion of your portfolio (5-10% max) "
            "and use a defined stop-loss — crypto can drop 20% in a single day."
        ),
    },
}


# ── LLM Simplification ────────────────────────────────────────────────────────

_NEWS_SYSTEM = """You are TradeMind's News Interpreter — a financial translator for beginner investors.
You receive a professional financial headline and must explain it in plain English for a retail trader
with 0-6 months of experience. No jargon. No condescension. Be precise and practical.
Output strict JSON with exactly these fields:
{
  "simplified": "<2-3 sentences explaining what this headline means in plain English>",
  "sentiment": "BULLISH" | "BEARISH" | "NEUTRAL",
  "beginner_tip": "<1 concrete, actionable tip for how a retail trader should respond to this news>"
}"""


async def _simplify_headline(item: dict) -> dict:
    """Simplifies a single headline using LLM or falls back to hardcoded content."""
    api_key = os.getenv("GEMINI_API_KEY", "")

    if api_key and api_key != "your_gemini_api_key_here":
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            from langchain_core.messages import SystemMessage, HumanMessage

            llm = ChatGoogleGenerativeAI(
                model="gemini-1.5-flash",
                google_api_key=api_key,
                temperature=0.3,
                max_output_tokens=400,
            )
            user_msg = f'Headline: "{item["headline"]}"\nSource: {item["source"]}\nCategory: {item["category"]}'
            response = await llm.ainvoke([
                SystemMessage(content=_NEWS_SYSTEM),
                HumanMessage(content=user_msg),
            ])
            content = response.content.strip()
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            parsed = json.loads(content)
            return {**item, **parsed}
        except Exception as exc:
            print(f"[NewsInterpreter] LLM failed for id={item['id']}: {exc} — using fallback.")

    # Use hardcoded fallback
    fallback = _FALLBACKS.get(item["id"], {
        "simplified": "[Configure GEMINI_API_KEY for AI-powered news simplification.]",
        "sentiment": "NEUTRAL",
        "beginner_tip": "Read the original article carefully and cross-reference multiple sources before trading.",
    })
    return {**item, **fallback}


async def get_simplified_headlines() -> list[dict]:
    """
    Simplifies all mock headlines concurrently.
    Returns a list of dicts ready for the NewsItem Pydantic schema.
    """
    tasks = [_simplify_headline(h) for h in _MOCK_HEADLINES]
    results = await asyncio.gather(*tasks)
    return list(results)
