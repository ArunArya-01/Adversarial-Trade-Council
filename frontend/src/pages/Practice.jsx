import { useState, useEffect, useRef } from 'react'
import { Target, Play, Pause, SkipForward, RotateCcw, TrendingUp, TrendingDown, ShieldAlert, Zap, CheckCircle2, XCircle, ArrowUpRight, ArrowDownRight, DollarSign, Activity, MessageSquareQuote, Send, Sparkles, HelpCircle, Bot, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../store/useStore'
import ProgressBar from '../components/ui/ProgressBar'

const SCENARIO_STOCKS = [
  {
    id: 'infy-earnings',
    symbol: 'INFY',
    name: 'Infosys Ltd.',
    market: 'NSE · Equity',
    difficulty: 'Beginner',
    context: 'Infosys beat Q2 estimates (Profit +24% YoY) and raised full-year guidance to 6.5-7%. Stock is breaking out of a 3-week consolidation at ₹1,480.',
    initialPrice: 1480,
    candles: [
      { time: '09:15', open: 1465, high: 1475, low: 1460, close: 1472, volume: 12000 },
      { time: '09:30', open: 1472, high: 1478, low: 1468, close: 1470, volume: 15400 },
      { time: '09:45', open: 1470, high: 1482, low: 1469, close: 1480, volume: 28000 },
      { time: '10:00', open: 1480, high: 1488, low: 1478, close: 1485, volume: 34000 },
      { time: '10:15', open: 1485, high: 1494, low: 1482, close: 1490, volume: 41000 },
      { time: '10:30', open: 1490, high: 1505, low: 1488, close: 1502, volume: 55000 },
      { time: '10:45', open: 1502, high: 1515, low: 1498, close: 1510, volume: 62000 },
      { time: '11:00', open: 1510, high: 1522, low: 1506, close: 1518, volume: 48000 },
      { time: '11:15', open: 1518, high: 1530, low: 1515, close: 1528, volume: 51000 },
      { time: '11:30', open: 1528, high: 1538, low: 1522, close: 1535, volume: 45000 },
      { time: '11:45', open: 1535, high: 1545, low: 1530, close: 1542, volume: 39000 },
    ],
    initialCount: 5,
    optimalAction: 'BUY',
    targetPrice: 1530,
    stopLossPrice: 1465,
    lesson: 'Guidance raises force institutional analysts to revise model price targets upward, providing sustained multi-hour buying tailwinds.'
  },
  {
    id: 'nifty-support-bounce',
    symbol: 'NIFTY 50',
    name: 'Nifty Benchmark Index',
    market: 'NSE · Index',
    difficulty: 'Intermediate',
    context: 'Nifty pulled back 400 points to test its major 50-day EMA support at 24,100. A Hammer rejection candle just formed with massive institutional buying absorption.',
    initialPrice: 24120,
    candles: [
      { time: 'Day 1', open: 24450, high: 24480, low: 24320, close: 24350, volume: 180000 },
      { time: 'Day 2', open: 24350, high: 24380, low: 24200, close: 24220, volume: 210000 },
      { time: 'Day 3', open: 24220, high: 24260, low: 24080, close: 24100, volume: 290000 },
      { time: 'Day 4', open: 24100, high: 24180, low: 24050, close: 24120, volume: 340000 },
      { time: 'Day 5', open: 24120, high: 24280, low: 24100, close: 24250, volume: 310000 },
      { time: 'Day 6', open: 24250, high: 24390, low: 24220, close: 24360, volume: 280000 },
      { time: 'Day 7', open: 24360, high: 24480, low: 24310, close: 24450, volume: 260000 },
      { time: 'Day 8', open: 24450, high: 24580, low: 24420, close: 24550, volume: 295000 },
      { time: 'Day 9', open: 24550, high: 24650, low: 24510, close: 24620, volume: 320000 },
    ],
    initialCount: 4,
    optimalAction: 'BUY',
    targetPrice: 24450,
    stopLossPrice: 24040,
    lesson: 'Testing the 50 EMA with high volume lower wicks creates high-probability institutional rebound setups.'
  },
  {
    id: 'hdfc-breakdown',
    symbol: 'HDFCBANK',
    name: 'HDFC Bank Ltd.',
    market: 'NSE · Banking',
    difficulty: 'Intermediate',
    context: 'HDFC Bank broke below its multi-week horizontal support of ₹1,620 on high institutional selling volume following a margin squeeze disclosure.',
    initialPrice: 1610,
    candles: [
      { time: '10:00', open: 1635, high: 1640, low: 1630, close: 1632, volume: 45000 },
      { time: '10:15', open: 1632, high: 1634, low: 1622, close: 1624, volume: 52000 },
      { time: '10:30', open: 1624, high: 1625, low: 1618, close: 1620, volume: 68000 },
      { time: '10:45', open: 1620, high: 1621, low: 1608, close: 1610, volume: 94000 },
      { time: '11:00', open: 1610, high: 1612, low: 1595, close: 1598, volume: 88000 },
      { time: '11:15', open: 1598, high: 1602, low: 1588, close: 1590, volume: 76000 },
      { time: '11:30', open: 1590, high: 1592, low: 1578, close: 1580, volume: 81000 },
      { time: '11:45', open: 1580, high: 1584, low: 1570, close: 1572, volume: 72000 },
      { time: '12:00', open: 1572, high: 1575, low: 1560, close: 1565, volume: 65000 },
    ],
    initialCount: 4,
    optimalAction: 'SELL',
    targetPrice: 1580,
    stopLossPrice: 1628,
    lesson: 'When heavy volume breaks a critical support floor, previous buyers are trapped and forced to liquidate, driving rapid downward continuation.'
  },
  {
    id: 'aapl-breakout',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    market: 'NASDAQ · Global Tech',
    difficulty: 'Expert',
    context: 'Apple broke above its all-time high resistance of $182 following keynote announcement of on-device neural AI models with high opening volume.',
    initialPrice: 184,
    candles: [
      { time: '09:30', open: 180, high: 182, low: 179, close: 181, volume: 150000 },
      { time: '10:00', open: 181, high: 183, low: 180, close: 182.5, volume: 220000 },
      { time: '10:30', open: 182.5, high: 185, low: 182, close: 184, volume: 340000 },
      { time: '11:00', open: 184, high: 187, low: 183.5, close: 186.5, volume: 290000 },
      { time: '11:30', open: 186.5, high: 189, low: 185.8, close: 188.2, volume: 260000 },
      { time: '12:00', open: 188.2, high: 191, low: 187.5, close: 190.4, volume: 310000 },
      { time: '12:30', open: 190.4, high: 193, low: 189.8, close: 192.5, volume: 280000 },
    ],
    initialCount: 3,
    optimalAction: 'BUY',
    targetPrice: 190,
    stopLossPrice: 181,
    lesson: 'All-time high breakouts have zero overhead resistance supply, allowing sustained institutional trend expansion.'
  }
]

// Quick Knowledge Doubts Database for instant high-intelligence responses
const DOUBT_KNOWLEDGE = {
  'what is a stop loss': 'A **Stop-Loss (SL)** is an automatic exit order placed at a predetermined price to limit your maximum loss on a trade. For example, if you buy INFY at ₹1,480, setting an SL at ₹1,465 ensures that if the market drops, you automatically exit with only a ₹15/share loss rather than risking a huge drawdown.',
  'how does shorting work': '**Short Selling (SELL / SHORT)** is a way to profit when a stock price falls. You sell shares at a high price (e.g. ₹1,610) with the intention of buying them back later at a cheaper price (e.g. ₹1,580). The difference (₹30/share) is your profit.',
  'why do candles have wicks': 'The **wicks (shadows)** show the highest and lowest prices reached during that time period. A **long lower wick** means sellers tried to push the price down, but buyers stepped in forcefully to push it back up (Bullish rejection). A **long upper wick** means buyers tried to push up, but sellers dumped it down (Bearish rejection).',
  'how to calculate position size': 'Use the **1% Risk Rule**: Position Size = `(Total Capital × 1%) / (Entry Price - Stop Loss Price)`. On a ₹15,000 account, your 1% risk is ₹150. If your risk per share is ₹15 (₹1,480 - ₹1,465), you should buy exactly `150 / 15 = 10 shares`.',
  'what does bullish and bearish mean': '**Bullish** means market participants expect the price to rise (buyers are dominant). **Bearish** means market participants expect the price to fall (sellers are dominant).',
  'why is earnings guidance important': 'Quarterly earnings show past profit, but **Guidance** shows what management expects for future growth. An upgraded guidance forces institutional hedge funds and mutual funds to raise their mathematical target models, creating sustained multi-day buying demand.'
}

export default function Practice() {
  const [activeScenario, setActiveScenario] = useState(SCENARIO_STOCKS[0])
  const [revealedCount, setRevealedCount] = useState(SCENARIO_STOCKS[0].initialCount)
  const [isPlaying, setIsPlaying] = useState(false)
  const [replaySpeed, setReplaySpeed] = useState(1500)
  const [hoveredCandle, setHoveredCandle] = useState(null)

  // Right Panel Tabs: 'order' or 'doubts'
  const [activeTab, setActiveTab] = useState('order')

  // Trading State
  const [tradeQuantity, setTradeQuantity] = useState(10)
  const [stopLossInput, setStopLossInput] = useState('')
  const [targetInput, setTargetInput] = useState('')
  const [openPosition, setOpenPosition] = useState(null)
  const [tradeHistory, setTradeHistory] = useState([])
  const [tradeOutcome, setTradeOutcome] = useState(null)

  // Doubt Box State
  const [doubtMessages, setDoubtMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: '👋 Welcome to the Trading Practice Copilot! I am here to clear any doubts you have about candlestick charts, order execution, stop-loss strategy, or market catalysts. Ask me anything or select a quick question below!'
    }
  ])
  const [doubtInput, setDoubtInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const chatBottomRef = useRef(null)

  const portfolio = useStore(s => s.portfolio)
  const updatePortfolio = useStore(s => s.updatePortfolio)
  const resetPortfolio = useStore(s => s.resetPortfolio)
  const totalXP = useStore(s => s.totalXP)

  const timerRef = useRef(null)

  // Load Scenario
  const selectScenario = (sc) => {
    setActiveScenario(sc)
    setRevealedCount(sc.initialCount)
    setIsPlaying(false)
    setOpenPosition(null)
    setTradeOutcome(null)
    setStopLossInput(String(sc.stopLossPrice))
    setTargetInput(String(sc.targetPrice))
  }

  // Current visible candles
  const visibleCandles = activeScenario.candles.slice(0, revealedCount)
  const currentCandle = visibleCandles[visibleCandles.length - 1]
  const currentPrice = currentCandle?.close || activeScenario.initialPrice

  // Replay Advance Step
  const stepForward = () => {
    if (revealedCount < activeScenario.candles.length) {
      setRevealedCount(prev => prev + 1)
    } else {
      setIsPlaying(false)
    }
  }

  // Play / Pause loop
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setRevealedCount(prev => {
          if (prev < activeScenario.candles.length) {
            return prev + 1
          } else {
            setIsPlaying(false)
            return prev
          }
        })
      }, replaySpeed)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [isPlaying, replaySpeed, activeScenario])

  // Check Position Target / Stop-Loss on candle updates
  useEffect(() => {
    if (!openPosition || openPosition.closed) return

    const price = currentPrice
    const pos = openPosition

    // Target Hit
    if (pos.direction === 'BUY' && price >= pos.target) {
      closePosition(price, 'Target Reached 🎯')
    } else if (pos.direction === 'SELL' && price <= pos.target) {
      closePosition(price, 'Target Reached 🎯')
    }
    // Stop Loss Hit
    else if (pos.direction === 'BUY' && price <= pos.stopLoss) {
      closePosition(price, 'Stop-Loss Triggered 🛑')
    } else if (pos.direction === 'SELL' && price >= pos.stopLoss) {
      closePosition(price, 'Stop-Loss Triggered 🛑')
    }
  }, [revealedCount, currentPrice])

  // Execute Order
  const executeOrder = (direction) => {
    const sl = parseFloat(stopLossInput) || (direction === 'BUY' ? currentPrice * 0.98 : currentPrice * 1.02)
    const tp = parseFloat(targetInput) || (direction === 'BUY' ? currentPrice * 1.04 : currentPrice * 0.96)
    const cost = tradeQuantity * currentPrice

    if (cost > portfolio.cash && direction === 'BUY') {
      alert('Insufficient virtual cash! Reduce quantity.')
      return
    }

    const newPos = {
      symbol: activeScenario.symbol,
      direction,
      quantity: tradeQuantity,
      entryPrice: currentPrice,
      stopLoss: sl,
      target: tp,
      openedAt: currentCandle.time,
      closed: false
    }

    setOpenPosition(newPos)
    setTradeOutcome(null)
    setIsPlaying(true)
  }

  // Close Position
  const closePosition = (exitPrice, reason) => {
    if (!openPosition) return
    const pos = openPosition
    const pnl = pos.direction === 'BUY'
      ? (exitPrice - pos.entryPrice) * pos.quantity
      : (pos.entryPrice - exitPrice) * pos.quantity
    const pnlPct = ((exitPrice - pos.entryPrice) / pos.entryPrice) * (pos.direction === 'BUY' ? 100 : -100)

    const newCash = portfolio.cash + pnl
    const newTotal = portfolio.totalValue + pnl

    updatePortfolio({
      cash: newCash,
      totalValue: newTotal,
      pnl: newTotal - 15000,
      pnlPct: ((newTotal - 15000) / 15000) * 100
    })

    const completedTrade = {
      ...pos,
      exitPrice,
      pnl,
      pnlPct,
      reason,
      closedAt: currentCandle.time,
      isOptimal: pos.direction === activeScenario.optimalAction
    }

    setTradeHistory(prev => [completedTrade, ...prev])
    setOpenPosition(null)
    setIsPlaying(false)
    setTradeOutcome(completedTrade)
  }

  // Handle Doubt Box Question Submission
  const handleSendDoubt = (questionText) => {
    const q = (questionText || doubtInput).trim()
    if (!q) return

    const userMsg = { id: Date.now(), sender: 'user', text: q }
    setDoubtMessages(prev => [...prev, userMsg])
    setDoubtInput('')
    setIsTyping(true)

    setTimeout(() => {
      let answer = ''
      const lower = q.toLowerCase()

      if (lower.includes('stop loss') || lower.includes('sl')) {
        answer = DOUBT_KNOWLEDGE['what is a stop loss']
      } else if (lower.includes('short') || lower.includes('sell')) {
        answer = DOUBT_KNOWLEDGE['how does shorting work']
      } else if (lower.includes('wick') || lower.includes('shadow') || lower.includes('candle')) {
        answer = DOUBT_KNOWLEDGE['why do candles have wicks']
      } else if (lower.includes('position') || lower.includes('quantity') || lower.includes('shares')) {
        answer = DOUBT_KNOWLEDGE['how to calculate position size']
      } else if (lower.includes('bullish') || lower.includes('bearish')) {
        answer = DOUBT_KNOWLEDGE['what does bullish and bearish mean']
      } else if (lower.includes('guidance') || lower.includes('catalyst') || lower.includes('earnings')) {
        answer = DOUBT_KNOWLEDGE['why is earnings guidance important']
      } else {
        answer = `Regarding your question about **"${q}"**: In ${activeScenario.symbol} (${activeScenario.market}), always look at the recent candle high/low wicks and volume expansion before executing. Current market price is **₹${currentPrice}**. Ensure your Stop-Loss is placed at **₹${activeScenario.stopLossPrice}** to maintain a healthy 1:2+ Risk:Reward ratio!`
      }

      setDoubtMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: answer }])
      setIsTyping(false)
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 500)
  }

  // Live Position PnL
  const livePnL = openPosition
    ? (openPosition.direction === 'BUY'
        ? (currentPrice - openPosition.entryPrice) * openPosition.quantity
        : (openPosition.entryPrice - currentPrice) * openPosition.quantity)
    : 0

  const livePnLPct = openPosition
    ? ((currentPrice - openPosition.entryPrice) / openPosition.entryPrice) * (openPosition.direction === 'BUY' ? 100 : -100)
    : 0

  // Candlestick SVG Calculations
  const minPrice = Math.min(...visibleCandles.map(c => c.low)) * 0.998
  const maxPrice = Math.max(...visibleCandles.map(c => c.high)) * 1.002
  const priceRange = maxPrice - minPrice || 1
  const chartHeight = 320
  const chartWidth = 650

  const getY = (val) => chartHeight - ((val - minPrice) / priceRange) * (chartHeight - 40) - 20

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* ── Top Header & Portfolio Bar ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1 font-mono text-xs">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="text-red-500 font-extrabold uppercase tracking-widest">Interactive Market Simulator</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <Activity className="text-red-500" size={26} /> Candlestick Replay & Paper Trading Terminal
          </h1>
          <p className="text-xs text-text-muted mt-0.5">Practice order execution, position sizing, and technical price action in a simulated live order book.</p>
        </div>

        {/* Live Capital Stats */}
        <div className="flex items-center gap-4 bg-void p-3 rounded-2xl border border-border">
          <div className="pr-4 border-r border-border font-mono">
            <div className="text-[10px] text-text-dim uppercase tracking-wider">Simulated Capital</div>
            <div className="text-lg font-black text-white">₹{portfolio.totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          </div>
          <div className="pr-4 border-r border-border font-mono">
            <div className="text-[10px] text-text-dim uppercase tracking-wider">Overall Return</div>
            <div className={`text-sm font-black ${portfolio.pnl >= 0 ? 'text-white' : 'text-red-400'}`}>
              {portfolio.pnl >= 0 ? '+' : ''}₹{portfolio.pnl.toFixed(0)} ({portfolio.pnlPct.toFixed(1)}%)
            </div>
          </div>
          <button onClick={resetPortfolio} className="p-2 rounded-xl border border-border hover:border-red-500 text-text-muted hover:text-white" title="Reset Capital">
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* ── Scenario Selection Chips ── */}
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
        {SCENARIO_STOCKS.map(sc => (
          <button
            key={sc.id}
            onClick={() => selectScenario(sc)}
            className={`px-4 py-3 rounded-xl border text-left transition-all shrink-0 ${
              activeScenario.id === sc.id
                ? 'bg-red-500/15 border-red-500 shadow-md shadow-red-500/10'
                : 'bg-surface border-border hover:border-red-500/40'
            }`}
          >
            <div className="flex items-center justify-between gap-4 font-mono mb-1">
              <span className="font-black text-white text-sm">{sc.symbol}</span>
              <span className="text-[10px] uppercase font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">{sc.difficulty}</span>
            </div>
            <div className="text-xs text-text-muted truncate max-w-[200px]">{sc.name}</div>
          </button>
        ))}
      </div>

      {/* ── Main Trading Grid (Chart + Execution Pad / Doubt Box) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ── LEFT: Candlestick Chart Terminal (7 Cols) ── */}
        <div className="lg:col-span-7 card rounded-2xl border border-border bg-surface p-6 flex flex-col justify-between shadow-2xl">
          
          {/* Chart Topbar */}
          <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xl font-black text-white font-mono">{activeScenario.symbol}</span>
                <span className="text-xs text-text-muted font-mono">{activeScenario.market}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white font-bold font-mono">15m Candlestick</span>
              </div>
              <div className="text-2xl font-black font-mono text-white mt-1">
                ₹{currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                <span className={`text-xs ml-2 font-bold ${currentCandle?.close >= currentCandle?.open ? 'text-white' : 'text-red-400'}`}>
                  {currentCandle?.close >= currentCandle?.open ? '▲ Bullish' : '▼ Bearish'}
                </span>
              </div>
            </div>

            {/* Replay Controls */}
            <div className="flex items-center gap-2 bg-void p-1.5 rounded-xl border border-border font-mono">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-500/20"
              >
                {isPlaying ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Replay</>}
              </button>
              <button
                onClick={stepForward}
                disabled={revealedCount >= activeScenario.candles.length}
                className="p-1.5 rounded-lg hover:bg-white/10 text-text-muted hover:text-white disabled:opacity-30"
                title="Next Candle"
              >
                <SkipForward size={14} />
              </button>
              <span className="text-[10px] text-text-dim px-2">
                {revealedCount}/{activeScenario.candles.length} Candles
              </span>
            </div>
          </div>

          {/* Scenario Context Box */}
          <div className="bg-void p-3.5 rounded-xl border border-border/80 mb-4 text-xs leading-relaxed text-text-secondary">
            <strong className="text-red-400 uppercase tracking-wider font-mono mr-2 font-bold">Catalyst Setup:</strong>
            {activeScenario.context}
          </div>

          {/* SVG Candlestick Engine */}
          <div className="relative w-full bg-void rounded-xl border border-border p-2 overflow-hidden select-none">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-72">
              
              {/* Grid Lines */}
              {[0.25, 0.5, 0.75].map(ratio => {
                const y = chartHeight * ratio
                const priceAtY = maxPrice - ratio * priceRange
                return (
                  <g key={ratio}>
                    <line x1="0" y1={y} x2={chartWidth} y2={y} stroke="#1A1A1A" strokeDasharray="3 3" />
                    <text x={chartWidth - 55} y={y - 4} fill="#555" fontSize="10" fontFamily="monospace">
                      ₹{priceAtY.toFixed(1)}
                    </text>
                  </g>
                )
              })}

              {/* Support / Target Horizontal Lines */}
              {openPosition && (
                <>
                  <line x1="0" y1={getY(openPosition.entryPrice)} x2={chartWidth} y2={getY(openPosition.entryPrice)} stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="4 4" />
                  <text x="10" y={getY(openPosition.entryPrice) - 4} fill="#FFF" fontSize="10" fontFamily="monospace" fontWeight="bold">
                    Entry @ ₹{openPosition.entryPrice}
                  </text>
                  <line x1="0" y1={getY(openPosition.stopLoss)} x2={chartWidth} y2={getY(openPosition.stopLoss)} stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3 3" />
                  <text x="10" y={getY(openPosition.stopLoss) - 4} fill="#EF4444" fontSize="10" fontFamily="monospace">
                    SL @ ₹{openPosition.stopLoss}
                  </text>
                  <line x1="0" y1={getY(openPosition.target)} x2={chartWidth} y2={getY(openPosition.target)} stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="3 3" />
                  <text x="10" y={getY(openPosition.target) - 4} fill="#FFF" fontSize="10" fontFamily="monospace">
                    TP @ ₹{openPosition.target}
                  </text>
                </>
              )}

              {/* Candlesticks */}
              {visibleCandles.map((c, i) => {
                const candleWidth = Math.max(12, Math.min(28, (chartWidth - 80) / visibleCandles.length - 8))
                const x = 30 + i * ((chartWidth - 70) / visibleCandles.length)
                const isGreen = c.close >= c.open
                const color = isGreen ? '#FFFFFF' : '#EF4444'
                const bodyTop = getY(Math.max(c.open, c.close))
                const bodyBottom = getY(Math.min(c.open, c.close))
                const bodyHeight = Math.max(2, bodyBottom - bodyTop)
                const highY = getY(c.high)
                const lowY = getY(c.low)

                return (
                  <g
                    key={i}
                    onMouseEnter={() => setHoveredCandle(c)}
                    onMouseLeave={() => setHoveredCandle(null)}
                    className="cursor-pointer"
                  >
                    {/* Wick */}
                    <line x1={x + candleWidth / 2} y1={highY} x2={x + candleWidth / 2} y2={lowY} stroke={color} strokeWidth="1.5" />
                    {/* Body */}
                    <rect
                      x={x}
                      y={bodyTop}
                      width={candleWidth}
                      height={bodyHeight}
                      fill={color}
                      stroke={color}
                      rx="1"
                    />
                    {/* Time label */}
                    <text x={x + candleWidth / 2} y={chartHeight - 5} fill="#555" fontSize="9" textAnchor="middle" fontFamily="monospace">
                      {c.time}
                    </text>
                  </g>
                )
              })}
            </svg>

            {/* Hover Tooltip */}
            {hoveredCandle && (
              <div className="absolute top-3 left-4 bg-surface border border-border p-2 rounded-lg font-mono text-[11px] flex gap-3 text-text-secondary">
                <span>O: <strong className="text-white">₹{hoveredCandle.open}</strong></span>
                <span>H: <strong className="text-white">₹{hoveredCandle.high}</strong></span>
                <span>L: <strong className="text-white">₹{hoveredCandle.low}</strong></span>
                <span>C: <strong className="text-white">₹{hoveredCandle.close}</strong></span>
                <span>Vol: <strong className="text-red-400">{hoveredCandle.volume.toLocaleString()}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Order Ticket & AI Doubt Box (5 Cols) ── */}
        <div className="lg:col-span-5 space-y-4 flex flex-col h-full">
          
          {/* Top Tabs Switcher */}
          <div className="flex bg-void p-1 rounded-xl border border-border shrink-0">
            <button
              onClick={() => setActiveTab('order')}
              className={`flex-1 py-2 rounded-lg font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'order' ? 'bg-red-500 text-white shadow-md shadow-red-500/20' : 'text-text-muted hover:text-white'
              }`}
            >
              <Activity size={14} /> Order Ticket
            </button>
            <button
              onClick={() => setActiveTab('doubts')}
              className={`flex-1 py-2 rounded-lg font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'doubts' ? 'bg-red-500 text-white shadow-md shadow-red-500/20' : 'text-text-muted hover:text-white'
              }`}
            >
              <HelpCircle size={14} /> Clear Doubts (AI)
            </button>
          </div>

          {activeTab === 'order' ? (
            
            /* ── Order Ticket View ── */
            <div className="space-y-4">
              <div className="card rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-white">Order Execution</span>
                  <span className="text-xs font-mono text-red-400 font-bold">Paper Trading</span>
                </div>

                {/* Quantity */}
                <div>
                  <label className="text-[11px] font-mono uppercase text-text-muted font-bold block mb-1.5">Trade Quantity (Shares)</label>
                  <div className="flex items-center gap-2">
                    {[5, 10, 25, 50].map(q => (
                      <button
                        key={q}
                        onClick={() => setTradeQuantity(q)}
                        className={`flex-1 py-1.5 rounded-lg font-mono text-xs font-bold border transition-all ${
                          tradeQuantity === q ? 'bg-white text-black border-white' : 'border-border text-text-muted hover:border-red-500'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stop-Loss & Target Inputs */}
                <div className="grid grid-cols-2 gap-3 font-mono">
                  <div>
                    <label className="text-[10px] text-text-muted uppercase font-bold block mb-1">Stop-Loss (₹)</label>
                    <input
                      type="number"
                      value={stopLossInput}
                      onChange={(e) => setStopLossInput(e.target.value)}
                      className="w-full bg-void border border-border rounded-lg p-2.5 text-xs text-white font-bold focus:border-red-500 focus:outline-none"
                      placeholder={String(activeScenario.stopLossPrice)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted uppercase font-bold block mb-1">Target Price (₹)</label>
                    <input
                      type="number"
                      value={targetInput}
                      onChange={(e) => setTargetInput(e.target.value)}
                      className="w-full bg-void border border-border rounded-lg p-2.5 text-xs text-white font-bold focus:border-red-500 focus:outline-none"
                      placeholder={String(activeScenario.targetPrice)}
                    />
                  </div>
                </div>

                {/* Execution Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => executeOrder('BUY')}
                    disabled={openPosition !== null}
                    className="py-4 rounded-xl bg-white text-black font-black uppercase tracking-wider text-xs hover:bg-gray-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-white/10"
                  >
                    BUY / LONG ↗
                  </button>
                  <button
                    onClick={() => executeOrder('SELL')}
                    disabled={openPosition !== null}
                    className="py-4 rounded-xl bg-red-gradient text-white font-black uppercase tracking-wider text-xs hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-red-500/25"
                  >
                    SELL / SHORT ↘
                  </button>
                </div>
              </div>

              {/* Active Position / Live PnL Box */}
              {openPosition ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card rounded-2xl border border-red-500/50 bg-void p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-extrabold text-white flex items-center gap-1.5">
                      <Activity size={14} className="text-red-500 animate-pulse" /> LIVE POSITION
                    </span>
                    <span className={`font-bold px-2 py-0.5 rounded border ${openPosition.direction === 'BUY' ? 'bg-white/10 text-white border-white/20' : 'bg-red-500/20 text-red-300 border-red-500/40'}`}>
                      {openPosition.direction} {openPosition.quantity} QTY
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-y border-border font-mono">
                    <span className="text-xs text-text-muted">Unrealized PnL:</span>
                    <span className={`text-base font-black ${livePnL >= 0 ? 'text-white font-extrabold' : 'text-red-400'}`}>
                      {livePnL >= 0 ? '+' : ''}₹{livePnL.toFixed(1)} ({livePnLPct.toFixed(1)}%)
                    </span>
                  </div>

                  <button
                    onClick={() => closePosition(currentPrice, 'Manual Market Exit')}
                    className="w-full py-2.5 rounded-xl border border-red-500/40 text-xs font-mono font-bold text-red-400 hover:bg-red-500/20 transition-colors"
                  >
                    Market Close Position @ ₹{currentPrice}
                  </button>
                </motion.div>
              ) : (
                <div className="card rounded-2xl border border-border bg-surface p-4 text-center text-xs text-text-dim font-mono">
                  No open market positions. Enter BUY or SELL above.
                </div>
              )}

              {/* Trade Outcome Modal / Result Feedback */}
              {tradeOutcome && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card rounded-2xl border border-border bg-surface p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    {tradeOutcome.pnl > 0 ? (
                      <><CheckCircle2 className="text-white" size={18} /><span className="text-white font-black text-sm uppercase">Profitable Execution!</span></>
                    ) : (
                      <><XCircle className="text-red-400" size={18} /><span className="text-red-400 font-black text-sm uppercase">Loss Controlled (SL Hit)</span></>
                    )}
                    <span className="text-xs font-mono text-text-muted ml-auto font-bold">
                      {tradeOutcome.pnl > 0 ? '+' : ''}₹{tradeOutcome.pnl.toFixed(0)}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed font-medium">
                    {activeScenario.lesson}
                  </p>
                </motion.div>
              )}
            </div>
          ) : (
            
            /* ── Interactive AI Doubt Solver View ── */
            <div className="card rounded-2xl border border-border bg-surface flex flex-col h-[520px] overflow-hidden shadow-2xl">
              
              {/* Doubt Header */}
              <div className="p-4 border-b border-border bg-void flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Bot size={18} className="text-red-500" />
                  <div>
                    <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Trading Doubt Solver</h3>
                    <p className="text-[10px] text-text-muted">Instant AI mentor for this setup</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono bg-red-500/20 text-red-400 border border-red-500/40 px-2 py-0.5 rounded font-bold">LIVE COPILOT</span>
              </div>

              {/* Quick Doubts Suggestions */}
              <div className="p-2 border-b border-border bg-void/50 flex gap-1.5 overflow-x-auto scrollbar-none shrink-0">
                {[
                  'What is a stop loss',
                  'Why do candles have wicks',
                  'How does shorting work',
                  'How to calculate position size',
                  'Why is earnings guidance important'
                ].map(q => (
                  <button
                    key={q}
                    onClick={() => handleSendDoubt(q)}
                    className="px-2.5 py-1 rounded-md text-[10px] font-mono bg-surface border border-border hover:border-red-500 hover:text-white text-text-secondary whitespace-nowrap transition-colors"
                  >
                    💡 {q}?
                  </button>
                ))}
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans">
                {doubtMessages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-xl text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-white text-black font-semibold'
                          : 'bg-void border border-border text-text-secondary'
                      }`}
                    >
                      {msg.sender === 'ai' ? (
                        <div
                          dangerouslySetInnerHTML={{
                            __html: msg.text
                              .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
                              .replace(/`(.*?)`/g, '<code class="bg-surface text-red-400 px-1 py-0.5 rounded font-mono text-[10px]">$1</code>')
                          }}
                        />
                      ) : (
                        msg.text
                      )}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-void border border-border p-2.5 rounded-xl text-xs text-text-dim font-mono animate-pulse">
                      Analyzing technical setup...
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input */}
              <div className="p-3 border-t border-border bg-void flex gap-2 shrink-0">
                <input
                  type="text"
                  value={doubtInput}
                  onChange={(e) => setDoubtInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendDoubt()}
                  placeholder="Type any doubt about candles, SL, orders..."
                  className="flex-1 bg-surface border border-border rounded-xl px-3 py-2 text-xs text-white placeholder:text-text-dim focus:border-red-500 focus:outline-none"
                />
                <button
                  onClick={() => handleSendDoubt()}
                  disabled={!doubtInput.trim()}
                  className="p-2.5 rounded-xl bg-red-gradient text-white hover:opacity-90 disabled:opacity-30 transition-opacity"
                >
                  <Send size={14} />
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  )
}
