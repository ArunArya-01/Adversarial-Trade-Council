"""
api/lessons.py — TradeMind AI Lesson Curriculum
================================================
Routes:
  GET  /api/lessons           — list all lessons (metadata only)
  GET  /api/lessons/{id}      — full lesson content + quiz
  POST /api/lessons/{id}/complete  — mark complete, record score, award XP
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database.db import get_db
from database.models import LessonProgress, User

router = APIRouter(prefix="/lessons", tags=["Curriculum"])


# ── Lesson Data ───────────────────────────────────────────────────────────────

LESSONS = [
    {
        "id": 1,
        "title": "What Is a Stock?",
        "module": 1,
        "module_name": "Market Fundamentals",
        "duration_min": 5,
        "xp_reward": 100,
        "tags": ["basics", "equities"],
        "content": """
## What Is a Stock?

When a company wants to raise money to grow — hire staff, build products, expand into new markets — it has two main options: borrow money (take on debt) or sell a piece of itself to the public. When it sells pieces of itself, each piece is called a **share**, and the collection of all shares is called **stock**.

### You Become a Part-Owner

When you buy one share of Apple (ticker: `AAPL`), you own a tiny fraction of Apple Inc. — its offices, patents, brand value, and future earnings. You are now a **shareholder**. If Apple does well and earns more profit, demand for its shares rises, and the price of each share goes up. If Apple struggles, the price falls.

### Why Do Prices Change Every Second?

Stock prices change because they are set by supply and demand on an **exchange** (like the NYSE or NASDAQ). If more people want to buy a stock than sell it, the price rises. If more people want to sell, the price drops. Every trade you see on a chart represents real money exchanging hands between a buyer and a seller.

### Key Terms to Know

| Term | Definition |
|---|---|
| **Ticker** | A short code for a stock (e.g., `AAPL` = Apple, `TSLA` = Tesla) |
| **Share Price** | The current market price of one share |
| **Market Cap** | Share Price × Total Shares — the total value of the company |
| **Dividend** | A portion of profits paid directly to shareholders (not all companies do this) |
| **Bull Market** | A period where prices are generally rising |
| **Bear Market** | A period where prices are generally falling |

### Why Should You Care?

The stock market has historically returned about **10% per year on average** over long periods. Money sitting in a savings account earning 1% loses purchasing power to inflation. Learning to invest is one of the highest-leverage financial skills you can develop.

> **Takeaway:** A stock is a fractional ownership stake in a real company. Its price reflects what the market collectively believes that company is worth *right now*.
""",
        "quiz": {
            "question": "When you buy a share of a company, what do you become?",
            "options": [
                "A creditor who is owed money by the company",
                "A part-owner of the company",
                "An employee of the company",
                "A customer entitled to discounts"
            ],
            "answer_index": 1,
            "explanation": "Buying a share makes you a shareholder — a fractional owner of the company. You are NOT lending money (that's a bond), and you gain no employment or customer rights."
        }
    },
    {
        "id": 2,
        "title": "Reading a Candlestick Chart",
        "module": 1,
        "module_name": "Market Fundamentals",
        "duration_min": 8,
        "xp_reward": 150,
        "tags": ["technical-analysis", "charts"],
        "content": """
## Reading a Candlestick Chart

Candlestick charts are the universal language of professional traders. Every candle compresses a full period of price action — whether that's 1 minute, 1 hour, or 1 day — into a single, readable visual element.

### Anatomy of a Single Candle

Each candle has four data points, called **OHLC**:

```
         ─────  ← HIGH (the highest price reached)
           │
        ┌──┴──┐
        │     │  ← The "body" — the space between OPEN and CLOSE
        └──┬──┘
           │
         ─────  ← LOW (the lowest price reached)
```

- **Open** — the first price traded when the period began
- **High** — the highest price traded during the period
- **Low** — the lowest price traded during the period
- **Close** — the final price when the period ended

### Green vs. Red Candles

The body of the candle is **green** (or white) if the price *closed higher* than it opened — a positive period. The body is **red** (or black) if the price *closed lower* — a negative period.

The thin lines extending above and below the body are called **wicks** (or shadows). A long upper wick means the price shot up but was rejected and sold back down — a sign of selling pressure. A long lower wick means the price dropped but buyers stepped in — a sign of buying support.

### Why Candlesticks Matter

Candlestick patterns give you a rapid visual summary of the **battle between buyers and sellers** during any time period. Common patterns include:

| Pattern | What It Signals |
|---|---|
| **Doji** | Open ≈ Close — indecision, market equilibrium |
| **Hammer** | Long lower wick, small body — buyers rejecting further drops |
| **Shooting Star** | Long upper wick, small body — sellers rejecting further gains |
| **Engulfing** | A large candle that completely covers the previous — momentum shift |

### Practical Tip

Never trade a single candle in isolation. Professional traders look for **clusters of candles** forming patterns and check them against the broader trend. A hammer at a historically significant support level is far more meaningful than one appearing randomly in the middle of a chart.

> **Takeaway:** Each candlestick is a snapshot of the battle between buyers and sellers. Learn to read them and you can decode what the market is *doing* — not just where it has been.
""",
        "quiz": {
            "question": "What does a long lower wick on a candle typically signal?",
            "options": [
                "The price closed much lower than it opened",
                "Strong selling pressure pushed prices down for the whole period",
                "Buyers stepped in and rejected further price declines",
                "The market was closed for part of the period"
            ],
            "answer_index": 2,
            "explanation": "A long lower wick means the price dropped significantly during the period, but buyers aggressively stepped in and pushed the price back up before the close — a sign of buying support and potential reversal."
        }
    },
    {
        "id": 3,
        "title": "Understanding Risk:Reward",
        "module": 2,
        "module_name": "Risk Management",
        "duration_min": 7,
        "xp_reward": 150,
        "tags": ["risk-management", "fundamentals"],
        "content": """
## Understanding Risk:Reward

Of all the concepts in trading, **Risk:Reward (R:R)** is the most overlooked by beginners — and the most obsessed over by professionals. It is the single most important mental model for long-term survival in the markets.

### The Core Idea

Every trade you make has two possible outcomes: it goes in your favour (you profit) or it goes against you (you lose). Before you enter *any* trade, you should know the answer to two questions:

1. **How much am I willing to lose if I'm wrong?** (Your *Risk*)
2. **How much do I expect to gain if I'm right?** (Your *Reward*)

The **Risk:Reward ratio** is simply: `Reward ÷ Risk`.

### A Practical Example

You want to buy Apple stock at **$200**. You place a stop-loss at **$195** (you'll exit if it drops $5). Your target (take profit) is **$215** (a $15 gain).

- Risk per share = $200 − $195 = **$5**
- Reward per share = $215 − $200 = **$15**
- **R:R = 15 ÷ 5 = 3:1** ✅

This trade has a 3:1 ratio — for every $1 you risk, you stand to make $3.

### Why This Number Changes Everything

Here's the maths that most beginners never do:

| Win Rate | R:R Required to Break Even |
|---|---|
| 50% | 1:1 |
| 40% | 1.5:1 |
| 33% | 2:1 |
| **25%** | **3:1** |

A professional trader with a **3:1 R:R** ratio can be **wrong 75% of the time** and still not lose money. This is why risk management — not stock picking — is what separates profitable traders from gamblers.

### The Stop-Loss is Non-Negotiable

A stop-loss is a pre-set price at which you automatically exit a losing trade. Never trade without one. "Hoping" a losing position will recover is how accounts get wiped out.

> **Takeaway:** A good trade is not about being right — it's about risking little to gain much. Always know your R:R ratio before you click buy.
""",
        "quiz": {
            "question": "You buy a stock at $50, set a stop-loss at $47, and a take-profit at $59. What is your Risk:Reward ratio?",
            "options": [
                "1:1",
                "2:1",
                "3:1",
                "4:1"
            ],
            "answer_index": 2,
            "explanation": "Risk = $50 − $47 = $3. Reward = $59 − $50 = $9. Ratio = $9 ÷ $3 = 3:1. An excellent setup — for every $3 you risk, you aim to make $9."
        }
    },
    {
        "id": 4,
        "title": "Market Orders vs. Limit Orders",
        "module": 2,
        "module_name": "Risk Management",
        "duration_min": 6,
        "xp_reward": 125,
        "tags": ["order-types", "execution"],
        "content": """
## Market Orders vs. Limit Orders

Once you've decided to make a trade, you need to tell your broker *how* to execute it. The two most common order types are **Market Orders** and **Limit Orders** — and choosing the wrong one at the wrong time can cost you real money.

### Market Orders — "Buy Now, Whatever the Price"

A **market order** tells your broker: *"Buy (or sell) this stock immediately at the best available price."*

**Pros:**
- Guaranteed to execute — your order fills almost instantly
- Best used when you need to exit a position urgently

**Cons:**
- In fast-moving or illiquid markets, you may get a worse price than expected — this is called **slippage**
- You have no price control

**Example:** You see AAPL at $200 and place a market buy. By the time your order reaches the exchange, competing buy orders may have pushed the price to $200.15. You bought at $200.15 without knowing it.

### Limit Orders — "Buy, But Only at My Price"

A **limit order** tells your broker: *"Buy this stock only if the price reaches X or lower (for a buy). Sell only if the price reaches X or higher (for a sell)."*

**Pros:**
- Full price control — you will never pay more than your limit price
- Eliminates slippage on entry
- Professional traders use limit orders almost exclusively

**Cons:**
- Not guaranteed to fill — if the price never reaches your limit, the order sits unfilled
- Can lead to "missing" trades if the market moves without you

**Example:** AAPL is trading at $202. You believe $199 is a better entry. You place a limit buy at $199. If AAPL dips to $199, your order fills. If it never dips, your order expires.

### When to Use Each

| Scenario | Best Order Type |
|---|---|
| Emergency exit from a losing trade | Market Order |
| Entering a planned position at a specific price | Limit Order |
| Buying a blue-chip stock in normal market hours | Either |
| Pre-market or post-market trading | Limit Order (mandatory) |

> **Takeaway:** Use market orders for emergencies. Use limit orders for everything else — they give you price control and eliminate slippage.
""",
        "quiz": {
            "question": "You want to buy a stock at exactly $100, but it is currently trading at $103. Which order type is correct?",
            "options": [
                "Market Order — it will execute immediately at $103",
                "Limit Order set at $100 — it will only fill if the price drops to $100",
                "Limit Order set at $103 — it will fill immediately",
                "Stop-Loss Order — wait for the stock to recover"
            ],
            "answer_index": 1,
            "explanation": "A limit buy order at $100 will only execute if the price drops to $100 or below. This gives you price control. A market order would fill immediately at the current price of $103, not $100."
        }
    },
    {
        "id": 5,
        "title": "Position Sizing: How Much to Risk",
        "module": 2,
        "module_name": "Risk Management",
        "duration_min": 8,
        "xp_reward": 175,
        "tags": ["risk-management", "position-sizing"],
        "content": """
## Position Sizing: How Much to Risk Per Trade

Most beginner traders focus entirely on *which* stock to buy and almost no time thinking about *how much* to buy. Position sizing is the discipline that keeps you alive long enough to become profitable.

### The Golden Rule: Never Risk More Than 1–2% Per Trade

Professional traders almost universally follow this rule: **never risk more than 1% to 2% of your total account balance on a single trade.**

If you have a **$100,000** account and follow the 1% rule:
- Maximum loss per trade = **$1,000**

This means a streak of 10 losing trades only costs you 10% of your account — painful, but survivable. Traders who ignore this rule often "blow up" (lose everything) in a single bad week.

### The Formula

```
Position Size ($) = Account Risk ($) ÷ Trade Risk Per Share ($)
```

**Step-by-step example:**

1. Your account: **$100,000**
2. You risk **1%** per trade = **$1,000** maximum loss
3. You want to buy AAPL at **$200**, stop-loss at **$195**
4. Trade risk per share = $200 − $195 = **$5**
5. Position Size = $1,000 ÷ $5 = **200 shares**

You buy **200 shares** at $200 (total $40,000 invested). If AAPL drops to $195 and your stop-loss triggers, you lose exactly **$1,000** — your predetermined maximum.

### Why "Going All In" Is Amateur Hour

Imagine putting your entire $100,000 into one trade. A 10% adverse move wipes out $10,000. A 50% adverse move (common for volatile stocks) destroys half your capital. You cannot recover from that psychologically or mathematically in a reasonable time.

### The Math of Recovery

| Loss Suffered | Gain Required to Break Even |
|---|---|
| 10% | 11% |
| 25% | 33% |
| 50% | **100%** |
| 75% | **300%** |

Losing 50% of your account requires a **100% gain** just to get back to where you started. This is why preservation of capital — not profit maximisation — is the first priority of every professional trader.

> **Takeaway:** Calculate your position size *before* every trade using the 1% rule. This single habit is what separates disciplined traders from gamblers.
""",
        "quiz": {
            "question": "Your account has $50,000. You risk 2% per trade. Your stop-loss is $3 away from your entry price. How many shares should you buy?",
            "options": [
                "100 shares",
                "333 shares",
                "500 shares",
                "1,000 shares"
            ],
            "answer_index": 1,
            "explanation": "Account risk = 2% × $50,000 = $1,000. Trade risk per share = $3. Position size = $1,000 ÷ $3 = 333 shares (rounded). Buying 333 shares means your maximum loss equals exactly your 2% limit."
        }
    },
]


# ── Pydantic Schemas ──────────────────────────────────────────────────────────

class LessonMeta(BaseModel):
    id: int
    title: str
    module: int
    module_name: str
    duration_min: int
    xp_reward: int
    tags: List[str]


class QuizSchema(BaseModel):
    question: str
    options: List[str]
    answer_index: int
    explanation: str


class LessonDetail(LessonMeta):
    content: str
    quiz: QuizSchema


class CompleteRequest(BaseModel):
    user_id: int = Field(default=1)
    score: int = Field(ge=0, le=100, description="Quiz score 0–100")


class CompleteResponse(BaseModel):
    lesson_id: int
    score: int
    xp_earned: int
    total_xp: int
    passed: bool
    message: str


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("", response_model=List[LessonMeta], summary="List all lessons")
def list_lessons() -> List[LessonMeta]:
    """Returns metadata for all available lessons (no content or quiz answers)."""
    return [LessonMeta(**{k: v for k, v in l.items() if k != "content" and k != "quiz"}) for l in LESSONS]


@router.get("/{lesson_id}", response_model=LessonDetail, summary="Get full lesson")
def get_lesson(lesson_id: int) -> LessonDetail:
    """Returns the full lesson including Markdown content and quiz question."""
    lesson = next((l for l in LESSONS if l["id"] == lesson_id), None)
    if lesson is None:
        raise HTTPException(status_code=404, detail=f"Lesson {lesson_id} not found.")
    return LessonDetail(**lesson)


@router.post("/{lesson_id}/complete", response_model=CompleteResponse, summary="Mark lesson complete")
def complete_lesson(
    lesson_id: int,
    body: CompleteRequest,
    db: Session = Depends(get_db),
) -> CompleteResponse:
    """
    Records lesson completion in the database and awards XP.
    A score ≥ 70 is required to pass and earn full XP.
    """
    lesson = next((l for l in LESSONS if l["id"] == lesson_id), None)
    if lesson is None:
        raise HTTPException(status_code=404, detail=f"Lesson {lesson_id} not found.")

    passed = body.score >= 70
    xp_earned = lesson["xp_reward"] if passed else lesson["xp_reward"] // 2

    # Record progress
    progress = LessonProgress(
        user_id=body.user_id,
        lesson_id=lesson_id,
        score=body.score,
        xp_earned=xp_earned,
    )
    db.add(progress)

    # Update user XP
    user = db.get(User, body.user_id)
    if user:
        user.xp += xp_earned

    db.commit()

    return CompleteResponse(
        lesson_id=lesson_id,
        score=body.score,
        xp_earned=xp_earned,
        total_xp=user.xp if user else xp_earned,
        passed=passed,
        message=(
            f"🎉 Lesson complete! +{xp_earned} XP earned."
            if passed
            else f"Score too low ({body.score}/100). Minimum 70 to pass. +{xp_earned} XP earned for attempting."
        ),
    )
