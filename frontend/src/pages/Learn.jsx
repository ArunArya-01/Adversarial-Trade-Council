import { useState, useEffect } from 'react'
import { BookOpen, CheckCircle2, Lock, ArrowLeft, ArrowRight, Award, Zap, Check, X, ShieldAlert, BookMarked } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../store/useStore'
import ProgressBar from '../components/ui/ProgressBar'

const EMBEDDED_CHAPTERS = [
  {
    id: "ch-1-market-anatomy",
    chapter_num: 1,
    title: "Chapter 1: The Anatomy of Financial Markets",
    subtitle: "How capital flows, primary vs secondary markets, order settlement & clearing",
    estimated_mins: 20,
    sections: [
      {
        id: "s1",
        title: "1. Why Markets Exist & The Capital Cycle",
        content: `### The Purpose of Financial Markets

At its core, a financial market is a mechanism for **capital allocation**. Businesses need massive capital to build manufacturing plants, develop artificial intelligence, lay fiber-optic cables, and expand globally. 

There are only two ways a company can fund itself:
1. **Debt (Bonds / Loans)**: Borrowing money that must be repaid with fixed interest regardless of whether the business profits or fails.
2. **Equity (Stocks / Shares)**: Selling fractional ownership of the company to investors. The company never has to 'repay' equity capital; instead, shareholders share in future profits or losses.

### The Primary vs. Secondary Market
- **Primary Market (IPO - Initial Public Offering)**: The company sells brand-new shares directly to investment banks and the public. **This is the only time the company receives capital.**
- **Secondary Market (NSE, BSE, NYSE, NASDAQ)**: Investors buy and sell shares among themselves. If you buy shares of Infosys or Tesla today on your trading app, the company gets ₹0. You are buying from another market participant who wanted to sell.`
      },
      {
        id: "s2",
        title: "2. Market Participants: Who Moves the Market?",
        content: `### Understanding the Order Flow Hierarchy

You are never trading against a computer; you are trading in an order book populated by 4 distinct categories of market participants:

1. **Retail Investors**: Individual traders like you and me. While millions in number, retail order sizes are small.
2. **Domestic Institutional Investors (DIIs)**: Mutual funds (SBI MF, HDFC MF), pension funds (EPFO, NPS), and life insurance companies (LIC). They deploy thousands of crores of monthly systematic savings.
3. **Foreign Institutional Investors (FIIs / FPIs)**: Global hedge funds, sovereign wealth funds (e.g., Norway Government Pension Fund, Abu Dhabi Investment Authority), and international pension schemes. FII inflows/outflows dictate major currency and index trends.
4. **Proprietary Desks & High-Frequency Traders (HFTs)**: Algorithmic mathematical firms running colocation servers near exchange engines, capturing fractions of a paisa across millions of arbitrage trades per second.

> **Institutional Insight**: Retail investors often try to predict news. Institutions look at liquidity, risk premiums, and cost of capital. To succeed, trade in alignment with institutional order flow, not against it.`
      },
      {
        id: "s3",
        title: "3. Demat, Trading Account & The T+1 Clearing System",
        content: `### The Infrastructure Behind a Single Click

When you click **BUY 100 SHARES @ ₹1,500** on your screen, a multi-layer financial settlement executes:

1. **Trading Account (Broker)**: Executes your order and manages your cash margin.
2. **Exchange Matching Engine (NSE/BSE)**: Matches your Buy Limit order with a Seller's Ask order in microseconds.
3. **Clearing Corporation (NSCCL / ICCL)**: Acts as the legal central counterparty, guaranteeing that the buyer gets shares and the seller gets cash even if a broker defaults.
4. **Demat Account (Depository: NSDL / CDSL)**: The electronic vault where your share certificates are legally registered in your name.

### Settlement Cycle: T+1 & Instant Settlement
- India pioneered **T+1 Settlement** (Trade Date + 1 business day). If you buy on Monday, shares legally settle in your Demat account on Tuesday.
- India is now rolling out **T+0 and Instant Settlement**, enabling instant share and cash transfers at the exact second of trade execution.`
      }
    ],
    quiz: [
      {
        question: "1. When you buy shares of an established company like Reliance or Apple on the stock exchange, who receives your money?",
        options: [
          "The seller of the shares in the secondary market",
          "The CEO of the company directly",
          "The government treasury as tax revenue",
          "The exchange matching engine as profit"
        ],
        correct: 0,
        explanation: "Secondary market transactions take place between market participants. The company only receives funds during primary market offerings (IPOs/FPOs)."
      },
      {
        question: "2. What is the legal function of depositories like NSDL and CDSL in India?",
        options: [
          "Electronic vaults that hold your securities in Demat form in your legal name",
          "Stock brokers that provide leverage margin",
          "Central banks that print physical currency",
          "Hedge funds that trade derivative options"
        ],
        correct: 0,
        explanation: "Depositories (NSDL/CDSL) hold securities electronically, eliminating physical certificate forgery, theft, and delivery delays."
      },
      {
        question: "3. Which of the following defines an Initial Public Offering (IPO)?",
        options: [
          "The primary market transaction where a private company sells newly created shares to the public for the first time",
          "A daily stock market crash caused by inflation",
          "A loan taken from a commercial bank by a government entity",
          "A dividend payment made to senior citizens"
        ],
        correct: 0,
        explanation: "An IPO is the milestone primary market event where a company raises public capital in exchange for equity ownership."
      },
      {
        question: "4. What critical role does a Clearing Corporation (such as NSCCL) play in modern stock exchanges?",
        options: [
          "Acts as a central counterparty to guarantee financial trade settlement even if one party defaults",
          "Predicts the closing price of stocks using artificial intelligence",
          "Lends money directly to retail traders to buy luxury goods",
          "Prints physical newspaper reports of daily trades"
        ],
        correct: 0,
        explanation: "Clearing corporations guarantee trade settlement, eliminating counterparty risk so buyers receive shares and sellers receive funds."
      },
      {
        question: "5. In a T+1 settlement cycle, if you execute a delivery purchase of shares on Monday morning, when do they settle into your Demat account?",
        options: [
          "Tuesday (T+1 business day)",
          "Next week on Monday (T+7 business days)",
          "Immediately in 1 microsecond",
          "At the end of the calendar month"
        ],
        correct: 0,
        explanation: "T+1 settlement means Trade date + 1 business day (settles by Tuesday evening)."
      },
      {
        question: "6. Which category of institutional participants has the largest structural impact on emerging market currency and benchmark index trends?",
        options: [
          "Foreign Institutional Investors (FIIs / Sovereign Wealth Funds)",
          "Retail intraday scalpers",
          "Local retail bank depositors",
          "Social media stock tip channels"
        ],
        correct: 0,
        explanation: "FIIs command billions of dollars in cross-border flows; their entry or exit directly impacts USD/INR and major index trends."
      },
      {
        question: "7. What is the fundamental difference between raising money via Debt (Bonds) vs. Equity (Stocks)?",
        options: [
          "Debt requires mandatory interest repayment regardless of profit; Equity gives ownership and never requires repayment",
          "Debt gives shareholders voting rights in the company board",
          "Equity is a guaranteed government bond that never drops in value",
          "There is no legal difference between debt and equity"
        ],
        correct: 0,
        explanation: "Debt creates a fixed legal liability; equity creates shared partnership ownership without repayment obligations."
      },
      {
        question: "8. What is the 'Order Book' in a modern electronic stock exchange?",
        options: [
          "A real-time electronic list of all pending Buy bids and Sell ask orders organized by price level",
          "A physical notebook kept in the exchange vault",
          "A list of companies that went bankrupt in the last decade",
          "A credit report score for retail investors"
        ],
        correct: 0,
        explanation: "The electronic order book continuously matches the highest buyer bid with the lowest seller ask."
      }
    ]
  },
  {
    id: "ch-2-how-to-deal-stocks",
    chapter_num: 2,
    title: "Chapter 2: How to Deal with Stocks & Valuation",
    subtitle: "Anatomy of a share, valuation ratios, EPS, and corporate actions",
    estimated_mins: 25,
    sections: [
      {
        id: "s1",
        title: "1. What Exactly is a Share & How Value is Created",
        content: `### Equity Ownership: The Fundamental Truth

When you purchase 1 share of a company with 100,000 total shares, you legally own **0.001%** of every building, patent, inventory item, rupee in cash, and future rupee of profit that company generates.

### How Shareholders Make Money:
1. **Capital Appreciation**: The business expands its revenue and net earnings year over year. Other investors recognize this growth and bid up the share price.
2. **Dividends**: The company distributes a portion of its audited net profits directly as cash into your linked bank account.
3. **Reinvestment Compounding**: Instead of paying dividends, the company reinvests profits into high-return projects (e.g., opening 500 new stores), growing future book value exponentially.`
      },
      {
        id: "s2",
        title: "2. The Key Valuation Ratios: P/E, EPS, P/B & EV/EBITDA",
        content: `### The Core Toolkit of Every Intelligent Investor

Never buy a stock simply because its price is '₹50' (cheap) or avoid it because its price is '₹5,000' (expensive). Stock price alone is meaningless without comparing it to earnings.

#### 1. Earnings Per Share (EPS):
$$\text{EPS} = \frac{\text{Net Profit after Tax}}{\text{Total Number of Shares}}$$

#### 2. Price-to-Earnings Ratio (P/E):
$$\text{P/E} = \frac{\text{Current Market Price}}{\text{EPS}}$$
*Interpretation*: If the stock is ₹200 and EPS is ₹10, **P/E is 20x**. This means you are paying ₹20 for every ₹1 of current annual profit the company generates.

#### 3. Price-to-Book Ratio (P/B):
$$\text{P/B} = \frac{\text{Market Price}}{\text{Book Value per Share}}$$
- **Book Value** = Total Assets minus Total Liabilities (what is left if the company is liquidated today).`
      },
      {
        id: "s3",
        title: "3. Corporate Actions: Splits, Bonuses, Rights & Buybacks",
        content: `### Decoding Corporate Financial Events

- **Stock Split (1:10)**: 1 share priced at ₹1,000 becomes 10 shares priced at ₹100. Zero change to your net equity; improves liquidity.
- **Bonus Issue (1:1)**: Free shares issued from retained reserves. Share price adjusts proportionally on the ex-date.
- **Dividend**: Direct cash payout per share.
- **Share Buyback**: The company repurchases and cancels its own shares. Bullish signal that expands EPS for remaining shareholders.`
      }
    ],
    quiz: [
      {
        question: "1. Company A has a stock price of ₹50 and an EPS of ₹1. Company B has a stock price of ₹1,000 and an EPS of ₹100. Which company is cheaper on a P/E valuation basis?",
        options: [
          "Company B (P/E is 10x vs Company A at 50x)",
          "Company A because ₹50 is a lower absolute number than ₹1,000",
          "Both are equally cheap",
          "Stock price cannot be divided by EPS"
        ],
        correct: 0,
        explanation: "Valuation is relative to earnings. Company B trades at 10x earnings (₹1000/100), whereas Company A trades at an expensive 50x earnings (₹50/1)."
      },
      {
        question: "2. If a company announces a 1:5 Stock Split, what happens to an investor holding 100 shares priced at ₹500?",
        options: [
          "They now hold 500 shares priced at ₹100 each; total wealth remains ₹50,000",
          "Their total portfolio value multiplies by 5 times to ₹2,50,000 instantly",
          "Their shares are cancelled by the stock exchange",
          "They must pay a 50% penalty tax immediately"
        ],
        correct: 0,
        explanation: "A stock split divides existing shares into smaller units. Total equity value remains exactly the same while liquidity improves."
      },
      {
        question: "3. What does a Price-to-Book (P/B) ratio of 0.8x for a manufacturing company typically indicate?",
        options: [
          "The stock is trading below the net accounting asset value of its balance sheet",
          "The company has zero debt and zero revenue",
          "The stock must double within 24 hours",
          "The company is paying an 80% annual dividend yield"
        ],
        correct: 0,
        explanation: "A P/B below 1.0 means the market is valuing the firm at less than its net tangible balance sheet assets."
      },
      {
        question: "4. What happens when a cash-rich company executes a Share Buyback in the open market?",
        options: [
          "It purchases and cancels its own shares, reducing the total share count and increasing future EPS",
          "It sells off all of its office buildings to pay debt",
          "It forces shareholders to sell their shares at a 50% discount",
          "It closes down its business operations"
        ],
        correct: 0,
        explanation: "Buybacks reduce total outstanding share count. Future corporate profits are shared among fewer shares, boosting EPS."
      },
      {
        question: "5. What is Dividend Yield?",
        options: [
          "Annual dividend payout per share divided by the current market stock price",
          "The total tax paid on trading transactions",
          "The percentage increase in daily trading volume",
          "The interest rate charged by a stock broker"
        ],
        correct: 0,
        explanation: "Dividend Yield = (Annual Dividend per Share / Stock Price) × 100%."
      },
      {
        question: "6. Which metric is best for comparing the operational profitability of companies with different debt levels and tax structures?",
        options: [
          "EV / EBITDA (Enterprise Value to EBITDA)",
          "Stock price divided by total employees",
          "Historical high stock price",
          "Number of followers on company social media"
        ],
        correct: 0,
        explanation: "EV/EBITDA accounts for both debt and cash, making it the premier metric across varying capital structures."
      },
      {
        question: "7. What is 'Market Capitalization'?",
        options: [
          "Current share price multiplied by the total number of outstanding company shares",
          "The total cash in the company's checking account",
          "The total debt owed to private banks",
          "The highest price a stock reached in 52 weeks"
        ],
        correct: 0,
        explanation: "Market Cap = Share Price × Total Outstanding Shares. It measures the total equity value of the enterprise."
      },
      {
        question: "8. Why is a company with consistently high Return on Equity (ROE > 20%) and zero debt highly prized by institutional investors?",
        options: [
          "It efficiently compounds shareholder capital with strong pricing power without financial leverage risk",
          "It guarantees that government will subsidize its products",
          "It prevents employees from resigning",
          "It allows the stock to trade 24 hours a day"
        ],
        correct: 0,
        explanation: "High ROE without debt signifies an exceptional competitive moat and superior capital allocation."
      }
    ]
  },
  {
    id: "ch-3-mutual-funds-wealth",
    chapter_num: 3,
    title: "Chapter 3: Mutual Funds, Index Funds & SIP Wealth Building",
    subtitle: "Navigating AMCs, compounding mathematics, expense ratios, and asset allocation",
    estimated_mins: 25,
    sections: [
      {
        id: "s1",
        title: "1. Mutual Funds & NAV Mechanics",
        content: `### How a Mutual Fund Works

A Mutual Fund pools capital from lakhs of investors and appoints a professional SEBI-licensed Fund Manager to construct a diversified portfolio according to a defined mandate.

### Net Asset Value (NAV):
$$\text{NAV} = \frac{\text{Market Value of All Assets} - \text{Liabilities}}{\text{Total Units}}$$
NAV is calculated once every business evening based on the closing prices of underlying securities.`
      },
      {
        id: "s2",
        title: "2. Direct vs. Regular Plans: The 30% Wealth Difference",
        content: `### Why You Must ALWAYS Choose 'Direct Plan'

Every mutual fund scheme comes in two variations:
1. **Regular Plan**: Sold via bank managers or brokers. The AMC pays a recurring **0.5% to 1.5% commission** every single year to the distributor out of your investment capital.
2. **Direct Plan**: Bought directly from the AMC. Zero intermediary commission.

### The 25-Year Difference:
Over 25 years, a 1% difference in expense ratio robs **30% to 40% of your total final compounding corpus**!`
      },
      {
        id: "s3",
        title: "3. The Compounding Engine: Systematic Investment Plans (SIP)",
        content: `### Rupee Cost Averaging Demystified

A **Systematic Investment Plan (SIP)** is a disciplined monthly execution vehicle.

#### What Happens in a Market Crash?
- **Month 1 (Market High)**: ₹10,000 buys 100 units @ NAV ₹100.
- **Month 2 (Market Crashes 40%)**: ₹10,000 automatically buys **166.6 units** @ NAV ₹60.
- **Month 3 (Market Recovers to ₹100)**: Your 266.6 units are now worth **₹26,660** on an invested capital of ₹20,000 (**+33.3% Profit**).`
      }
    ],
    quiz: [
      {
        question: "1. Why does choosing a 'Direct Plan' over a 'Regular Plan' in mutual funds result in significantly higher wealth over 20+ years?",
        options: [
          "Zero distributor commissions are deducted from your NAV, allowing the full compounded return to stay in your account",
          "Direct plans invest in completely secret government assets",
          "Regular plans have a legally mandated penalty",
          "Direct plans do not pay taxes on capital gains"
        ],
        correct: 0,
        explanation: "Even a 1% annual distributor commission compounds to tens of lakhs of rupees over multi-decade horizons."
      },
      {
        question: "2. How does Rupee-Cost Averaging benefit an investor during a severe 40% market crash?",
        options: [
          "The fixed monthly SIP investment automatically buys significantly more fund units at discounted NAVs",
          "It freezes market prices to prevent further losses",
          "It converts the fund into physical cash in a bank locker",
          "It doubles the interest rate of the central bank"
        ],
        correct: 0,
        explanation: "Crashes lower the NAV, which enables your fixed SIP installment to acquire a much larger quantity of units."
      },
      {
        question: "3. What is an Index Fund (Passive Mutual Fund)?",
        options: [
          "A low-cost fund that replicates the exact stock weights of an index (like Nifty 50 or S&P 500) with minimal expense ratio",
          "A high-risk hedge fund that trades cryptocurrency with 100x leverage",
          "A fund that only invests in government electricity bills",
          "A bank account with fixed interest rates"
        ],
        correct: 0,
        explanation: "Index funds eliminate active fund manager bias and high fees by tracking the broad benchmark automatically."
      },
      {
        question: "4. What is Total Expense Ratio (TER)?",
        options: [
          "The annual operational, management, and administrative fee charged by the AMC as a percentage of daily assets",
          "The one-time capital gains tax paid to the government",
          "The fee charged by an internet service provider",
          "The cost of opening a Demat account"
        ],
        correct: 0,
        explanation: "TER represents the total annual percentage cost charged by the asset management company to manage the fund."
      },
      {
        question: "5. Which mutual fund category qualifies for tax deduction under Section 80C in India with a 3-year mandatory lock-in?",
        options: [
          "ELSS (Equity Linked Savings Scheme)",
          "Liquid Over-night Fund",
          "Small-cap Thematic Fund",
          "International Commodity Fund"
        ],
        correct: 0,
        explanation: "ELSS funds offer Section 80C tax deductions with the shortest lock-in period (3 years) among 80C instruments."
      },
      {
        question: "6. What is the fundamental difference between an Equity Fund and a Debt Fund?",
        options: [
          "Equity funds invest in company shares for growth; Debt funds invest in government bonds/corporate debentures for capital preservation and fixed interest",
          "Equity funds are guaranteed by law; Debt funds carry unlimited risk",
          "Debt funds only trade on foreign stock exchanges",
          "There is no difference in their underlying assets"
        ],
        correct: 0,
        explanation: "Equity funds hold ownership in businesses; debt funds lend money to corporations and governments for fixed interest income."
      },
      {
        question: "7. If you withdraw mutual fund units before a designated holding period (e.g. 1 year), what fee might the fund deduct?",
        options: [
          "Exit Load",
          "Brokerage commission fee",
          "Demurrage charge",
          "Stamp duty surcharge"
        ],
        correct: 0,
        explanation: "Exit loads are small percentage penalties charged to discourage short-term redemptions from long-term mutual funds."
      },
      {
        question: "8. Why is starting a SIP at age 22 with ₹5,000/month often far more powerful than starting at age 35 with ₹15,000/month?",
        options: [
          "Compounding is non-linear; the extra 13 years of compounding time creates exponential growth on early invested capital",
          "Younger investors receive higher interest rates from banks by law",
          "Older investors pay double capital gains taxes",
          "Stock markets only give returns to college students"
        ],
        correct: 0,
        explanation: "Time in the market allows compound interest to snowball exponentially over multi-decade runways."
      }
    ]
  },
  {
    id: "ch-4-technical-candlestick",
    chapter_num: 4,
    title: "Chapter 4: Technical Analysis & Candlestick Mastery",
    subtitle: "Price action, chart psychology, support/resistance, and institutional order blocks",
    estimated_mins: 30,
    sections: [
      {
        id: "s1",
        title: "1. Candlestick Anatomy & Price Rejection",
        content: `### Reading the Footprints of Price Action

Every candle encapsulates 4 key data points across a chosen time frame:
- **Open (O)**, **High (H)**, **Low (L)**, **Close (C)**.

### Key Price Action Insights:
1. **Long Lower Wick**: Price dropped deeply during the session, but buyers stepped in with overwhelming volume to push the close back up. **Bullish rejection of lower prices**.
2. **Long Upper Wick**: Price rallied strongly, but sellers / short-sellers overwhelmed buyers and drove price back down before close. **Bearish rejection of higher prices**.`
      },
      {
        id: "s2",
        title: "2. High-Probability Reversal Formations",
        content: `### Master Formations You Must Know

1. **Hammer / Pin Bar**: Bullish reversal at major support floors.
2. **Bearish Engulfing**: A large red candle engulfs the prior green candle at historical resistance.
3. **Morning Star**: 3-candle reversal confirming buyer takeover at the end of a downtrend.`
      },
      {
        id: "s3",
        title: "3. Support, Resistance & The Polarity Principle",
        content: `### Support & Resistance Mechanics

- **Support**: Floor where institutional limit buy orders are clustered.
- **Resistance**: Ceiling where institutional supply and profit-taking are clustered.
- **The Polarity Principle**: Once Resistance is broken with high volume, it becomes future **Support**.`
      }
    ],
    quiz: [
      {
        question: "1. What is indicated when a daily candle prints a long lower shadow (wick) that is three times larger than its small body at key support?",
        options: [
          "Aggressive buyer absorption and strong rejection of lower price levels",
          "Sellers remained in complete control into the close",
          "Zero trading volume occurred during that day",
          "The company is going into liquidation"
        ],
        correct: 0,
        explanation: "A long lower wick shows that sellers attempted to push the price down, but buyers stepped in forcefully to absorb all supply."
      },
      {
        question: "2. What is a 'Bearish Engulfing' candlestick pattern?",
        options: [
          "A small green candle followed by a massive red candle whose real body completely engulfs the prior candle's body at resistance",
          "Two identical green candles in a row with zero wicks",
          "A candle with zero trading volume on a holiday",
          "A pattern indicating that the stock will rally forever"
        ],
        correct: 0,
        explanation: "Bearish engulfing indicates institutional selling power completely overwhelmed prior buyers at resistance."
      },
      {
        question: "3. What is the Polarity Principle in Technical Analysis?",
        options: [
          "Once a major Resistance level is decisively broken on volume, it flips to become future Support",
          "Stock prices must alternate between green and red every day",
          "All technical indicators must always point in opposite directions",
          "Trading volume always equals share price"
        ],
        correct: 0,
        explanation: "Broken resistance flips into support because previous breakout traders defend their entry levels."
      },
      {
        question: "4. What is a 'Bull Trap' (False Breakout)?",
        options: [
          "Price temporarily crosses above resistance on weak volume, lures in retail buyers, and then reverses sharply lower",
          "An official exchange fine for buying too many shares",
          "A company announcing record dividends on a Friday",
          "A market holiday where trading is paused"
        ],
        correct: 0,
        explanation: "Bull traps trigger retail breakout orders to provide exit liquidity for institutional short sellers."
      },
      {
        question: "5. What does a 'Doji' candlestick formation represent?",
        options: [
          "Open price is virtually identical to the Close price, reflecting temporary equilibrium and market indecision",
          "Buyers have achieved 100% control of the market",
          "Sellers have completely liquidated all shares",
          "The stock will be delisted tomorrow"
        ],
        correct: 0,
        explanation: "A Doji represents perfect balance between buyers and sellers where neither side was able to sustain a directional push."
      },
      {
        question: "6. Why is trading volume critical when analyzing a breakout from a chart pattern?",
        options: [
          "High volume confirms institutional participation and conviction behind the price move",
          "Volume determines the tax rate on the transaction",
          "Volume slows down internet connection speeds",
          "Volume is only useful for government bond traders"
        ],
        correct: 0,
        explanation: "Breakouts on heavy volume signify institutional sponsorship; low volume breakouts frequently fail as traps."
      },
      {
        question: "7. Where should a disciplined technical trader logically place their Stop-Loss order when buying a breakout above Resistance?",
        options: [
          "Just below the newly flipped Support level (below the breakout candle low)",
          "100% below the stock price at zero",
          "At the exact current market price",
          "At the all-time high price target"
        ],
        correct: 0,
        explanation: "A stop-loss should sit below technical structural invalidation levels where your trade thesis is proven wrong."
      },
      {
        question: "8. What is a 'Morning Star' formation?",
        options: [
          "A 3-candle bullish reversal pattern: large red candle -> indecision star -> strong green candle closing deep into candle 1",
          "The first trade executed at 9:15 AM on the exchange",
          "A stock that only trades during pre-market hours",
          "A government report on solar energy stocks"
        ],
        correct: 0,
        explanation: "The Morning Star marks the exhaustion of selling momentum followed by aggressive institutional accumulation."
      }
    ]
  },
  {
    id: "ch-5-risk-management-psychology",
    chapter_num: 5,
    title: "Chapter 5: Institutional Risk Management & Trading Psychology",
    subtitle: "The 1-2% rule, position sizing formulas, drawdown math, and emotional discipline",
    estimated_mins: 30,
    sections: [
      {
        id: "s1",
        title: "1. The Mathematics of Ruin & Asymmetric Drawdowns",
        content: `### Capital Preservation is the ONLY Priority

Trading is not about how much money you make when you are right; it is about **how little you lose when you are wrong**.

### The Non-Linear Math of Recovery:
- A **10% loss** requires an **11.1% gain** to break even.
- A **50% loss** requires a **100% gain** just to get back to zero.
- An **80% loss** requires a **400% gain** to break even.`
      },
      {
        id: "s2",
        title: "2. The 1% Risk Rule & Position Sizing Formula",
        content: `### How to Calculate the Exact Number of Shares to Buy

$$\text{Position Size (Shares)} = \frac{\text{Total Account Capital} \times \text{Risk Percentage}}{\text{Entry Price} - \text{Stop-Loss Price}}`
      },
      {
        id: "s3",
        title: "3. The Power of Risk:Reward Ratio (R:R)",
        content: `### 40% Win Rate Makes You Wealthy

With a **1:3 Risk to Reward Ratio** (risking ₹1,000 to make ₹3,000):
- 6 Losses: $-₹6,000$
- 4 Wins: $+₹12,000$
- **Net Net Profit**: **+₹6,000** despite losing 60% of trades!`
      }
    ],
    quiz: [
      {
        question: "1. If your total trading capital is ₹2,00,000 and you follow the 1% risk rule, with an entry price of ₹400 and a stop-loss at ₹380, how many shares should you buy?",
        options: [
          "100 shares (Max risk ₹2,000 / ₹20 risk per share)",
          "500 shares",
          "1,000 shares",
          "10 shares"
        ],
        correct: 0,
        explanation: "Max risk is 1% of ₹2,00,000 = ₹2,000. Risk per share is ₹400 - ₹380 = ₹20. Shares to buy = 2000 / 20 = 100 shares."
      },
      {
        question: "2. If a trading account suffers a catastrophic 50% loss of capital, what percentage gain is required on the remaining money just to break even?",
        options: [
          "100% gain",
          "50% gain",
          "25% gain",
          "75% gain"
        ],
        correct: 0,
        explanation: "If ₹1,00,000 drops to ₹50,000 (-50%), you must make ₹50,000 on your remaining ₹50,000, which is a +100% return."
      },
      {
        question: "3. What is the minimum win rate required to be consistently profitable with an asymmetric 1:3 Risk-to-Reward ratio?",
        options: [
          "Above 25% win rate",
          "At least 75% win rate",
          "100% win rate",
          "50% win rate is the bare minimum"
        ],
        correct: 0,
        explanation: "At 1:3 R:R, 1 winning trade covers 3 full losses. A 25% win rate breaks even; anything above generates net profit."
      },
      {
        question: "4. What is 'Revenge Trading' in trading psychology?",
        options: [
          "Taking oversized, reckless, unplanned trades immediately after a loss to try to win back money quickly",
          "A legal complaint filed with the stock exchange against an analyst",
          "Short selling a competitor's stock during earnings",
          "Automating trades using high-speed algorithmic software"
        ],
        correct: 0,
        explanation: "Revenge trading is an emotional spiral where a trader abandons risk rules after a loss, frequently blowing up accounts."
      },
      {
        question: "5. What is the primary purpose of a Trailing Stop-Loss?",
        options: [
          "To lock in accrued profits automatically as the stock price moves favorably in your direction",
          "To buy more shares when the price drops",
          "To avoid paying taxes on winning trades",
          "To trade without an internet connection"
        ],
        correct: 0,
        explanation: "A trailing stop moves upward with the price, securing accumulated gains while allowing the trend to run."
      },
      {
        question: "6. Why do professional institutional fund managers maintain a strict maximum 1% to 2% risk limit per trade idea?",
        options: [
          "It guarantees that even a string of 10 consecutive losing trades leaves 85-90% of equity intact for future opportunities",
          "Brokers prohibit taking larger positions by law",
          "Government central banks mandate 1% profits",
          "To prevent winning trades from becoming too large"
        ],
        correct: 0,
        explanation: "Low risk per trade prevents risk of ruin, ensuring the trader easily survives normal statistical losing streaks."
      },
      {
        question: "7. What is 'FOMO' in trading and why is it dangerous?",
        options: [
          "Fear Of Missing Out: Chasing extended stock prices near the top out of greed, leading to buying at local peaks before pullbacks",
          "Forward Order Matching Option: An institutional exchange order type",
          "A tax deduction category for mutual fund investors",
          "A mathematical indicator for volume analysis"
        ],
        correct: 0,
        explanation: "FOMO causes traders to enter impulsively after a move has already occurred, exposing them to immediate reversals."
      },
      {
        question: "8. What is the single most important habit for developing long-term trading consistency?",
        options: [
          "Keeping a detailed Trade Journal recording entry reasons, stop-loss, risk amount, emotions, and lessons learned",
          "Joining 20 different telegram stock tip groups",
          "Using 15 different indicators on a 1-minute chart",
          "Doubling position size after every losing trade"
        ],
        correct: 0,
        explanation: "A trade journal provides objective data on your edge, errors, and psychological triggers for continuous improvement."
      }
    ]
  },
  {
    id: "ch-6-technical-indicators",
    chapter_num: 6,
    title: "Chapter 6: Technical Indicators & Moving Average Systems",
    subtitle: "Moving averages (EMA), RSI divergences, MACD momentum, and volume analysis",
    estimated_mins: 25,
    sections: [
      {
        id: "s1",
        title: "1. Moving Averages: The Institutional Trend Filter",
        content: `### EMA vs SMA: The Trend Baseline

- **Exponential Moving Average (EMA)** gives higher weighting to recent price bars, responding faster to price reversals.
- **Key Benchmarks**:
  - **20 EMA**: Short-term momentum guide.
  - **50 EMA**: Medium-term institutional support on pullbacks.
  - **200 EMA**: The ultimate line in the sand separating long-term Bull markets from Bear markets.`
      },
      {
        id: "s2",
        title: "2. RSI Divergences: Spotting Exhaustion Ahead of Time",
        content: `### The Relative Strength Index (RSI)

- **Regular Bullish Divergence**: Price makes a Lower Low, but RSI indicator makes a Higher Low. Signals seller exhaustion and upcoming explosive rally.
- **Regular Bearish Divergence**: Price makes a Higher High, but RSI indicator makes a Lower High. Signals buyer exhaustion and imminent distribution dump.`
      }
    ],
    quiz: [
      {
        question: "1. What does a Bullish RSI Divergence (Price Lower Low + RSI Higher Low) indicate at a major support zone?",
        options: [
          "Downward momentum is dying and buyers are stealthily accumulating",
          "The stock is going to drop 90% immediately",
          "Volume has permanently dropped to zero",
          "The exchange will halt derivative trading"
        ],
        correct: 0,
        explanation: "Divergences show price momentum is failing to confirm new price extremes, signaling institutional accumulation."
      },
      {
        question: "2. What is the 'Golden Cross' in moving average technical analysis?",
        options: [
          "The 50-period moving average crosses above the 200-period moving average from below, confirming a major bull market regime",
          "The stock price reaches an all-time record high of ₹10,000",
          "A gold mining company buys shares of a technology firm",
          "A stock broker eliminates all transaction fees"
        ],
        correct: 0,
        explanation: "The 50/200 EMA Golden Cross is a classic multi-month institutional trend transition indicator."
      },
      {
        question: "3. What is an overbought reading on the standard 14-period RSI indicator?",
        options: [
          "RSI above 70 (or 80 in strong momentum bull runs)",
          "RSI at exactly zero",
          "RSI below 30",
          "RSI moving sideways between 45 and 55"
        ],
        correct: 0,
        explanation: "RSI readings above 70 denote extended upside momentum that may be susceptible to consolidation or mean reversion."
      },
      {
        question: "4. How is the MACD (Moving Average Convergence Divergence) histogram calculated?",
        options: [
          "The difference between the MACD Line (12 EMA - 26 EMA) and the 9-period Signal Line",
          "Total volume divided by open interest",
          "Stock price multiplied by the number of shares traded",
          "The highest price minus the lowest price of the year"
        ],
        correct: 0,
        explanation: "The MACD histogram visualizes the expanding or contracting momentum delta between the MACD line and its signal trigger line."
      },
      {
        question: "5. What happens when a stock rallies +5% on exceptionally low trading volume compared to its 30-day average?",
        options: [
          "It indicates lack of institutional sponsorship and higher probability of a false rally / trap",
          "It confirms that trillion-dollar sovereign wealth funds are buying aggressively",
          "It guarantees that the stock will split 1:10 tomorrow",
          "Low volume has zero statistical meaning in financial markets"
        ],
        correct: 0,
        explanation: "Price advances without volume expansion reflect retail chasing rather than institutional accumulation."
      },
      {
        question: "6. Why is the 200-day Exponential Moving Average (200 EMA) considered the most watched baseline in global equity markets?",
        options: [
          "Institutional asset allocators and mutual funds use it as the primary dividing line between macro bull and bear market regimes",
          "It is legally required by market regulators to determine company taxes",
          "It is the average price of all stocks on the exchange combined",
          "It resets to zero at the beginning of each calendar month"
        ],
        correct: 0,
        explanation: "Major pension funds and algorithmic funds only hold long exposure in stocks trading above their 200 EMA baseline."
      },
      {
        question: "7. What is a 'Death Cross'?",
        options: [
          "The 50-day moving average crosses below the 200-day moving average, signaling long-term bearish trend continuation",
          "A company defaulting on 100% of its corporate bond debt",
          "The stock exchange shutting down due to an electrical blackout",
          "A trader losing their password to their brokerage account"
        ],
        correct: 0,
        explanation: "The Death Cross marks the breakdown of intermediate momentum below long-term trend support."
      },
      {
        question: "8. What is the danger of cluttering your chart with 10 different indicators (RSI, MACD, Bollinger Bands, Stochastic, etc.) simultaneously?",
        options: [
          "Analysis Paralysis: Conflicting indicators lead to hesitation, late entries, and missed high-probability price action setups",
          "It automatically increases broker commissions per trade",
          "It causes the stock price to stop fluctuating",
          "Indicators cancel each other out on the exchange servers"
        ],
        correct: 0,
        explanation: "Indicator redundancy causes cognitive overload. Clean price action with 1-2 complementary tools yields superior execution clarity."
      }
    ]
  },
  {
    id: "ch-7-order-execution",
    chapter_num: 7,
    title: "Chapter 7: Trading Execution & Order Types",
    subtitle: "Market vs Limit vs Stop-Loss Limit, Slippage, Bid-Ask Spread, Intraday vs Delivery",
    estimated_mins: 20,
    sections: [
      {
        id: "s1",
        title: "1. Market, Limit, SL, and SL-M Orders",
        content: `### Order Execution Architecture

1. **Market Order**: Fills instantly at the best available Ask (for buys) or Bid (for sells). Prone to slippage in fast markets.
2. **Limit Order**: Sets an exact price ceiling or floor. Guarantees price precision, but order may not fill if price runs away.
3. **Stop-Loss Limit (SL-L)**: Has both a Trigger Price and a Limit Price to protect capital against sudden gap downs.`
      },
      {
        id: "s2",
        title: "2. Product Types: MIS (Intraday) vs CNC (Delivery)",
        content: `### Cash Delivery vs Margin Intraday

- **CNC (Cash and Carry)**: 100% upfront cash paid. Shares are delivered directly into your Demat account for long-term compounding.
- **MIS (Margin Intraday Square-off)**: Leveraged intraday trading. Automatically auto-squared off by the broker at 3:15 PM IST.`
      }
    ],
    quiz: [
      {
        question: "1. Which product code must an investor choose in India to ensure bought shares are legally transferred into their Demat account?",
        options: [
          "CNC (Cash and Carry / Delivery)",
          "MIS (Margin Intraday Square-off)",
          "CO (Cover Order)",
          "AMO (After Market Order)"
        ],
        correct: 0,
        explanation: "CNC ensures delivery of shares into your electronic Demat account."
      },
      {
        question: "2. What is 'Slippage' during order execution?",
        options: [
          "The difference between the expected price of a trade and the actual price at which the order executes in the order book",
          "The commission fee charged by the depository participant",
          "The physical delay in broadband fiber cables",
          "The tax paid on dividend distributions"
        ],
        correct: 0,
        explanation: "Slippage occurs when market orders sweep through available liquidity levels in volatile or illiquid markets."
      },
      {
        question: "3. What is the 'Bid-Ask Spread'?",
        options: [
          "The difference between the highest price a buyer is willing to pay (Bid) and the lowest price a seller is willing to accept (Ask)",
          "The total range between the 52-week high and 52-week low",
          "The brokerage fee split between buyer and seller",
          "The difference in price between BSE and NSE"
        ],
        correct: 0,
        explanation: "The Bid-Ask spread represents the market maker's margin and the cost of immediate liquidity."
      },
      {
        question: "4. Why is a Stop-Loss Limit (SL-L) order generally safer than a Stop-Loss Market (SL-M) order in illiquid contracts?",
        options: [
          "It prevents catastrophic fills at extreme rogue prices during liquidity vacuums by establishing a maximum slippage limit",
          "It guarantees that the trade will make 100% profit",
          "It allows you to trade without maintaining cash in your account",
          "It stops market volatility completely"
        ],
        correct: 0,
        explanation: "SL-M orders execute at whatever price exists next, which can cause severe slippage in volatile or thin markets."
      },
      {
        question: "5. What happens to open MIS (Margin Intraday) trading positions at 3:15 PM IST on the National Stock Exchange?",
        options: [
          "The broker's automated risk-management system automatically squares off the positions at current market prices",
          "The shares are permanently gifted to the exchange",
          "The positions are converted to physical paper share certificates",
          "Trading continues for another 24 hours without closing"
        ],
        correct: 0,
        explanation: "MIS trades are intraday margin positions that require mandatory auto-square-off before the market close."
      },
      {
        question: "6. What is an After Market Order (AMO)?",
        options: [
          "An order placed outside regular market hours that enters the exchange queue when the market opens next morning",
          "A trade executed in black market cash",
          "A purchase of shares directly from company employees",
          "A contract that only settles on holidays"
        ],
        correct: 0,
        explanation: "AMOs allow investors to queue up orders during evenings or weekends for execution at the 9:15 AM market open."
      },
      {
        question: "7. What is 'Market Depth' (Level 2 Data)?",
        options: [
          "A real-time window displaying the top 5 (or 20) pending bid and ask prices along with the exact share quantities waiting to be filled",
          "The physical depth of the undersea fiber optic internet cables",
          "The total debt of all listed companies on the exchange",
          "The number of active retail traders in a state"
        ],
        correct: 0,
        explanation: "Market depth visualizes immediate resting order book liquidity above and below current market price."
      },
      {
        question: "8. If you want to buy a stock ONLY at ₹150 or lower, and the stock is currently trading at ₹152, which order type should you place?",
        options: [
          "Buy Limit Order @ ₹150",
          "Buy Market Order",
          "Sell Stop-Loss Order @ ₹152",
          "Cover Order without limit"
        ],
        correct: 0,
        explanation: "A Buy Limit order guarantees you will pay ₹150 or better, and will not fill unless the price drops to ₹150."
      }
    ]
  },
  {
    id: "ch-8-fundamental-analysis",
    chapter_num: 8,
    title: "Chapter 8: Fundamental Analysis & Financial Statements",
    subtitle: "Balance sheet reading, P&L statements, free cash flow, and economic moats",
    estimated_mins: 30,
    sections: [
      {
        id: "s1",
        title: "1. Reading the Three Core Financial Statements",
        content: `### The Three Financial Statements

1. **Balance Sheet**: Snapshot of what the company owns (**Assets**) and what it owes (**Liabilities & Debt**).
2. **Profit & Loss (P&L)**: Revenue -> Operating Margin -> EBITDA -> Net Profit After Tax.
3. **Cash Flow Statement**: Net cash actually received. A company can show accounting profit on P&L while running out of real cash on the Cash Flow Statement!`
      },
      {
        id: "s2",
        title: "2. Free Cash Flow (FCF) & Economic Moats",
        content: `### The Warren Buffett Moat Principle

$$\text{Free Cash Flow} = \text{Operating Cash Flow} - \text{Capital Expenditures (Capex)}$$

A company with positive growing Free Cash Flow and a strong **Economic Moat** (pricing power, high switching costs, brand monopoly) creates unbeatable multi-decade compounding.`
      }
    ],
    quiz: [
      {
        question: "1. Why is Free Cash Flow (FCF) often considered a more reliable health indicator than accounting Net Profit?",
        options: [
          "It tracks actual cold cash generated after all capital expenditures, eliminating accounting adjustments and non-cash entries",
          "Free Cash Flow is legally exempt from all audit checks",
          "Net Profit cannot be converted into rupees",
          "Free Cash Flow is set by the central bank"
        ],
        correct: 0,
        explanation: "Free Cash Flow represents real distributable cash generated by operations after reinvestment in assets."
      },
      {
        question: "2. What is the fundamental accounting equation represented on every corporate Balance Sheet?",
        options: [
          "Assets = Liabilities + Shareholders' Equity",
          "Assets = Revenue × Stock Price",
          "Liabilities = Net Profit - Taxes",
          "Equity = Total Volume / Shares"
        ],
        correct: 0,
        explanation: "Assets must always equal total liabilities (borrowings) plus shareholders' equity (net worth)."
      },
      {
        question: "3. What is an 'Economic Moat' in fundamental equity research?",
        options: [
          "A durable competitive advantage that protects a company's market share and high profit margins from competing rivals",
          "A physical water barrier constructed around corporate headquarters",
          "A government subsidy paid only to agricultural firms",
          "A high dividend yield paid on preference shares"
        ],
        correct: 0,
        explanation: "Economic moats (brand loyalty, network effects, high switching costs, patents) protect compounding profits."
      },
      {
        question: "4. What does a Debt-to-Equity (D/E) ratio greater than 3.0x signal in a cyclical capital-intensive business?",
        options: [
          "High financial leverage risk; heavy interest obligations could threaten solvency during economic downturns",
          "The company is guaranteed to grow 500% next year",
          "The company has no debts and infinite cash",
          "The stock cannot be traded on secondary exchanges"
        ],
        correct: 0,
        explanation: "High D/E ratios magnify bankruptcy risk during periods of rising interest rates or economic contractions."
      },
      {
        question: "5. What is the difference between Operating Profit Margin (OPM) and Net Profit Margin (NPM)?",
        options: [
          "OPM measures profit from core operations before interest and taxes; NPM reflects bottom-line profit after all interest, depreciation, and taxes",
          "OPM is only calculated in US dollars; NPM is in Indian rupees",
          "NPM does not account for cost of raw materials",
          "There is no mathematical difference between them"
        ],
        correct: 0,
        explanation: "OPM reveals pure core business efficiency before debt financing costs and tax deductions."
      },
      {
        question: "6. What is Working Capital?",
        options: [
          "Current Assets minus Current Liabilities (cash, inventory, and receivables available to fund day-to-day operations)",
          "The total salary paid to factory workers",
          "The total market value of all machinery",
          "The money invested in foreign government bonds"
        ],
        correct: 0,
        explanation: "Working Capital = Current Assets - Current Liabilities. It measures short-term liquidity health."
      },
      {
        question: "7. Why is 'Promoter Pledging' (promoters taking personal loans by pledging their company shares as collateral) a major red flag?",
        options: [
          "If the stock price falls, lenders can dump pledged shares in the open market, triggering catastrophic panic crashes",
          "Promoter pledging is strictly illegal under all global laws",
          "It forces the company to shut down its website",
          "It automatically cancels dividend payments forever"
        ],
        correct: 0,
        explanation: "Margin calls on pledged shares create sudden institutional supply shocks that can collapse stock prices."
      },
      {
        question: "8. What is Return on Capital Employed (ROCE)?",
        options: [
          "EBIT divided by Total Capital Employed (Total Assets - Current Liabilities), measuring how efficiently total capital generates operating profits",
          "The percentage of shares owned by retail investors",
          "The total annual bonus paid to board members",
          "The tax rate on short-term capital gains"
        ],
        correct: 0,
        explanation: "ROCE measures total capital efficiency across both equity and debt capital sources."
      }
    ]
  },
  {
    id: "ch-9-derivatives-options",
    chapter_num: 9,
    title: "Chapter 9: Derivatives — Futures & Options (F&O)",
    subtitle: "Derivatives mechanics, Call (CE) vs Put (PE), strike prices, time decay (Theta), and risk",
    estimated_mins: 30,
    sections: [
      {
        id: "s1",
        title: "1. What are Derivatives? Hedging vs Speculation",
        content: `### Derivatives Fundamentals

A derivative is a financial contract whose value is derived from an underlying asset (e.g., Nifty 50, Reliance stock, Gold).

- **Futures**: Contract obligating buyer and seller to transact at a predetermined future date and price.
- **Options**: Contract giving the buyer the **right, but not obligation**, to buy (**Call Option - CE**) or sell (**Put Option - PE**) at a set Strike Price.`
      },
      {
        id: "s2",
        title: "2. The Option Greeks & Time Decay (Theta)",
        content: `### Why 90%+ of Retail Option Buyers Lose Capital

Options are a decaying asset:
- **Theta Decay**: Every hour that passes, out-of-the-money options lose value automatically even if the stock price does not move!
- Professional institutional players sell options or use multi-leg hedged spreads rather than gambling on naked out-of-the-money calls.`
      }
    ],
    quiz: [
      {
        question: "1. What is the primary risk facing naked retail Call (CE) and Put (PE) option buyers?",
        options: [
          "Time Decay (Theta): The option contract value decays towards zero every day until expiry",
          "Options never expire",
          "Brokers seize company shares automatically",
          "Options have guaranteed fixed returns"
        ],
        correct: 0,
        explanation: "Theta decay erodes the premium of options as the expiration date approaches."
      },
      {
        question: "2. What is the legal difference between a Futures contract and an Options contract?",
        options: [
          "Futures create a mandatory obligation to settle for both parties; Options give the buyer the right without mandatory obligation",
          "Futures are only traded in physical gold bars",
          "Options can only be traded by government employees",
          "There is no difference in their legal settlement"
        ],
        correct: 0,
        explanation: "Futures require mandatory fulfillment; option buyers purchase the right, not the obligation, to exercise."
      },
      {
        question: "3. If you believe the Nifty 50 index will rally sharply over the next 5 days, which standard derivative position expresses a bullish view?",
        options: [
          "Buy a Call Option (CE) or Buy a Nifty Futures contract",
          "Buy a Put Option (PE)",
          "Sell all equity holdings and convert to cash",
          "Short sell Nifty Futures"
        ],
        correct: 0,
        explanation: "Buying Call options (CE) or Long Futures profits directly from rising price action."
      },
      {
        question: "4. What is the 'Strike Price' in an options contract?",
        options: [
          "The pre-agreed fixed price at which the option holder can buy (Call) or sell (Put) the underlying security",
          "The penalty fee charged for trading after 3:30 PM",
          "The interest rate on overnight bank loans",
          "The highest price a stock reached in 52 weeks"
        ],
        correct: 0,
        explanation: "The strike price is the benchmark execution level agreed upon in the option contract terms."
      },
      {
        question: "5. What does 'In-The-Money' (ITM) mean for a Call Option (CE)?",
        options: [
          "The current spot market price of the stock is trading ABOVE the strike price of the Call option",
          "The stock has dropped to zero",
          "The option has zero intrinsic value",
          "The broker has paid a cash dividend to the option holder"
        ],
        correct: 0,
        explanation: "A Call is ITM when Spot > Strike, meaning it possesses real intrinsic cash value."
      },
      {
        question: "6. What is 'Open Interest' (OI) in derivative analysis?",
        options: [
          "The total number of active, outstanding derivative contracts that have not yet been settled or closed",
          "The bank interest rate on savings accounts",
          "The total volume of shares traded in one second",
          "The percentage of shares held by the general public"
        ],
        correct: 0,
        explanation: "Open Interest tracks total open contract commitment and liquidity clusters across strike prices."
      },
      {
        question: "7. Why did SEBI report that over 93% of individual retail traders lose net money in Futures & Options (F&O)?",
        options: [
          "Excessive leverage, lack of hedging, poor risk management, and fighting against relentless Theta time decay",
          "The stock exchange deliberately manipulates share prices against retail",
          "F&O contracts carry a 90% government penalty tax on entry",
          "Option contracts cannot be closed before expiration"
        ],
        correct: 0,
        explanation: "Retail traders frequently buy cheap out-of-the-money options with high leverage, losing 100% of premium to time decay."
      },
      {
        question: "8. What is 'Implied Volatility' (IV) in options pricing?",
        options: [
          "The market's forward-looking expectation of how violently the underlying stock price will move before expiration",
          "The historical speed of internet transactions",
          "The dividend growth rate of the company",
          "The debt-to-equity ratio of the exchange"
        ],
        correct: 0,
        explanation: "IV reflects market uncertainty and directly expands or contracts the premium price of all option contracts."
      }
    ]
  },
  {
    id: "ch-10-macro-global",
    chapter_num: 10,
    title: "Chapter 10: Macroeconomics & Global Market Analysis",
    subtitle: "Central banks (RBI / Fed), interest rates, inflation, currency, and all-weather portfolio",
    estimated_mins: 30,
    sections: [
      {
        id: "s1",
        title: "1. Central Banks: The Puppet Masters of Liquidity",
        content: `### How Central Banks Move Markets

When Central Banks (**RBI in India, Federal Reserve in the US**) hike interest rates:
- Borrowing costs rise -> Corporate earnings compress -> Equity PE multiples drop.
- Fixed deposits and bond yields rise -> Capital rotates out of risky stocks into guaranteed debt.

When Central Banks cut rates and inject liquidity:
- Borrowing becomes cheap -> Corporate expansions surge -> Equities experience bull market expansions.`
      },
      {
        id: "s2",
        title: "2. Building the All-Weather Institutional Portfolio",
        content: `### The Master Allocation Framework

A truly resilient portfolio balances across 4 uncorrelated asset pillars:
1. **Domestic Equities (50-60%)**: Nifty 50 & Active Large/Mid-cap compounders for growth.
2. **Global Equities & ETFs (15-20%)**: S&P 500 & Nasdaq 100 to hedge currency depreciation against USD.
3. **Gold & Sovereign Gold Bonds (10-15%)**: Safe-haven crisis hedge and inflation protector.
4. **Debt & Liquid Instruments (10-15%)**: Capital preservation and dry powder for deep market crashes.`
      }
    ],
    quiz: [
      {
        question: "1. Why does an investor hold US Dollar-denominated assets (like S&P 500 ETFs) alongside Indian equities?",
        options: [
          "Geographic diversification and hedging against domestic currency depreciation (USD/INR)",
          "US assets never experience bear markets",
          "To avoid all capital gains taxes completely",
          "It is legally mandatory by SEBI"
        ],
        correct: 0,
        explanation: "Holding global assets provides true geographic diversification and gains value when the domestic currency depreciates."
      },
      {
        question: "2. What happens to stock market valuations when central banks aggressively raise benchmark interest rates?",
        options: [
          "Borrowing costs rise, discount rates increase, and equity P/E multiples contract downward",
          "All stocks immediately double in price",
          "Corporate profits expand by 50% automatically",
          "Interest rates have zero correlation with equity prices"
        ],
        correct: 0,
        explanation: "Higher interest rates increase corporate cost of debt and raise the discount rate on future cash flows."
      },
      {
        question: "3. What is the economic relationship between Bond Yields and Equity Valuations?",
        options: [
          "When risk-free government bond yields rise significantly, equities become less attractive on a relative risk-premium basis",
          "Bond yields and stock prices always move in identical directions",
          "Bonds and equities are the exact same financial instrument",
          "Bond yields only affect real estate prices"
        ],
        correct: 0,
        explanation: "Higher risk-free yields increase the opportunity cost of investing in equities, pulling institutional capital toward debt."
      },
      {
        question: "4. What is 'Stagflation'?",
        options: [
          "An economic condition characterized by stagnant low GDP growth combined with persistently high consumer price inflation",
          "A rapid 50% surge in stock market prices across all sectors",
          "A market holiday where all exchanges are closed for one week",
          "A government decree eliminating all income tax"
        ],
        correct: 0,
        explanation: "Stagflation is historically difficult for traditional portfolios because both growth equities and bonds face headwinds."
      },
      {
        question: "5. Why does Gold historically perform well during geopolitical crises and rapid currency debasement?",
        options: [
          "Gold is a tangible safe-haven store of value that carries zero counterparty credit risk and cannot be printed by central banks",
          "Gold pays a guaranteed monthly cash dividend",
          "Gold is required by law to be held by every citizen",
          "Gold only increases in price during election years"
        ],
        correct: 0,
        explanation: "Gold has functioned for thousands of years as the ultimate universal monetary hedge against inflation and crisis."
      },
      {
        question: "6. What is the primary role of the Reserve Bank of India's (RBI) Monetary Policy Committee (MPC)?",
        options: [
          "To set the benchmark Repo Rate to maintain price stability (target 4% CPI inflation) while supporting sustainable GDP growth",
          "To pick the top 10 stocks for retail investors to buy",
          "To set the retail prices of smartphones and automobiles",
          "To manage the private bank accounts of corporate CEOs"
        ],
        correct: 0,
        explanation: "The MPC adjusts policy repo rates to maintain domestic macroeconomic stability and price equilibrium."
      },
      {
        question: "7. How does a sharp rise in international Brent Crude Oil prices affect net oil-importing economies like India?",
        options: [
          "It widens the current account deficit, exerts downward pressure on the domestic currency (INR), and fuels imported inflation",
          "It causes all Indian stocks to rally 20% immediately",
          "It eliminates the need for foreign exchange reserves",
          "It reduces the cost of transportation for all businesses"
        ],
        correct: 0,
        explanation: "Importing expensive crude drains foreign currency reserves and increases domestic transportation and packaging costs."
      },
      {
        question: "8. What is the fundamental premise of an 'All-Weather Portfolio'?",
        options: [
          "Allocating capital across multiple uncorrelated asset classes (Equities, Global Assets, Gold, Debt) so the portfolio compounds steadily across all economic cycles",
          "Investing only in meteorological weather forecasting companies",
          "Putting 100% of capital into high-beta penny stocks during rainstorms",
          "Trading only on sunny days when market sentiment is positive"
        ],
        correct: 0,
        explanation: "Uncorrelated asset allocation minimizes portfolio drawdown during crises while capturing multi-decade compounding growth."
      }
    ]
  }
]

export default function Learn() {
  const [chapters, setChapters] = useState(EMBEDDED_CHAPTERS)
  const [activeChapter, setActiveChapter] = useState(EMBEDDED_CHAPTERS[0])
  const [activeSectionIdx, setActiveSectionIdx] = useState(0)
  const [inQuizMode, setInQuizMode] = useState(false)
  const [userAnswers, setUserAnswers] = useState({})
  const [quizResult, setQuizResult] = useState(null)

  const completedLessons = useStore(s => s.completedLessons)
  const completeLesson = useStore(s => s.completeLesson)
  const totalXP = useStore(s => s.totalXP)

  const loadChapter = (chapterId) => {
    const found = chapters.find(c => c.id === chapterId)
    if (found) {
      setActiveChapter(found)
      setActiveSectionIdx(0)
      setInQuizMode(false)
      setUserAnswers({})
      setQuizResult(null)
    }
  }

  const handleAnswerSelect = (qIdx, optIdx) => {
    setUserAnswers(prev => ({ ...prev, [qIdx]: optIdx }))
  }

  const submitChapterQuiz = () => {
    if (!activeChapter?.quiz) return
    const quiz = activeChapter.quiz
    let correctCount = 0
    const detailed = []

    quiz.forEach((q, idx) => {
      const isCorrect = userAnswers[idx] === q.correct
      if (isCorrect) correctCount++
      detailed.push({
        is_correct: isCorrect,
        explanation: q.explanation
      })
    })

    const score = Math.round((correctCount / quiz.length) * 100)
    const passed = score >= 60

    setQuizResult({
      score,
      passed,
      correctCount,
      total: quiz.length,
      feedback: passed ? "Chapter Mastered! Next chapter unlocked." : "Review the lesson sections and retake to unlock the next chapter.",
      detailed
    })

    if (passed) {
      completeLesson(activeChapter.id, score)
    }
  }

  const isChapterUnlocked = (idx) => {
    if (idx === 0) return true
    const prevChapter = chapters[idx - 1]
    return prevChapter && completedLessons.includes(prevChapter.id)
  }

  const renderMarkdown = (text) => {
    if (!text) return null
    return text.split('\n').map((line, i) => {
      if (line.startsWith('### ')) {
        return <h3 key={i} className="text-lg font-black text-white mt-6 mb-3 border-l-4 border-red-500 pl-3 uppercase tracking-wide">{line.slice(4)}</h3>
      }
      if (line.startsWith('#### ')) {
        return <h4 key={i} className="text-base font-extrabold text-red-400 mt-5 mb-2">{line.slice(5)}</h4>
      }
      if (line.startsWith('> ')) {
        return (
          <div key={i} className="my-4 p-4 rounded-xl bg-red-500/10 border-l-4 border-red-500 text-text-secondary leading-relaxed font-medium">
            {line.slice(2)}
          </div>
        )
      }
      if (line.startsWith('- ')) {
        const itemText = line.slice(2)
        const formatted = itemText
          .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
          .replace(/`(.*?)`/g, '<code class="bg-surface border border-border text-red-400 px-1.5 py-0.5 rounded font-mono text-xs">$1</code>')
        return (
          <li key={i} className="ml-5 mb-2 text-text-secondary leading-relaxed list-disc" dangerouslySetInnerHTML={{ __html: formatted }} />
        )
      }
      if (line.startsWith('```')) {
        return null
      }
      if (line.trim() === '') {
        return <div key={i} className="h-3" />
      }
      const formatted = line
        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
        .replace(/`(.*?)`/g, '<code class="bg-surface border border-border text-red-400 px-1.5 py-0.5 rounded font-mono text-xs">$1</code>')
        .replace(/\\text{(.*?)}/g, '$1')
        .replace(/\\frac{(.*?)}{(.*?)}/g, '($1 / $2)')
        .replace(/\\times/g, '×')
        .replace(/\$/g, '')
      return <p key={i} className="mb-3 text-text-secondary leading-relaxed text-sm" dangerouslySetInnerHTML={{ __html: formatted }} />
    })
  }

  const completedCount = chapters.filter(c => completedLessons.includes(c.id)).length
  const progressPct = chapters.length > 0 ? Math.round((completedCount / chapters.length) * 100) : 0

  return (
    <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[calc(100vh-100px)]">
      
      {/* ── LEFT: Master Course Syllabus & Progress Roadmap (4 Cols) ── */}
      <aside className="md:col-span-4 card rounded-2xl flex flex-col overflow-hidden border border-border bg-surface shadow-xl h-[calc(100vh-100px)] sticky top-0">
        
        {/* Track Header */}
        <div className="p-5 border-b border-border bg-void shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-red-500">Master Track</span>
            <span className="text-xs font-mono font-bold text-white bg-red-500/20 border border-red-500/40 px-2 py-0.5 rounded font-mono">
              {completedCount}/{chapters.length} Cleared
            </span>
          </div>
          <h2 className="text-base font-extrabold text-white">Master Trader Curriculum</h2>
          <p className="text-xs text-text-muted mt-0.5">Sequential progressive mastery from zero</p>
          <div className="mt-3">
            <ProgressBar progress={progressPct} color="red" />
          </div>
        </div>

        {/* Chapters List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y-0">
          {chapters.map((ch, idx) => {
            const unlocked = isChapterUnlocked(idx)
            const isCompleted = completedLessons.includes(ch.id)
            const isCurrent = activeChapter?.id === ch.id

            return (
              <div
                key={ch.id}
                onClick={() => unlocked && loadChapter(ch.id)}
                className={`p-3.5 rounded-xl transition-all duration-200 flex items-start gap-3 border ${
                  isCurrent
                    ? 'bg-red-500/15 border-red-500/50 shadow-md shadow-red-500/10'
                    : isCompleted
                    ? 'bg-void/60 border-white/10 hover:border-red-500/30 cursor-pointer'
                    : unlocked
                    ? 'bg-void/40 border-border hover:border-red-500/30 cursor-pointer'
                    : 'bg-void/20 border-transparent opacity-40 cursor-not-allowed'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isCompleted ? (
                    <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-xs shadow-sm shadow-red-500/40">
                      ✓
                    </div>
                  ) : unlocked ? (
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-extrabold text-xs border ${
                      isCurrent ? 'border-red-500 text-red-400 bg-red-500/10' : 'border-border text-text-muted'
                    }`}>
                      {ch.chapter_num}
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border border-border/40 flex items-center justify-center text-text-dim">
                      <Lock size={12} />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-text-dim uppercase tracking-wider">Chapter {ch.chapter_num}</span>
                    <span className="text-[10px] font-mono text-text-muted">{ch.estimated_mins}m</span>
                  </div>
                  <h4 className={`text-xs font-bold truncate mt-0.5 ${isCurrent ? 'text-white' : 'text-text-secondary'}`}>
                    {ch.title.replace(/^Chapter \d+:\s*/, '')}
                  </h4>
                  <div className="text-[10px] text-text-dim font-mono mt-0.5">
                    {ch.quiz.length} Questions Assessment
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom Tier Status */}
        <div className="p-4 border-t border-border bg-void text-xs font-mono flex items-center justify-between shrink-0">
          <span className="text-text-muted">Total XP Earned:</span>
          <span className="font-bold text-red-400">+{totalXP} XP</span>
        </div>
      </aside>

      {/* ── RIGHT: Deep Full-Page Interactive Lesson Reader (8 Cols) ── */}
      <main className="md:col-span-8 card rounded-2xl flex flex-col overflow-hidden border border-border bg-surface shadow-2xl h-[calc(100vh-100px)]">
        
        {inQuizMode ? (
          
          /* ── Chapter Assessment Mode ── */
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-border bg-void flex items-center justify-between shrink-0">
              <div>
                <span className="text-xs font-mono text-red-500 uppercase tracking-widest font-bold">Chapter Assessment · {activeChapter.quiz.length} Questions</span>
                <h2 className="text-xl font-extrabold text-white mt-1">{activeChapter.title} — Evaluation Test</h2>
              </div>
              <button
                onClick={() => setInQuizMode(false)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-mono text-text-muted hover:text-white font-bold"
              >
                ← Return to Lesson
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
              {quizResult ? (
                /* Result Screen */
                <div className="max-w-xl mx-auto py-8 text-center space-y-5">
                  <div className={`w-28 h-28 rounded-full mx-auto flex items-center justify-center border-4 shadow-xl ${
                    quizResult.passed ? 'bg-red-500/20 border-red-500 text-white shadow-red-500/20' : 'bg-surface border-border text-text-muted'
                  }`}>
                    <span className="text-4xl font-black font-mono">{quizResult.score}%</span>
                  </div>
                  <h3 className="text-2xl font-black text-white">
                    {quizResult.passed ? '🏆 Chapter Cleared & Certified!' : '📚 Review Required'}
                  </h3>
                  <p className="text-text-secondary leading-relaxed">
                    You answered {quizResult.correctCount} out of {quizResult.total} questions correctly ({quizResult.score}%). {quizResult.feedback}
                  </p>
                  
                  {/* Detailed Explanations */}
                  <div className="text-left space-y-4 pt-6">
                    <h4 className="text-xs font-mono uppercase tracking-widest text-text-muted font-bold">Complete Question Breakdown</h4>
                    {quizResult.detailed?.map((d, idx) => (
                      <div key={idx} className={`p-4 rounded-xl border ${d.is_correct ? 'bg-void border-white/20' : 'bg-red-500/10 border-red-500/30'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          {d.is_correct ? <Check size={16} className="text-white" /> : <X size={16} className="text-red-400" />}
                          <span className="font-bold text-xs text-white">Question {idx + 1}: {d.is_correct ? 'Correct' : 'Needs Review'}</span>
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed mt-1 font-medium">{d.explanation}</p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-6 flex gap-4 justify-center">
                    <button
                      onClick={() => {
                        setUserAnswers({})
                        setQuizResult(null)
                      }}
                      className="px-6 py-3.5 rounded-xl border border-border text-white font-bold hover:border-red-500"
                    >
                      Retake Test
                    </button>
                    {quizResult.passed && (
                      <button
                        onClick={() => {
                          const currIdx = chapters.findIndex(c => c.id === activeChapter.id)
                          if (currIdx < chapters.length - 1) {
                            loadChapter(chapters[currIdx + 1].id)
                          } else {
                            setInQuizMode(false)
                          }
                        }}
                        className="px-8 py-3.5 rounded-xl bg-red-gradient text-white font-extrabold shadow-lg shadow-red-500/30 flex items-center gap-2"
                      >
                        Next Chapter <ArrowRight size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* Question List */
                <div className="max-w-2xl mx-auto space-y-6">
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between text-xs font-mono">
                    <span className="text-red-400 font-bold">Progress: {Object.keys(userAnswers).length} of {activeChapter.quiz.length} Answered</span>
                    <span className="text-text-muted">Passing Grade: 60%</span>
                  </div>

                  {activeChapter.quiz.map((q, qIdx) => (
                    <div key={qIdx} className="card p-6 rounded-2xl border border-border bg-void/70 space-y-4">
                      <div className="flex items-center justify-between text-xs font-mono text-text-dim">
                        <span className="text-red-400 font-bold uppercase tracking-wider">Question {qIdx + 1} of {activeChapter.quiz.length}</span>
                        {userAnswers[qIdx] !== undefined && (
                          <span className="text-white font-bold flex items-center gap-1">
                            <Check size={12} className="text-red-500" /> Answered
                          </span>
                        )}
                      </div>
                      <p className="text-base font-bold text-white leading-snug">{q.question}</p>
                      <div className="space-y-2.5">
                        {q.options.map((opt, oIdx) => {
                          const isSelected = userAnswers[qIdx] === oIdx
                          return (
                            <button
                              key={oIdx}
                              onClick={() => handleAnswerSelect(qIdx, oIdx)}
                              className={`w-full text-left p-4 rounded-xl border text-sm transition-all flex items-start gap-3.5 ${
                                isSelected
                                  ? 'border-red-500 bg-red-500/20 text-white font-bold shadow-md shadow-red-500/10'
                                  : 'border-border hover:border-red-500/40 text-text-secondary hover:bg-white/5'
                              }`}
                            >
                              <span className="w-5 h-5 rounded-full border border-current/40 flex items-center justify-center text-xs shrink-0 mt-0.5 font-bold font-mono">
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <span className="leading-relaxed">{opt}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}

                  <div className="pt-4 sticky bottom-0 bg-surface/95 backdrop-blur p-4 border-t border-border flex justify-end">
                    <button
                      onClick={submitChapterQuiz}
                      disabled={Object.keys(userAnswers).length < activeChapter.quiz.length}
                      className="w-full md:w-auto px-10 py-4 rounded-xl bg-red-gradient text-white font-extrabold uppercase tracking-wider text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity shadow-lg shadow-red-500/30"
                    >
                      Submit All {activeChapter.quiz.length} Answers For Evaluation
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          
          /* ── Full Interactive Reading Mode ── */
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Top Chapter Header */}
            <div className="p-6 border-b border-border bg-void shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-red-500 uppercase tracking-widest font-extrabold">
                  Chapter {activeChapter.chapter_num} of {chapters.length}
                </span>
                <span className="text-xs font-mono text-text-muted flex items-center gap-1">
                  ⏱️ {activeChapter.estimated_mins} mins deep dive · {activeChapter.quiz.length} Questions Assessment
                </span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">{activeChapter.title}</h1>
              <p className="text-sm text-text-secondary mt-1">{activeChapter.subtitle}</p>

              {/* Section Tabs */}
              <div className="flex gap-2 mt-5 overflow-x-auto pb-1 scrollbar-none">
                {activeChapter.sections.map((sec, idx) => (
                  <button
                    key={sec.id}
                    onClick={() => setActiveSectionIdx(idx)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      activeSectionIdx === idx
                        ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                        : 'text-text-muted border border-border hover:border-red-500/40 hover:text-white bg-surface'
                    }`}
                  >
                    {sec.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Reading Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
              <div className="max-w-3xl mx-auto">
                <div className="border-b border-border pb-4 mb-6">
                  <span className="text-xs font-mono text-text-dim uppercase tracking-widest">Section {activeSectionIdx + 1}</span>
                  <h2 className="text-xl font-extrabold text-white mt-1">
                    {activeChapter.sections[activeSectionIdx]?.title}
                  </h2>
                </div>

                {/* Section Markdown Content */}
                <div className="prose-invert max-w-none">
                  {renderMarkdown(activeChapter.sections[activeSectionIdx]?.content)}
                </div>

                {/* Section Navigation & Bottom Bar */}
                <div className="mt-12 pt-6 border-t border-border flex items-center justify-between gap-4">
                  <button
                    onClick={() => setActiveSectionIdx(prev => Math.max(0, prev - 1))}
                    disabled={activeSectionIdx === 0}
                    className="px-5 py-3 rounded-xl border border-border text-xs font-mono font-bold text-text-muted hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <ArrowLeft size={14} /> Previous Section
                  </button>

                  {activeSectionIdx < activeChapter.sections.length - 1 ? (
                    <button
                      onClick={() => setActiveSectionIdx(prev => prev + 1)}
                      className="px-6 py-3 rounded-xl bg-surface border border-red-500/40 text-white text-xs font-mono font-bold hover:bg-red-500/20 flex items-center gap-2 transition-all"
                    >
                      Next Section <ArrowRight size={14} />
                    </button>
                  ) : (
                    <button
                      onClick={() => setInQuizMode(true)}
                      className="px-8 py-3.5 rounded-xl bg-red-gradient text-white text-xs font-mono font-extrabold uppercase tracking-wider hover:opacity-90 shadow-lg shadow-red-500/30 flex items-center gap-2"
                    >
                      Take {activeChapter.quiz.length}-Question Chapter Assessment <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
