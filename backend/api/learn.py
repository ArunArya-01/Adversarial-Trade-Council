from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

router = APIRouter(prefix="/learn", tags=["Learn"])

CHAPTERS_DB: List[Dict[str, Any]] = [
    {
        "id": "ch-1-market-anatomy",
        "chapter_num": 1,
        "title": "Chapter 1: The Anatomy of Financial Markets",
        "subtitle": "How capital flows, primary vs secondary markets, order settlement & clearing",
        "estimated_mins": 20,
        "sections": [
            {
                "id": "s1",
                "title": "1. Why Markets Exist & The Capital Cycle",
                "content": """### The Purpose of Financial Markets

At its core, a financial market is a mechanism for **capital allocation**. Businesses need massive capital to build manufacturing plants, develop artificial intelligence, lay fiber-optic cables, and expand globally. 

There are only two ways a company can fund itself:
1. **Debt (Bonds / Loans)**: Borrowing money that must be repaid with fixed interest regardless of whether the business profits or fails.
2. **Equity (Stocks / Shares)**: Selling fractional ownership of the company to investors. The company never has to 'repay' equity capital; instead, shareholders share in future profits or losses.

### The Primary vs. Secondary Market
- **Primary Market (IPO - Initial Public Offering)**: The company sells brand-new shares directly to investment banks and the public. **This is the only time the company receives capital.**
- **Secondary Market (NSE, BSE, NYSE, NASDAQ)**: Investors buy and sell shares among themselves. If you buy shares of Infosys or Tesla today on your trading app, the company gets ₹0. You are buying from another market participant who wanted to sell.
"""
            },
            {
                "id": "s2",
                "title": "2. Market Participants: Who Moves the Market?",
                "content": """### Understanding the Order Flow Hierarchy

You are never trading against a computer; you are trading in an order book populated by 4 distinct categories of market participants:

1. **Retail Investors**: Individual traders like you and me. While millions in number, retail order sizes are small.
2. **Domestic Institutional Investors (DIIs)**: Mutual funds (SBI MF, HDFC MF), pension funds (EPFO, NPS), and life insurance companies (LIC). They deploy thousands of crores of monthly systematic savings.
3. **Foreign Institutional Investors (FIIs / FPIs)**: Global hedge funds, sovereign wealth funds (e.g., Norway Government Pension Fund, Abu Dhabi Investment Authority), and international pension schemes. FII inflows/outflows dictate major currency and index trends.
4. **Proprietary Desks & High-Frequency Traders (HFTs)**: Algorithmic mathematical firms running colocation servers near exchange engines, capturing fractions of a paisa across millions of arbitrage trades per second.

> **Institutional Insight**: Retail investors often try to predict news. Institutions look at liquidity, risk premiums, and cost of capital. To succeed, trade in alignment with institutional order flow, not against it.
"""
            },
            {
                "id": "s3",
                "title": "3. Demat, Trading Account & The T+1 Clearing System",
                "content": """### The Infrastructure Behind a Single Click

When you click **BUY 100 SHARES @ ₹1,500** on your screen, a multi-layer financial settlement executes:

1. **Trading Account (Broker)**: Executes your order and manages your cash margin.
2. **Exchange Matching Engine (NSE/BSE)**: Matches your Buy Limit order with a Seller's Ask order in microseconds.
3. **Clearing Corporation (NSCCL / ICCL)**: Acts as the legal central counterparty, guaranteeing that the buyer gets shares and the seller gets cash even if a broker defaults.
4. **Demat Account (Depository: NSDL / CDSL)**: The electronic vault where your share certificates are legally registered in your name.

### Settlement Cycle: T+1 & Instant Settlement
- India pioneered **T+1 Settlement** (Trade Date + 1 business day). If you buy on Monday, shares legally settle in your Demat account on Tuesday.
- India is now piloting **T+0 and Instant Settlement**, meaning instant share and cash transfer at the exact second of trade execution.
"""
            }
        ],
        "quiz": [
            {
                "question": "When you buy shares of an established company like Reliance or Apple on the stock exchange, who receives your money?",
                "options": [
                    "The seller of the shares in the secondary market",
                    "The CEO of the company directly",
                    "The government treasury as revenue",
                    "The exchange matching engine as profit"
                ],
                "correct": 0,
                "explanation": "Secondary market transactions take place between market participants. The company only receives funds during primary market offerings (IPOs/FPOs)."
            },
            {
                "question": "What is the legal function of depositories like NSDL and CDSL in India?",
                "options": [
                    "Electronic vaults that hold your securities in Demat form in your legal name",
                    "Stock brokers that provide leverage margin",
                    "Central banks that print currency",
                    "Hedge funds that trade derivative options"
                ],
                "correct": 0,
                "explanation": "Depositories (NSDL/CDSL) hold securities electronically, eliminating physical certificate forgery, theft, and delivery delays."
            }
        ]
    },
    {
        "id": "ch-2-how-to-deal-stocks",
        "chapter_num": 2,
        "title": "Chapter 2: How to Deal with Stocks & Valuation",
        "subtitle": "Anatomy of a share, valuation ratios, EPS, and corporate actions",
        "estimated_mins": 25,
        "sections": [
            {
                "id": "s1",
                "title": "1. What Exactly is a Share & How Value is Created",
                "content": """### Equity Ownership: The Fundamental Truth

When you purchase 1 share of a company with 100,000 total shares, you legally own **0.001%** of every building, patent, inventory item, rupee in cash, and future rupee of profit that company generates.

### How Shareholders Make Money:
1. **Capital Appreciation**: The business expands its revenue and net earnings year over year. Other investors recognize this growth and bid up the share price.
2. **Dividends**: The company distributes a portion of its audited net profits directly as cash into your linked bank account.
3. **Reinvestment Compounding**: Instead of paying dividends, the company reinvests profits into high-return projects (e.g., opening 500 new stores), growing future book value exponentially.
"""
            },
            {
                "id": "s2",
                "title": "2. The Key Valuation Ratios: P/E, EPS, P/B & EV/EBITDA",
                "content": """### The Core Toolkit of Every Intelligent Investor

Never buy a stock simply because its price is '₹50' (cheap) or avoid it because its price is '₹5,000' (expensive). Stock price alone is meaningless without comparing it to earnings.

#### 1. Earnings Per Share (EPS):
$$\\text{EPS} = \\frac{\\text{Net Profit after Tax}}{\\text{Total Number of Shares}}$$

#### 2. Price-to-Earnings Ratio (P/E):
$$\\text{P/E} = \\frac{\\text{Current Market Price}}{\\text{EPS}}$$
*Interpretation*: If the stock is ₹200 and EPS is ₹10, **P/E is 20x**. This means you are paying ₹20 for every ₹1 of current annual profit the company generates.

#### 3. Price-to-Book Ratio (P/B):
$$\\text{P/B} = \\frac{\\text{Market Price}}{\\text{Book Value per Share}}$$
- **Book Value** = Total Assets minus Total Liabilities (what is left if the company is liquidated today).
"""
            },
            {
                "id": "s3",
                "title": "3. Corporate Actions: Splits, Bonuses, Rights & Buybacks",
                "content": """### Decoding Corporate Financial Events

- **Stock Split (1:10)**: 1 share priced at ₹1,000 becomes 10 shares priced at ₹100. Zero change to your net equity; improves liquidity.
- **Bonus Issue (1:1)**: Free shares issued from retained reserves. Share price adjusts proportionally on the ex-date.
- **Dividend**: Direct cash payout per share.
- **Share Buyback**: The company repurchases and cancels its own shares. Bullish signal that expands EPS for remaining shareholders.
"""
            }
        ],
        "quiz": [
            {
                "question": "Company A has a stock price of ₹50 and an EPS of ₹1. Company B has a stock price of ₹1,000 and an EPS of ₹100. Which company is cheaper on a P/E valuation basis?",
                "options": [
                    "Company B (P/E is 10x vs Company A at 50x)",
                    "Company A because ₹50 is a lower absolute number than ₹1,000",
                    "Both are equally cheap",
                    "Stock price cannot be divided by EPS"
                ],
                "correct": 0,
                "explanation": "Valuation is relative to earnings. Company B trades at 10x earnings (₹1000/100), whereas Company A trades at an expensive 50x earnings (₹50/1)."
            }
        ]
    },
    {
        "id": "ch-3-mutual-funds-wealth",
        "chapter_num": 3,
        "title": "Chapter 3: Mutual Funds, Index Funds & SIP Wealth Building",
        "subtitle": "Navigating AMCs, compounding mathematics, expense ratios, and asset allocation",
        "estimated_mins": 25,
        "sections": [
            {
                "id": "s1",
                "title": "1. Mutual Funds & NAV Mechanics",
                "content": """### How a Mutual Fund Works

A Mutual Fund pools capital from lakhs of investors and appoints a professional SEBI-licensed Fund Manager to construct a diversified portfolio according to a defined mandate.

### Net Asset Value (NAV):
$$\\text{NAV} = \\frac{\\text{Market Value of All Assets} - \\text{Liabilities}}{\\text{Total Units}}$$
NAV is calculated once every business evening based on the closing prices of underlying securities.
"""
            },
            {
                "id": "s2",
                "title": "2. Direct vs. Regular Plans: The 30% Wealth Difference",
                "content": """### Why You Must ALWAYS Choose 'Direct Plan'

Every mutual fund scheme comes in two variations:
1. **Regular Plan**: Sold via bank managers or brokers. The AMC pays a recurring **0.5% to 1.5% commission** every single year to the distributor out of your investment capital.
2. **Direct Plan**: Bought directly from the AMC. Zero intermediary commission.

### The 25-Year Difference:
Over 25 years, a 1% difference in expense ratio robs **30% to 40% of your total final compounding corpus**!
"""
            },
            {
                "id": "s3",
                "title": "3. The Compounding Engine: Systematic Investment Plans (SIP)",
                "content": """### Rupee Cost Averaging Demystified

A **Systematic Investment Plan (SIP)** is a disciplined monthly execution vehicle.

#### What Happens in a Market Crash?
- **Month 1 (Market High)**: ₹10,000 buys 100 units @ NAV ₹100.
- **Month 2 (Market Crashes 40%)**: ₹10,000 automatically buys **166.6 units** @ NAV ₹60.
- **Month 3 (Market Recovers to ₹100)**: Your 266.6 units are now worth **₹26,660** on an invested capital of ₹20,000 (**+33.3% Profit**).
"""
            }
        ],
        "quiz": [
            {
                "question": "Why does choosing a 'Direct Plan' over a 'Regular Plan' in mutual funds result in significantly higher wealth over 20+ years?",
                "options": [
                    "Zero distributor commissions are deducted from your NAV, allowing the full compounded return to stay in your account",
                    "Direct plans invest in completely secret government assets",
                    "Regular plans have a legally mandated penalty",
                    "Direct plans do not pay taxes on capital gains"
                ],
                "correct": 0,
                "explanation": "Even a 1% annual distributor commission compounds to tens of lakhs of rupees over multi-decade horizons."
            }
        ]
    },
    {
        "id": "ch-4-technical-candlestick",
        "chapter_num": 4,
        "title": "Chapter 4: Technical Analysis & Candlestick Mastery",
        "subtitle": "Price action, chart psychology, support/resistance, and institutional order blocks",
        "estimated_mins": 30,
        "sections": [
            {
                "id": "s1",
                "title": "1. Candlestick Anatomy & Price Rejection",
                "content": """### Reading the Footprints of Price Action

Every candle encapsulates 4 key data points across a chosen time frame:
- **Open (O)**, **High (H)**, **Low (L)**, **Close (C)**.

### Key Price Action Insights:
1. **Long Lower Wick**: Price dropped deeply during the session, but buyers stepped in with overwhelming volume to push the close back up. **Bullish rejection of lower prices**.
2. **Long Upper Wick**: Price rallied strongly, but sellers / short-sellers overwhelmed buyers and drove price back down before close. **Bearish rejection of higher prices**.
"""
            },
            {
                "id": "s2",
                "title": "2. High-Probability Reversal Formations",
                "content": """### Master Formations You Must Know

1. **Hammer / Pin Bar**: Bullish reversal at major support floors.
2. **Bearish Engulfing**: A large red candle engulfs the prior green candle at historical resistance.
3. **Morning Star**: 3-candle reversal confirming buyer takeover at the end of a downtrend.
"""
            },
            {
                "id": "s3",
                "title": "3. Support, Resistance & The Polarity Principle",
                "content": """### Support & Resistance Mechanics

- **Support**: Floor where institutional limit buy orders are clustered.
- **Resistance**: Ceiling where institutional supply and profit-taking are clustered.
- **The Polarity Principle**: Once Resistance is broken with high volume, it becomes future **Support**.
"""
            }
        ],
        "quiz": [
            {
                "question": "What is indicated when a daily candle prints a long lower shadow (wick) that is three times larger than its small body at key support?",
                "options": [
                    "Aggressive buyer absorption and strong rejection of lower price levels",
                    "Sellers remained in complete control into the close",
                    "Zero trading volume occurred during that day",
                    "The company is going into liquidation"
                ],
                "correct": 0,
                "explanation": "A long lower wick shows that sellers attempted to push the price down, but buyers stepped in forcefully to absorb all supply."
            }
        ]
    },
    {
        "id": "ch-5-risk-management-psychology",
        "chapter_num": 5,
        "title": "Chapter 5: Institutional Risk Management & Trading Psychology",
        "subtitle": "The 1-2% rule, position sizing formulas, drawdown math, and emotional discipline",
        "estimated_mins": 30,
        "sections": [
            {
                "id": "s1",
                "title": "1. The Mathematics of Ruin & Asymmetric Drawdowns",
                "content": """### Capital Preservation is the ONLY Priority

Trading is not about how much money you make when you are right; it is about **how little you lose when you are wrong**.

### The Non-Linear Math of Recovery:
- A **10% loss** requires an **11.1% gain** to break even.
- A **50% loss** requires a **100% gain** just to get back to zero.
- An **80% loss** requires a **400% gain** to break even.
"""
            },
            {
                "id": "s2",
                "title": "2. The 1% Risk Rule & Position Sizing Formula",
                "content": """### How to Calculate the Exact Number of Shares to Buy

$$\\text{Position Size (Shares)} = \\frac{\\text{Total Account Capital} \\times \\text{Risk Percentage}}{\\text{Entry Price} - \\text{Stop-Loss Price}}$$

#### Example:
- Capital: ₹1,00,000 | Risk (1%): ₹1,000.
- Entry: ₹500 | Stop-Loss: ₹480 (₹20 risk per share).
- **Shares to Buy** = $1000 / 20 = \\mathbf{50 \\text{ shares}}$.
"""
            },
            {
                "id": "s3",
                "title": "3. The Power of Risk:Reward Ratio (R:R)",
                "content": """### 40% Win Rate Makes You Wealthy

With a **1:3 Risk to Reward Ratio** (risking ₹1,000 to make ₹3,000):
- 6 Losses: $-₹6,000$
- 4 Wins: $+₹12,000$
- **Net Net Profit**: **+₹6,000** despite losing 60% of trades!
"""
            }
        ],
        "quiz": [
            {
                "question": "If your total trading capital is ₹2,00,000 and you follow the 1% risk rule, with an entry price of ₹400 and a stop-loss at ₹380, how many shares should you buy?",
                "options": [
                    "100 shares (Max risk ₹2,000 / ₹20 risk per share)",
                    "500 shares",
                    "1,000 shares",
                    "10 shares"
                ],
                "correct": 0,
                "explanation": "Max risk is 1% of ₹2,00,000 = ₹2,000. Risk per share is ₹400 - ₹380 = ₹20. Shares to buy = 2000 / 20 = 100 shares."
            }
        ]
    },
    {
        "id": "ch-6-technical-indicators",
        "chapter_num": 6,
        "title": "Chapter 6: Technical Indicators & Moving Average Systems",
        "subtitle": "Moving averages (EMA), RSI divergences, MACD momentum, and volume analysis",
        "estimated_mins": 25,
        "sections": [
            {
                "id": "s1",
                "title": "1. Moving Averages: The Institutional Trend Filter",
                "content": """### EMA vs SMA: The Trend Baseline

- **Exponential Moving Average (EMA)** gives higher weighting to recent price bars, responding faster to price reversals.
- **Key Benchmarks**:
  - **20 EMA**: Short-term momentum guide.
  - **50 EMA**: Medium-term institutional support on pullbacks.
  - **200 EMA**: The ultimate line in the sand separating long-term Bull markets from Bear markets.
"""
            },
            {
                "id": "s2",
                "title": "2. RSI Divergences: Spotting Exhaustion Ahead of Time",
                "content": """### The Relative Strength Index (RSI)

- **Regular Bullish Divergence**: Price makes a Lower Low, but RSI indicator makes a Higher Low. Signals seller exhaustion and upcoming explosive rally.
- **Regular Bearish Divergence**: Price makes a Higher High, but RSI indicator makes a Lower High. Signals buyer exhaustion and imminent distribution dump.
"""
            }
        ],
        "quiz": [
            {
                "question": "What does a Bullish RSI Divergence (Price Lower Low + RSI Higher Low) indicate at a major support zone?",
                "options": [
                    "Downward momentum is dying and buyers are stealthily accumulating",
                    "The stock is going to drop 90% immediately",
                    "Volume has permanently dropped to zero",
                    "The exchange will halt derivative trading"
                ],
                "correct": 0,
                "explanation": "Divergences show price momentum is failing to confirm new price extremes, signaling institutional accumulation."
            }
        ]
    },
    {
        "id": "ch-7-order-execution",
        "chapter_num": 7,
        "title": "Chapter 7: Trading Execution & Order Types",
        "subtitle": "Market vs Limit vs Stop-Loss Limit, Slippage, Bid-Ask Spread, Intraday vs Delivery",
        "estimated_mins": 20,
        "sections": [
            {
                "id": "s1",
                "title": "1. Market, Limit, SL, and SL-M Orders",
                "content": """### Order Execution Architecture

1. **Market Order**: Fills instantly at the best available Ask (for buys) or Bid (for sells). Prone to slippage in fast markets.
2. **Limit Order**: Sets an exact price ceiling or floor. Guarantees price precision, but order may not fill if price runs away.
3. **Stop-Loss Limit (SL-L)**: Has both a Trigger Price and a Limit Price to protect capital against sudden gap downs.
"""
            },
            {
                "id": "s2",
                "title": "2. Product Types: MIS (Intraday) vs CNC (Delivery)",
                "content": """### Cash Delivery vs Margin Intraday

- **CNC (Cash and Carry)**: 100% upfront cash paid. Shares are delivered directly into your Demat account for long-term compounding.
- **MIS (Margin Intraday Square-off)**: Leveraged intraday trading. Automatically auto-squared off by the broker at 3:15 PM IST.
"""
            }
        ],
        "quiz": [
            {
                "question": "Which product code must an investor choose in India to ensure bought shares are legally transferred into their Demat account?",
                "options": [
                    "CNC (Cash and Carry / Delivery)",
                    "MIS (Margin Intraday Square-off)",
                    "CO (Cover Order)",
                    "AMO (After Market Order)"
                ],
                "correct": 0,
                "explanation": "CNC ensures delivery of shares into your electronic Demat account."
            }
        ]
    },
    {
        "id": "ch-8-fundamental-analysis",
        "chapter_num": 8,
        "title": "Chapter 8: Fundamental Analysis & Financial Statements",
        "subtitle": "Balance sheet reading, P&L statements, free cash flow, and economic moats",
        "estimated_mins": 30,
        "sections": [
            {
                "id": "s1",
                "title": "1. Reading the Three Core Financial Statements",
                "content": """### The Three Financial Statements

1. **Balance Sheet**: Snapshot of what the company owns (**Assets**) and what it owes (**Liabilities & Debt**).
2. **Profit & Loss (P&L)**: Revenue -> Operating Margin -> EBITDA -> Net Profit After Tax.
3. **Cash Flow Statement**: Net cash actually received. A company can show accounting profit on P&L while running out of real cash on the Cash Flow Statement!
"""
            },
            {
                "id": "s2",
                "title": "2. Free Cash Flow (FCF) & Economic Moats",
                "content": """### The Warren Buffett Moat Principle

$$\\text{Free Cash Flow} = \\text{Operating Cash Flow} - \\text{Capital Expenditures (Capex)}$$

A company with positive growing Free Cash Flow and a strong **Economic Moat** (pricing power, high switching costs, brand monopoly) creates unbeatable multi-decade compounding.
"""
            }
        ],
        "quiz": [
            {
                "question": "Why is Free Cash Flow often considered a more reliable health indicator than accounting Net Profit?",
                "options": [
                    "It tracks actual cold cash generated after all capital expenditures, eliminating accounting adjustments",
                    "Free Cash Flow is legally exempt from all audit checks",
                    "Net Profit cannot be converted into rupees",
                    "Free Cash Flow is set by the central bank"
                ],
                "correct": 0,
                "explanation": "Free Cash Flow represents real distributable cash generated by operations after reinvestment in assets."
            }
        ]
    },
    {
        "id": "ch-9-derivatives-options",
        "chapter_num": 9,
        "title": "Chapter 9: Derivatives — Futures & Options (F&O)",
        "subtitle": "Derivatives mechanics, Call (CE) vs Put (PE), strike prices, time decay (Theta), and risk",
        "estimated_mins": 30,
        "sections": [
            {
                "id": "s1",
                "title": "1. What are Derivatives? Hedging vs Speculation",
                "content": """### Derivatives Fundamentals

A derivative is a financial contract whose value is derived from an underlying asset (e.g., Nifty 50, Reliance stock, Gold).

- **Futures**: Contract obligating buyer and seller to transact at a predetermined future date and price.
- **Options**: Contract giving the buyer the **right, but not obligation**, to buy (**Call Option - CE**) or sell (**Put Option - PE**) at a set Strike Price.
"""
            },
            {
                "id": "s2",
                "title": "2. The Option Greeks & Time Decay (Theta)",
                "content": """### Why 90%+ of Retail Option Buyers Lose Capital

Options are a decaying asset:
- **Theta Decay**: Every hour that passes, out-of-the-money options lose value automatically even if the stock price does not move!
- Professional institutional players sell options or use multi-leg hedged spreads rather than gambling on naked out-of-the-money calls.
"""
            }
        ],
        "quiz": [
            {
                "question": "What is the primary risk facing naked retail Call (CE) and Put (PE) option buyers?",
                "options": [
                    "Time Decay (Theta): The option contract value decays towards zero every day until expiry",
                    "Options never expire",
                    "Brokers seize company shares automatically",
                    "Options have guaranteed fixed returns"
                ],
                "correct": 0,
                "explanation": "Theta decay erodes the premium of options as the expiration date approaches."
            }
        ]
    },
    {
        "id": "ch-10-macro-global",
        "chapter_num": 10,
        "title": "Chapter 10: Macroeconomics & Global Market Analysis",
        "subtitle": "Central banks (RBI / Fed), interest rates, inflation, currency, and all-weather portfolio",
        "estimated_mins": 30,
        "sections": [
            {
                "id": "s1",
                "title": "1. Central Banks: The Puppet Masters of Liquidity",
                "content": """### How Central Banks Move Markets

When Central Banks (**RBI in India, Federal Reserve in the US**) hike interest rates:
- Borrowing costs rise -> Corporate earnings compress -> Equity PE multiples drop.
- Fixed deposits and bond yields rise -> Capital rotates out of risky stocks into guaranteed debt.

When Central Banks cut rates and inject liquidity:
- Borrowing becomes cheap -> Corporate expansions surge -> Equities experience bull market expansions.
"""
            },
            {
                "id": "s2",
                "title": "2. Building the All-Weather Institutional Portfolio",
                "content": """### The Master Allocation Framework

A truly resilient portfolio balances across 4 uncorrelated asset pillars:
1. **Domestic Equities (50-60%)**: Nifty 50 & Active Large/Mid-cap compounders for growth.
2. **Global Equities & ETFs (15-20%)**: S&P 500 & Nasdaq 100 to hedge currency depreciation against USD.
3. **Gold & Sovereign Gold Bonds (10-15%)**: Safe-haven crisis hedge and inflation protector.
4. **Debt & Liquid Instruments (10-15%)**: Capital preservation and dry powder for deep market crashes.
"""
            }
        ],
        "quiz": [
            {
                "question": "Why does an investor hold US Dollar-denominated assets (like S&P 500 ETFs) alongside Indian equities?",
                "options": [
                    "Geographic diversification and hedging against domestic currency depreciation (USD/INR)",
                    "US assets never experience bear markets",
                    "To avoid all capital gains taxes completely",
                    "It is legally mandatory by SEBI"
                ],
                "correct": 0,
                "explanation": "Holding global assets provides true geographic diversification and gains value when the domestic currency depreciates."
            }
        ]
    }
]

class QuizSubmission(BaseModel):
    chapter_id: str
    answers: Dict[int, int]

@router.get("/chapters")
def get_all_chapters():
    return [
        {
            "id": ch["id"],
            "chapter_num": ch["chapter_num"],
            "title": ch["title"],
            "subtitle": ch["subtitle"],
            "estimated_mins": ch["estimated_mins"],
            "sections_count": len(ch["sections"]),
            "questions_count": len(ch["quiz"])
        }
        for ch in CHAPTERS_DB
    ]

@router.get("/chapters/{chapter_id}")
def get_chapter(chapter_id: str):
    for ch in CHAPTERS_DB:
        if ch["id"] == chapter_id:
            return ch
    raise HTTPException(status_code=404, detail="Chapter not found")

@router.post("/quiz/submit")
def submit_quiz(sub: QuizSubmission):
    chapter = next((ch for ch in CHAPTERS_DB if ch["id"] == sub.chapter_id), None)
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
        
    quiz = chapter["quiz"]
    correct_count = 0
    detailed_feedback = []
    
    for idx, q in enumerate(quiz):
        user_ans = sub.answers.get(idx)
        is_correct = user_ans == q["correct"]
        if is_correct:
            correct_count += 1
        detailed_feedback.append({
            "question_index": idx,
            "is_correct": is_correct,
            "correct_answer": q["correct"],
            "explanation": q["explanation"]
        })
        
    score = int((correct_count / len(quiz)) * 100) if quiz else 100
    passed = score >= 60
    return {
        "chapter_id": sub.chapter_id,
        "score": score,
        "passed": passed,
        "correct_count": correct_count,
        "total_questions": len(quiz),
        "feedback": "Chapter Mastered! Next chapter unlocked." if passed else "Review the lesson sections and retake to unlock the next chapter.",
        "detailed": detailed_feedback
    }
