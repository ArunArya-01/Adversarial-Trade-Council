"""
api/news.py — TradeMind AI Agentic News Feed
=============================================
Route:
  GET /api/news — Returns AI-simplified financial headlines for beginners

Phase 1: Mock institutional headlines + LangChain/Gemini simplification.
Phase 2: Replace mock headlines with live RSS/API feed (Bloomberg, Reuters).
"""
from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

from agents.news_interpreter import get_simplified_headlines

router = APIRouter(prefix="/news", tags=["News Feed"])


class NewsItem(BaseModel):
    id: int
    headline: str
    source: str
    simplified: str
    sentiment: str        # BULLISH | BEARISH | NEUTRAL
    beginner_tip: str
    category: str         # MACRO | EARNINGS | FED | SECTOR | CRYPTO


@router.get("", response_model=List[NewsItem], summary="Get AI-simplified news feed")
async def get_news() -> List[NewsItem]:
    """
    Fetches institutional financial headlines and uses the AI News Swarm
    to translate them into plain English for beginner traders.

    Each item includes:
    - The original headline (as professionals see it)
    - A simplified explanation (what it actually means)
    - Sentiment classification (BULLISH / BEARISH / NEUTRAL)
    - A concrete beginner tip explaining how to act on this information
    """
    items = await get_simplified_headlines()
    return [NewsItem(**item) for item in items]
