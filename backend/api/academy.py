"""Canonical API surface for the Trading Academy module.

Legacy /api/learn, /api/practice and /api/news routes remain mounted in main.py
so existing clients can migrate without a breaking release.
"""

from fastapi import APIRouter

from api.learn import QuizSubmission, get_all_chapters, get_chapter, submit_quiz
from api.news import get_live_news
from api.practice import get_candles

router = APIRouter(prefix="/academy", tags=["Trading Academy"])


@router.get("/chapters")
def list_chapters():
    return get_all_chapters()


@router.get("/chapters/{chapter_id}")
def read_chapter(chapter_id: str):
    return get_chapter(chapter_id)


@router.post("/quizzes/submit")
def grade_quiz(submission: QuizSubmission):
    return submit_quiz(submission)


@router.get("/practice/candles")
def practice_candles(symbol: str, timeframe: str = "1D"):
    """Return deterministic, explicitly simulated practice candles."""
    return get_candles(symbol=symbol, timeframe=timeframe)


@router.get("/news")
async def academy_news(category: str = "all"):
    return await get_live_news(category=category)
