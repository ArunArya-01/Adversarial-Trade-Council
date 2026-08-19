from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

router = APIRouter(prefix="/practice", tags=["Practice"])

class EvaluationRequest(BaseModel):
    scenario_id: str
    answer: int
    context: Optional[str] = None

@router.get("/scenarios")
def get_scenarios(difficulty: str = "beginner"):
    return [
        {
            "id": "s1",
            "difficulty": "beginner",
            "market": "india",
            "title": "Infosys Earnings Beat & Guidance Upgrade",
            "context": "Infosys (INFY) announced Q2 results: Net profit up 24% YoY, revenue up 19%, and full-year guidance raised to 6.5-7%. Stock opens at ₹1,480.",
            "question": "How should you position on Infosys stock based on this report?",
            "chart": [1420, 1435, 1448, 1460, 1472, 1480],
            "options": [
                {"label": "BUY — Upgraded guidance forces institutional target upgrades and steady buying", "correct": True},
                {"label": "SELL — The good news is already factored into previous runs", "correct": False},
                {"label": "SHORT — Earnings beats are classic bull traps in IT stocks", "correct": False},
                {"label": "HOLD & IGNORE — Financial quarterly earnings have zero correlation to price", "correct": False}
            ],
            "explanation": "Guidance upgrades represent structural business acceleration. Institutional analysts revise price targets upward, driving sustained net institutional inflows.",
            "xp": 100,
            "reward": 800
        }
    ]

@router.post("/evaluate")
def evaluate_decision(req: EvaluationRequest):
    return {
        "status": "success",
        "scenario_id": req.scenario_id,
        "is_correct": req.answer == 0,
        "score": 100 if req.answer == 0 else 30,
        "feedback": "Correct decision locked in." if req.answer == 0 else "Review institutional dynamics."
    }
