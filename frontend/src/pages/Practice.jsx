import { useState, useEffect, useRef } from 'react'
import { Target, Play, Pause, SkipForward, RotateCcw, TrendingUp, TrendingDown, ShieldAlert, Zap, CheckCircle2, XCircle, ArrowUpRight, ArrowDownRight, DollarSign, Activity, MessageSquareQuote, Send, Sparkles, HelpCircle, Bot, ChevronDown, Search, Layers, PieChart, Landmark, Globe } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../store/useStore'
import ProgressBar from '../components/ui/ProgressBar'

// ── Multi-Asset Universal Directory (Stocks, Mutual Funds, Indices, Global) ──
const ASSETS_DIRECTORY = [
  // 1. Indian Large & Mid-Cap Equities
  {
    id: 'reliance',
    type: 'stock',
    symbol: 'RELIANCE',
    name: 'Reliance Industries Ltd.',
    market: 'NSE · Energy & Telecom',
    category: 'Stocks',
    price: 2940.50,
    change: 1.45,
    pe: 26.4,
    high52: 3217.0,
    low52: 2220.0,
    context: 'Strong subscriber additions in Jio and retail store expansions. Testing its multi-week 50-day EMA support with high delivery volume.',
    candles: [
      { time: '09:15', open: 2910, high: 2925, low: 2905, close: 2920, volume: 45000 },
      { time: '09:30', open: 2920, high: 2932, low: 2915, close: 2928, volume: 52000 },
      { time: '09:45', open: 2928, high: 2945, low: 2922, close: 2940.5, volume: 88000 },
      { time: '10:00', open: 2940.5, high: 2955, low: 2938, close: 2950, volume: 92000 },
      { time: '10:15', open: 2950, high: 2968, low: 2945, close: 2962, volume: 110000 },
      { time: '10:30', open: 2962, high: 2975, low: 2958, close: 2970, volume: 125000 },
      { time: '10:45', open: 2970, high: 2988, low: 2965, close: 2982, volume: 140000 },
    ],
    stopLossPrice: 2915,
    targetPrice: 2990
  },
  {
    id: 'tatamotors',
    type: 'stock',
    symbol: 'TATAMOTORS',
    name: 'Tata Motors Passenger Vehicles Ltd.',
    market: 'NSE · Auto & EV',
    category: 'Stocks',
    price: 985.20,
    change: 2.80,
    pe: 18.2,
    high52: 1179.0,
    low52: 620.0,
    context: 'JLR global order book hits record highs alongside surging domestic EV market share. Breaking above ₹975 horizontal resistance on volume expansion.',
    candles: [
      { time: '09:15', open: 962, high: 970, low: 958, close: 968, volume: 82000 },
      { time: '09:30', open: 968, high: 976, low: 965, close: 975, volume: 94000 },
      { time: '09:45', open: 975, high: 988, low: 972, close: 985.2, volume: 165000 },
      { time: '10:00', open: 985.2, high: 996, low: 982, close: 992, volume: 180000 },
      { time: '10:15', open: 992, high: 1008, low: 990, close: 1004, volume: 210000 },
      { time: '10:30', open: 1004, high: 1018, low: 1000, close: 1015, volume: 195000 },
    ],
    stopLossPrice: 965,
    targetPrice: 1020
  },
  {
    id: 'infy-earnings',
    type: 'stock',
    symbol: 'INFY',
    name: 'Infosys Ltd.',
    market: 'NSE · IT Services',
    category: 'Stocks',
    price: 1490.00,
    change: 3.20,
    pe: 24.8,
    high52: 1950.0,
    low52: 1350.0,
    context: 'Infosys beat Q2 estimates (Profit +24% YoY) and raised full-year guidance to 6.5-7%. Stock is breaking out of a 3-week consolidation at ₹1,480.',
    candles: [
      { time: '09:15', open: 1465, high: 1475, low: 1460, close: 1472, volume: 12000 },
      { time: '09:30', open: 1472, high: 1478, low: 1468, close: 1470, volume: 15400 },
      { time: '09:45', open: 1470, high: 1482, low: 1469, close: 1480, volume: 28000 },
      { time: '10:00', open: 1480, high: 1488, low: 1478, close: 1485, volume: 34000 },
      { time: '10:15', open: 1485, high: 1494, low: 1482, close: 1490, volume: 41000 },
      { time: '10:30', open: 1490, high: 1505, low: 1488, close: 1502, volume: 55000 },
      { time: '10:45', open: 1502, high: 1515, low: 1498, close: 1510, volume: 62000 },
      { time: '11:00', open: 1510, high: 1522, low: 1506, close: 1518, volume: 48000 },
    ],
    stopLossPrice: 1465,
    targetPrice: 1530
  },
  {
    id: 'zomato',
    type: 'stock',
    symbol: 'ZOMATO',
    name: 'Zomato Ltd. (Blinkit)',
    market: 'NSE · Quick Commerce',
    category: 'Stocks',
    price: 265.40,
    change: 4.10,
    pe: 110.0,
    high52: 298.0,
    low52: 95.0,
    context: 'Blinkit quick-commerce dark stores expand 120% YoY reaching positive EBITDA. Institutional FII net buying aggressive above ₹260.',
    candles: [
      { time: '09:15', open: 255, high: 260, low: 253, close: 258, volume: 420000 },
      { time: '09:30', open: 258, high: 262, low: 256, close: 261, volume: 510000 },
      { time: '09:45', open: 261, high: 268, low: 260, close: 265.4, volume: 890000 },
      { time: '10:00', open: 265.4, high: 272, low: 264, close: 270, volume: 950000 },
      { time: '10:15', open: 270, high: 278, low: 268, close: 275, volume: 1120000 },
    ],
    stopLossPrice: 254,
    targetPrice: 280
  },
  {
    id: 'hdfc-bank',
    type: 'stock',
    symbol: 'HDFCBANK',
    name: 'HDFC Bank Ltd.',
    market: 'NSE · Banking',
    category: 'Stocks',
    price: 1610.00,
    change: -1.85,
    pe: 18.5,
    high52: 1794.0,
    low52: 1363.0,
    context: 'HDFC Bank broke below its multi-week horizontal support of ₹1,620 on institutional selling following margin squeeze disclosure.',
    candles: [
      { time: '10:00', open: 1635, high: 1640, low: 1630, close: 1632, volume: 45000 },
      { time: '10:15', open: 1632, high: 1634, low: 1622, close: 1624, volume: 52000 },
      { time: '10:30', open: 1624, high: 1625, low: 1618, close: 1620, volume: 68000 },
      { time: '10:45', open: 1620, high: 1621, low: 1608, close: 1610, volume: 94000 },
      { time: '11:00', open: 1610, high: 1612, low: 1595, close: 1598, volume: 88000 },
      { time: '11:15', open: 1598, high: 1602, low: 1588, close: 1590, volume: 76000 },
    ],
    stopLossPrice: 1628,
    targetPrice: 1580
  },

  // 2. Mutual Funds & Index ETFs
  {
    id: 'parag-parikh-flexi',
    type: 'mutual_fund',
    symbol: 'PPFAS-FLEXI',
    name: 'Parag Parikh Flexi Cap Fund (Direct-Growth)',
    market: 'AMFI · Flexi Cap Equity',
    category: 'Mutual Funds',
    nav: 74.82,
    cagr3y: 21.4,
    expenseRatio: 0.62,
    aum: '₹68,400 Cr',
    topHoldings: ['HDFC Bank (8.2%)', 'ITC (7.8%)', 'Alphabet / Google (6.4%)', 'Bajaj Holdings (6.1%)', 'Microsoft (5.2%)'],
    context: 'High-conviction value-investing fund holding cash reserves during overbought markets and investing up to 20% in global tech compounders.',
    navHistory: [
      { time: 'Jan', nav: 64.2 }, { time: 'Feb', nav: 65.8 }, { time: 'Mar', nav: 65.1 },
      { time: 'Apr', nav: 67.4 }, { time: 'May', nav: 69.2 }, { time: 'Jun', nav: 71.0 },
      { time: 'Jul', nav: 73.1 }, { time: 'Aug', nav: 74.82 }
    ]
  },
  {
    id: 'sbi-nifty-index',
    type: 'mutual_fund',
    symbol: 'SBI-NIFTY-50',
    name: 'SBI Nifty 50 Index Fund (Direct-Growth)',
    market: 'AMFI · Passive Benchmark',
    category: 'Mutual Funds',
    nav: 245.10,
    cagr3y: 15.8,
    expenseRatio: 0.18,
    aum: '₹14,200 Cr',
    topHoldings: ['HDFC Bank (11.5%)', 'Reliance (9.8%)', 'ICICI Bank (7.9%)', 'Infosys (5.8%)', 'ITC (4.2%)'],
    context: 'Ultra low-cost fund matching the exact 50 bluechip companies of India with minimal tracking error.',
    navHistory: [
      { time: 'Jan', nav: 212 }, { time: 'Feb', nav: 216 }, { time: 'Mar', nav: 214 },
      { time: 'Apr', nav: 224 }, { time: 'May', nav: 231 }, { time: 'Jun', nav: 238 },
      { time: 'Jul', nav: 242 }, { time: 'Aug', nav: 245.1 }
    ]
  },
  {
    id: 'nippon-small-cap',
    type: 'mutual_fund',
    symbol: 'NIPPON-SMALL',
    name: 'Nippon India Small Cap Fund (Direct-Growth)',
    market: 'AMFI · Small Cap High Growth',
    category: 'Mutual Funds',
    nav: 168.45,
    cagr3y: 28.6,
    expenseRatio: 0.74,
    aum: '₹54,000 Cr',
    topHoldings: ['Tube Investments (3.1%)', 'HDFC Bank (2.8%)', 'Apar Industries (2.4%)', 'Voltamp (2.2%)'],
    context: 'Diversified small-cap portfolio across 180+ high-growth companies with strong capital discipline.',
    navHistory: [
      { time: 'Jan', nav: 132 }, { time: 'Feb', nav: 138 }, { time: 'Mar', nav: 135 },
      { time: 'Apr', nav: 146 }, { time: 'May', nav: 154 }, { time: 'Jun', nav: 162 },
      { time: 'Jul', nav: 166 }, { time: 'Aug', nav: 168.45 }
    ]
  },

  // 3. Global Equities & ETFs
  {
    id: 'aapl-global',
    type: 'stock',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    market: 'NASDAQ · Global Tech',
    category: 'Global',
    price: 184.20,
    change: 1.90,
    pe: 31.2,
    high52: 199.0,
    low52: 145.0,
    context: 'Apple broke above all-time high resistance of $182 following keynote announcement of neural AI hardware. Zero overhead supply resistance.',
    candles: [
      { time: '09:30', open: 180, high: 182, low: 179, close: 181, volume: 150000 },
      { time: '10:00', open: 181, high: 183, low: 180, close: 182.5, volume: 220000 },
      { time: '10:30', open: 182.5, high: 185, low: 182, close: 184.2, volume: 340000 },
      { time: '11:00', open: 184.2, high: 187, low: 183.5, close: 186.5, volume: 290000 },
      { time: '11:30', open: 186.5, high: 189, low: 185.8, close: 188.2, volume: 260000 },
    ],
    stopLossPrice: 181,
    targetPrice: 190
  },
  {
    id: 'nvda-global',
    type: 'stock',
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    market: 'NASDAQ · AI & Semiconductors',
    category: 'Global',
    price: 128.50,
    change: 5.40,
    pe: 48.0,
    high52: 140.0,
    low52: 40.0,
    context: 'Data center GPU demand up 400% YoY with global cloud providers accelerating Blackwell architecture buildouts.',
    candles: [
      { time: '09:30', open: 122, high: 125, low: 121, close: 124, volume: 850000 },
      { time: '10:00', open: 124, high: 127, low: 123.5, close: 126.8, volume: 920000 },
      { time: '10:30', open: 126.8, high: 130, low: 126, close: 128.5, volume: 1250000 },
      { time: '11:00', open: 128.5, high: 132, low: 128, close: 131.2, volume: 1100000 },
    ],
    stopLossPrice: 124,
    targetPrice: 134
  }
]

export default function Practice() {
  const [selectedAsset, setSelectedAsset] = useState(ASSETS_DIRECTORY[0])
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [revealedCount, setRevealedCount] = useState(3)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hoveredCandle, setHoveredCandle] = useState(null)
  const [activeTab, setActiveTab] = useState('order') // 'order' | 'doubts' | 'insights'

  // Trading State (Stocks)
  const [tradeQuantity, setTradeQuantity] = useState(10)
  const [stopLossInput, setStopLossInput] = useState('')
  const [targetInput, setTargetInput] = useState('')
  const [openPosition, setOpenPosition] = useState(null)
  const [tradeOutcome, setTradeOutcome] = useState(null)

  // SIP Investing State (Mutual Funds)
  const [sipAmount, setSipAmount] = useState(2500)
  const [sipTenureYears, setSipTenureYears] = useState(15)
  const [sipSuccessMsg, setSipSuccessMsg] = useState(null)

  // AI Doubt State
  const [doubtMessages, setDoubtMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: '👋 I am your AI Trading & Investing Mentor. Ask me any doubt about this stock, candlestick patterns, or mutual fund compounding strategy!'
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

  // Filtered Assets
  const filteredAssets = ASSETS_DIRECTORY.filter(a => {
    const matchesCat = categoryFilter === 'All' || a.category === categoryFilter
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCat && matchesSearch
  })

  // Select Asset
  const handleSelectAsset = (asset) => {
    setSelectedAsset(asset)
    setRevealedCount(3)
    setIsPlaying(false)
    setOpenPosition(null)
    setTradeOutcome(null)
    setSipSuccessMsg(null)
    if (asset.type === 'stock') {
      setStopLossInput(String(asset.stopLossPrice || (asset.price * 0.98).toFixed(1)))
      setTargetInput(String(asset.targetPrice || (asset.price * 1.04).toFixed(1)))
    }
  }

  // Current Stock Price / Candles
  const visibleCandles = selectedAsset.type === 'stock' ? (selectedAsset.candles || []).slice(0, revealedCount) : []
  const currentCandle = visibleCandles[visibleCandles.length - 1]
  const currentPrice = selectedAsset.type === 'stock' ? (currentCandle?.close || selectedAsset.price) : selectedAsset.nav

  // Replay Advance Step
  const stepForward = () => {
    if (selectedAsset.candles && revealedCount < selectedAsset.candles.length) {
      setRevealedCount(prev => prev + 1)
    } else {
      setIsPlaying(false)
    }
  }

  // Play / Pause Replay
  useEffect(() => {
    if (isPlaying && selectedAsset.type === 'stock') {
      timerRef.current = setInterval(() => {
        setRevealedCount(prev => {
          if (selectedAsset.candles && prev < selectedAsset.candles.length) {
            return prev + 1
          } else {
            setIsPlaying(false)
            return prev
          }
        })
      }, 1500)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [isPlaying, selectedAsset])

  // Execute Stock Order
  const executeOrder = (direction) => {
    const sl = parseFloat(stopLossInput) || (direction === 'BUY' ? currentPrice * 0.98 : currentPrice * 1.02)
    const tp = parseFloat(targetInput) || (direction === 'BUY' ? currentPrice * 1.04 : currentPrice * 0.96)
    const cost = tradeQuantity * currentPrice

    if (cost > portfolio.cash && direction === 'BUY') {
      alert('Insufficient virtual cash! Reduce quantity.')
      return
    }

    const newPos = {
      symbol: selectedAsset.symbol,
      direction,
      quantity: tradeQuantity,
      entryPrice: currentPrice,
      stopLoss: sl,
      target: tp,
      openedAt: currentCandle ? currentCandle.time : 'Market Open',
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

    setOpenPosition(null)
    setIsPlaying(false)
    setTradeOutcome({
      ...pos,
      exitPrice,
      pnl,
      pnlPct,
      reason
    })
  }

  // Check Position Target / Stop Loss
  useEffect(() => {
    if (!openPosition) return
    const pos = openPosition
    if (pos.direction === 'BUY' && currentPrice >= pos.target) {
      closePosition(currentPrice, 'Target Reached 🎯')
    } else if (pos.direction === 'BUY' && currentPrice <= pos.stopLoss) {
      closePosition(currentPrice, 'Stop-Loss Hit 🛑')
    } else if (pos.direction === 'SELL' && currentPrice <= pos.target) {
      closePosition(currentPrice, 'Target Reached 🎯')
    } else if (pos.direction === 'SELL' && currentPrice >= pos.stopLoss) {
      closePosition(currentPrice, 'Stop-Loss Hit 🛑')
    }
  }, [revealedCount, currentPrice])

  // Execute Mutual Fund SIP
  const executeMutualFundSip = () => {
    if (sipAmount > portfolio.cash) {
      alert('Insufficient virtual cash for this SIP installment.')
      return
    }
    const newCash = portfolio.cash - sipAmount
    const unitsBought = sipAmount / selectedAsset.nav

    updatePortfolio({
      cash: newCash,
      holdings: [
        ...(portfolio.holdings || []),
        {
          symbol: selectedAsset.symbol,
          name: selectedAsset.name,
          qty: unitsBought,
          buyPrice: selectedAsset.nav,
          currentPrice: selectedAsset.nav
        }
      ]
    })

    setSipSuccessMsg(`✅ Started Monthly SIP of ₹${sipAmount.toLocaleString()} in ${selectedAsset.name}! Allocated ${unitsBought.toFixed(2)} units at NAV ₹${selectedAsset.nav}.`)
  }

  // Handle AI Doubt Submission
  const handleSendDoubt = (text) => {
    const q = (text || doubtInput).trim()
    if (!q) return

    setDoubtMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: q }])
    setDoubtInput('')
    setIsTyping(true)

    setTimeout(() => {
      let answer = ''
      const lower = q.toLowerCase()
      if (lower.includes('sip') || lower.includes('mutual fund') || lower.includes('nav')) {
        answer = `**Mutual Fund & SIP Strategy**: When you invest in **${selectedAsset.name}** via monthly SIP, you benefit from **Rupee-Cost Averaging**. During market corrections, your ₹${sipAmount} buys more units at discounted NAVs, accelerating compounding over ${sipTenureYears} years!`
      } else if (lower.includes('stop loss') || lower.includes('sl')) {
        answer = `For **${selectedAsset.symbol}**, your suggested Stop-Loss is **₹${selectedAsset.stopLossPrice || (selectedAsset.price * 0.98).toFixed(1)}**. Setting an SL limits your maximum loss to 1-2% of your capital if institutional selling appears.`
      } else if (lower.includes('candle') || lower.includes('wick')) {
        answer = `In **${selectedAsset.symbol}**, notice the lower wicks at support floors — this indicates aggressive buyer absorption before the rally. White/Green candles show buyer dominance.`
      } else {
        answer = `Regarding **"${q}"** for **${selectedAsset.name}**: Always analyze the catalyst (${selectedAsset.context}) and align your trade with institutional flow. Current price/NAV is **₹${currentPrice}**.`
      }

      setDoubtMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: answer }])
      setIsTyping(false)
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 400)
  }

  // Live PnL calculation
  const livePnL = openPosition
    ? (openPosition.direction === 'BUY'
        ? (currentPrice - openPosition.entryPrice) * openPosition.quantity
        : (openPosition.entryPrice - currentPrice) * openPosition.quantity)
    : 0

  // SIP Compounding Calculator Formula: FV = P × [ ( (1 + r)^n - 1 ) / r ] × (1 + r)
  const monthlyRate = (selectedAsset.cagr3y || 14) / 100 / 12
  const totalMonths = sipTenureYears * 12
  const totalInvestedSip = sipAmount * totalMonths
  const projectedCorpus = Math.round(
    sipAmount * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate)
  )
  const wealthGained = projectedCorpus - totalInvestedSip

  // SVG Chart Dimensions
  const chartHeight = 280
  const chartWidth = 620
  const minPrice = visibleCandles.length > 0 ? Math.min(...visibleCandles.map(c => c.low)) * 0.998 : 100
  const maxPrice = visibleCandles.length > 0 ? Math.max(...visibleCandles.map(c => c.high)) * 1.002 : 200
  const priceRange = maxPrice - minPrice || 1
  const getY = (val) => chartHeight - ((val - minPrice) / priceRange) * (chartHeight - 40) - 20

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* ── Top Bar & Live Capital ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1 font-mono text-xs">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="text-red-500 font-extrabold uppercase tracking-widest">Multi-Asset Paper Trading & SIP Terminal</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <Activity className="text-red-500" size={26} /> Live Market Terminal & Behavior Lab
          </h1>
          <p className="text-xs text-text-muted mt-0.5">Explore Indian Equities, Mutual Funds, Benchmark Indices & Global Tech compounders with real-time simulated data.</p>
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

      {/* ── Universal Search & Category Filter Bar ── */}
      <div className="card p-4 rounded-2xl border border-border bg-surface flex flex-col md:flex-row gap-4 items-center justify-between shadow-xl">
        
        {/* Search Box */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-3 text-text-dim" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search any stock, mutual fund (e.g. Tata Motors, Parag Parikh)..."
            className="w-full bg-void border border-border rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-text-dim focus:border-red-500 focus:outline-none"
          />
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto scrollbar-none font-mono text-xs">
          {['All', 'Stocks', 'Mutual Funds', 'Global'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                categoryFilter === cat
                  ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                  : 'bg-void border border-border text-text-muted hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Asset Selection Watchlist Carousel ── */}
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
        {filteredAssets.map(asset => (
          <button
            key={asset.id}
            onClick={() => handleSelectAsset(asset)}
            className={`p-3.5 rounded-xl border text-left transition-all shrink-0 min-w-[210px] ${
              selectedAsset.id === asset.id
                ? 'bg-red-500/15 border-red-500 shadow-md shadow-red-500/10'
                : 'bg-surface border-border hover:border-red-500/40'
            }`}
          >
            <div className="flex items-center justify-between font-mono mb-1">
              <span className="font-black text-white text-sm">{asset.symbol}</span>
              <span className="text-[10px] uppercase font-bold text-white bg-white/10 px-2 py-0.5 rounded">
                {asset.type === 'mutual_fund' ? 'SIP Fund' : 'Stock'}
              </span>
            </div>
            <div className="text-xs text-text-muted truncate mb-2">{asset.name}</div>
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="font-black text-white">₹{asset.price || asset.nav}</span>
              <span className={`font-bold ${asset.change >= 0 || asset.cagr3y ? 'text-white' : 'text-red-400'}`}>
                {asset.change ? `${asset.change >= 0 ? '+' : ''}${asset.change}%` : `${asset.cagr3y}% 3Y CAGR`}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* ── Main Terminal Body (Chart + Order / SIP Execution + AI Doubt Copilot) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ── LEFT: Chart / Fundamentals View (7 Cols) ── */}
        <div className="lg:col-span-7 card rounded-2xl border border-border bg-surface p-6 flex flex-col justify-between shadow-2xl">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xl font-black text-white font-mono">{selectedAsset.symbol}</span>
                <span className="text-xs text-text-muted font-mono">{selectedAsset.market}</span>
              </div>
              <div className="text-2xl font-black font-mono text-white mt-1">
                ₹{currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                <span className="text-xs ml-2 font-bold text-white bg-white/10 px-2 py-0.5 rounded">
                  {selectedAsset.type === 'mutual_fund' ? 'Daily NAV' : 'Live Price'}
                </span>
              </div>
            </div>

            {/* Replay Controls (For Stocks) */}
            {selectedAsset.type === 'stock' && selectedAsset.candles && (
              <div className="flex items-center gap-2 bg-void p-1.5 rounded-xl border border-border font-mono">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-500/20"
                >
                  {isPlaying ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Replay</>}
                </button>
                <button
                  onClick={stepForward}
                  disabled={revealedCount >= selectedAsset.candles.length}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-text-muted hover:text-white disabled:opacity-30"
                  title="Next Candle"
                >
                  <SkipForward size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Asset Context & Catalyst */}
          <div className="bg-void p-3.5 rounded-xl border border-border/80 mb-4 text-xs leading-relaxed text-text-secondary">
            <strong className="text-red-400 uppercase tracking-wider font-mono mr-2 font-bold">
              {selectedAsset.type === 'mutual_fund' ? 'Fund Thesis & Mandate:' : 'Market Catalyst & Technical Setup:'}
            </strong>
            {selectedAsset.context}
          </div>

          {/* Chart Display (Candlestick for Stocks, NAV Trend for Mutual Funds) */}
          {selectedAsset.type === 'stock' && visibleCandles.length > 0 ? (
            
            <div className="relative w-full bg-void rounded-xl border border-border p-3 overflow-hidden select-none">
              
              {/* Permanent TradingView-Style OHLCV Bar */}
              <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-2 px-2 py-1.5 rounded-lg bg-surface/80 border border-border/60 font-mono text-xs text-text-secondary">
                <span className="text-[11px] text-text-dim uppercase font-bold">
                  {hoveredCandle ? `Candle: ${hoveredCandle.time}` : `Latest: ${currentCandle?.time || 'Now'}`}
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-text-dim text-[11px]">O:</span>
                  <span className="text-white font-bold">₹{hoveredCandle ? hoveredCandle.open : currentCandle?.open}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-text-dim text-[11px]">H:</span>
                  <span className="text-white font-bold">₹{hoveredCandle ? hoveredCandle.high : currentCandle?.high}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-text-dim text-[11px]">L:</span>
                  <span className="text-white font-bold">₹{hoveredCandle ? hoveredCandle.low : currentCandle?.low}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-text-dim text-[11px]">C:</span>
                  <span className={`font-bold ${(hoveredCandle || currentCandle)?.close >= (hoveredCandle || currentCandle)?.open ? 'text-white' : 'text-red-400'}`}>
                    ₹{hoveredCandle ? hoveredCandle.close : currentCandle?.close}
                  </span>
                </div>
                <div className="flex items-center gap-1 ml-auto">
                  <span className="text-text-dim text-[11px]">Vol:</span>
                  <span className="text-red-400 font-bold">{(hoveredCandle || currentCandle)?.volume?.toLocaleString()}</span>
                </div>
              </div>

              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-64">
                
                {/* Grid Lines */}
                {[0.2, 0.4, 0.6, 0.8].map(ratio => {
                  const y = chartHeight * ratio
                  const priceAtY = maxPrice - ratio * priceRange
                  return (
                    <g key={ratio}>
                      <line x1="0" y1={y} x2={chartWidth} y2={y} stroke="#181818" strokeDasharray="3 3" />
                      <text x={chartWidth - 55} y={y - 4} fill="#555" fontSize="10" fontFamily="monospace">
                        ₹{priceAtY.toFixed(1)}
                      </text>
                    </g>
                  )
                })}

                {/* Open Position Lines */}
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
                  </>
                )}

                {/* Candlesticks & Full-Height Hover Hit-Zones */}
                {visibleCandles.map((c, i) => {
                  const colWidth = (chartWidth - 70) / visibleCandles.length
                  const candleWidth = Math.max(14, Math.min(32, colWidth - 10))
                  const x = 30 + i * colWidth
                  const isGreen = c.close >= c.open
                  const color = isGreen ? '#FFFFFF' : '#EF4444'
                  const bodyTop = getY(Math.max(c.open, c.close))
                  const bodyBottom = getY(Math.min(c.open, c.close))
                  const bodyHeight = Math.max(3, bodyBottom - bodyTop)
                  const isHovered = hoveredCandle && hoveredCandle.time === c.time

                  return (
                    <g
                      key={i}
                      onMouseEnter={() => setHoveredCandle(c)}
                      onMouseLeave={() => setHoveredCandle(null)}
                      className="cursor-pointer"
                    >
                      {/* Full-Height Transparent Hit Zone */}
                      <rect
                        x={x - 4}
                        y={0}
                        width={colWidth}
                        height={chartHeight - 20}
                        fill={isHovered ? 'rgba(239, 68, 68, 0.08)' : 'transparent'}
                      />

                      {/* Hover Vertical Guide */}
                      {isHovered && (
                        <line
                          x1={x + candleWidth / 2}
                          y1={0}
                          x2={x + candleWidth / 2}
                          y2={chartHeight - 20}
                          stroke="#EF4444"
                          strokeWidth="1"
                          strokeDasharray="2 2"
                          opacity="0.5"
                        />
                      )}

                      {/* Top & Bottom Wicks */}
                      <line x1={x + candleWidth / 2} y1={getY(c.high)} x2={x + candleWidth / 2} y2={getY(c.low)} stroke={color} strokeWidth="1.5" />
                      
                      {/* Real Body */}
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
                      <text
                        x={x + candleWidth / 2}
                        y={chartHeight - 5}
                        fill={isHovered ? '#FFF' : '#555'}
                        fontSize="9"
                        textAnchor="middle"
                        fontFamily="monospace"
                        fontWeight={isHovered ? 'bold' : 'normal'}
                      >
                        {c.time}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>
          ) : (
            
            /* Mutual Fund NAV Compounding Chart */
            <div className="bg-void p-5 rounded-xl border border-border space-y-4">
              <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                <div className="bg-surface p-3 rounded-lg border border-border">
                  <span className="text-text-dim block text-[10px]">3-Year CAGR</span>
                  <span className="text-base font-black text-white">+{selectedAsset.cagr3y}%</span>
                </div>
                <div className="bg-surface p-3 rounded-lg border border-border">
                  <span className="text-text-dim block text-[10px]">Expense Ratio</span>
                  <span className="text-base font-black text-white">{selectedAsset.expenseRatio}%</span>
                </div>
                <div className="bg-surface p-3 rounded-lg border border-border">
                  <span className="text-text-dim block text-[10px]">AUM (Assets)</span>
                  <span className="text-base font-black text-white">{selectedAsset.aum}</span>
                </div>
              </div>

              {/* Top Holdings */}
              <div>
                <span className="text-xs font-mono font-bold text-text-muted uppercase tracking-wider block mb-2">Top Portfolio Holdings</span>
                <div className="flex flex-wrap gap-2">
                  {selectedAsset.topHoldings?.map((h, i) => (
                    <span key={i} className="text-xs font-mono bg-surface border border-border px-2.5 py-1 rounded-md text-white">
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ── RIGHT: Order Pad / Mutual Fund SIP / AI Doubt Solver (5 Cols) ── */}
        <div className="lg:col-span-5 space-y-4 flex flex-col h-full">
          
          {/* Panel Tab Switcher */}
          <div className="flex bg-void p-1 rounded-xl border border-border shrink-0">
            <button
              onClick={() => setActiveTab('order')}
              className={`flex-1 py-2 rounded-lg font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'order' ? 'bg-red-500 text-white shadow-md shadow-red-500/20' : 'text-text-muted hover:text-white'
              }`}
            >
              <Activity size={14} /> {selectedAsset.type === 'mutual_fund' ? 'SIP Calculator' : 'Order Ticket'}
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
            
            selectedAsset.type === 'stock' ? (
              
              /* ── Stock Order Execution Pad ── */
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
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted uppercase font-bold block mb-1">Target Price (₹)</label>
                      <input
                        type="number"
                        value={targetInput}
                        onChange={(e) => setTargetInput(e.target.value)}
                        className="w-full bg-void border border-border rounded-lg p-2.5 text-xs text-white font-bold focus:border-red-500 focus:outline-none"
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

                {/* Active Position Live PnL Box */}
                {openPosition && (
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
                        {livePnL >= 0 ? '+' : ''}₹{livePnL.toFixed(1)}
                      </span>
                    </div>

                    <button
                      onClick={() => closePosition(currentPrice, 'Manual Market Exit')}
                      className="w-full py-2.5 rounded-xl border border-red-500/40 text-xs font-mono font-bold text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      Market Close Position @ ₹{currentPrice}
                    </button>
                  </motion.div>
                )}
              </div>
            ) : (
              
              /* ── Mutual Fund SIP Investing Pad & Compounding Simulator ── */
              <div className="card rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-white">Systematic Investment Plan (SIP)</span>
                  <span className="text-xs font-mono text-white bg-white/10 px-2 py-0.5 rounded font-bold">Direct Plan</span>
                </div>

                {/* Monthly SIP Amount */}
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-text-muted">Monthly SIP Amount:</span>
                    <span className="text-white font-bold">₹{sipAmount.toLocaleString()} / month</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="10000"
                    step="500"
                    value={sipAmount}
                    onChange={(e) => setSipAmount(Number(e.target.value))}
                    className="w-full accent-red-500"
                  />
                </div>

                {/* Investment Horizon */}
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-text-muted">Investment Horizon:</span>
                    <span className="text-white font-bold">{sipTenureYears} Years</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    step="1"
                    value={sipTenureYears}
                    onChange={(e) => setSipTenureYears(Number(e.target.value))}
                    className="w-full accent-red-500"
                  />
                </div>

                {/* Compounding Output Stats */}
                <div className="bg-void p-4 rounded-xl border border-border space-y-2 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-text-dim">Total Invested Capital:</span>
                    <span className="text-white font-bold">₹{totalInvestedSip.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-dim">Est. Compounded Returns:</span>
                    <span className="text-white font-bold">+₹{wealthGained.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border text-sm">
                    <span className="text-red-400 font-extrabold">Projected Corpus:</span>
                    <span className="text-white font-black text-base">₹{projectedCorpus.toLocaleString()}</span>
                  </div>
                </div>

                {/* Start SIP Button */}
                <button
                  onClick={executeMutualFundSip}
                  className="w-full py-4 rounded-xl bg-red-gradient text-white font-extrabold uppercase tracking-wider text-xs hover:opacity-90 shadow-lg shadow-red-500/25 transition-all"
                >
                  Start Monthly SIP (₹{sipAmount.toLocaleString()})
                </button>

                {sipSuccessMsg && (
                  <div className="p-3 rounded-xl bg-white/10 border border-white/20 text-xs text-white font-medium">
                    {sipSuccessMsg}
                  </div>
                )}
              </div>
            )

          ) : (
            
            /* ── Interactive AI Doubt Solver ── */
            <div className="card rounded-2xl border border-border bg-surface flex flex-col h-[520px] overflow-hidden shadow-2xl">
              
              {/* Doubt Header */}
              <div className="p-4 border-b border-border bg-void flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Bot size={18} className="text-red-500" />
                  <div>
                    <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Trading Doubt Solver</h3>
                    <p className="text-[10px] text-text-muted">Instant AI mentor for {selectedAsset.symbol}</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono bg-red-500/20 text-red-400 border border-red-500/40 px-2 py-0.5 rounded font-bold">LIVE COPILOT</span>
              </div>

              {/* Quick Doubts Suggestions */}
              <div className="p-2 border-b border-border bg-void/50 flex gap-1.5 overflow-x-auto scrollbar-none shrink-0">
                {[
                  `Why invest in ${selectedAsset.symbol}`,
                  'What is a stop loss',
                  'Why do candles have wicks',
                  'How does SIP compounding work'
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
                      Analyzing {selectedAsset.symbol} setup...
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
                  placeholder={`Ask any doubt about ${selectedAsset.symbol}...`}
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
