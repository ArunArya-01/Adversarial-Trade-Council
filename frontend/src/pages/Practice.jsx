import { useState, useEffect, useRef } from 'react'
import { Target, Play, Pause, SkipForward, RotateCcw, TrendingUp, TrendingDown, ShieldAlert, Zap, CheckCircle2, XCircle, ArrowUpRight, ArrowDownRight, DollarSign, Activity, MessageSquareQuote, Send, Sparkles, HelpCircle, Bot, ChevronDown, Search, Layers, PieChart, Landmark, Globe, BarChart2, Calendar, ZoomIn, ZoomOut, Sliders } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../store/useStore'
import ProgressBar from '../components/ui/ProgressBar'

// ── Multi-Asset Universal Directory ──
const ASSETS_DIRECTORY = [
  {
    id: 'hdfc-bank',
    type: 'stock',
    symbol: 'HDFCBANK',
    name: 'HDFC Bank Ltd.',
    market: 'NSE · Banking',
    category: 'Stocks',
    price: 1585.00,
    change: -2.40,
    pe: 18.5,
    high52: 1794.0,
    low52: 1363.0,
    marketBehavior: '📉 Sustained Downtrend (Red Candles Dominating - Practice Shorting)',
    context: 'HDFC Bank in sustained downtrend following NIM margin compression. Notice the series of lower highs and lower lows breaking key horizontal supports.',
    stopLossPrice: 1610,
    targetPrice: 1540
  },
  {
    id: 'tatamotors',
    type: 'stock',
    symbol: 'TATAMOTORS',
    name: 'Tata Motors Passenger Vehicles Ltd.',
    market: 'NSE · Auto & EV',
    category: 'Stocks',
    price: 985.20,
    change: 1.80,
    pe: 18.2,
    high52: 1179.0,
    low52: 620.0,
    marketBehavior: '🌊 Cyclical Wave Channel (Alternating Green Rallies & Red Dips)',
    context: 'Tata Motors moves in natural waves — green rallies followed by red pullbacks bouncing from institutional moving averages.',
    stopLossPrice: 965,
    targetPrice: 1020
  },
  {
    id: 'reliance',
    type: 'stock',
    symbol: 'RELIANCE',
    name: 'Reliance Industries Ltd.',
    market: 'NSE · Energy & Telecom',
    category: 'Stocks',
    price: 2940.50,
    change: 0.35,
    pe: 26.4,
    high52: 3217.0,
    low52: 2220.0,
    marketBehavior: '↔️ Sideways Range Box (Equal Green & Red Support Tests)',
    context: 'Reliance oscillating inside a horizontal trading box between support (₹2,880) and resistance (₹3,020).',
    stopLossPrice: 2915,
    targetPrice: 2990
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
    marketBehavior: '🚀 Strong Bullish Uptrend (Dominant Green Breakouts)',
    context: 'Blinkit quick-commerce dark stores expand 120% YoY reaching positive EBITDA. Institutional FII net buying aggressive above ₹260.',
    stopLossPrice: 254,
    targetPrice: 280
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
    marketBehavior: '⚡ Tight Consolidation into Green Breakout',
    context: 'Infosys beat Q2 estimates (Profit +24% YoY) and raised full-year guidance. Stock broke out of a 3-week consolidation at ₹1,480.',
    stopLossPrice: 1465,
    targetPrice: 1530
  },
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
    context: 'High-conviction value-investing fund holding cash reserves during overbought markets and investing up to 20% in global tech compounders.'
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
    context: 'Ultra low-cost fund matching the exact 50 bluechip companies of India with minimal tracking error.'
  },
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
    marketBehavior: '📈 Institutional Step-Up Compounder',
    context: 'Apple broke above all-time high resistance of $182 following keynote announcement of neural AI hardware. Zero overhead supply resistance.',
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
    marketBehavior: '🚀 Hyper-Growth Momentum (Strong Green Impulse Waves)',
    context: 'Data center GPU demand up 400% YoY with global cloud providers accelerating Blackwell architecture buildouts.',
    stopLossPrice: 124,
    targetPrice: 134
  }
]

export default function Practice() {
  const [selectedAsset, setSelectedAsset] = useState(ASSETS_DIRECTORY[0])
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D')
  const [chartType, setChartType] = useState('candles')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Candles from backend API
  const [candlesData, setCandlesData] = useState([])
  const [revealedCount, setRevealedCount] = useState(40)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hoveredCandle, setHoveredCandle] = useState(null)
  const [activeTab, setActiveTab] = useState('order')

  // Trading State (Stocks)
  const [tradeQuantity, setTradeQuantity] = useState(10)
  const [stopLossInput, setStopLossInput] = useState('')
  const [targetInput, setTargetInput] = useState('')
  const [openPosition, setOpenPosition] = useState(null)
  const [tradeOutcome, setTradeOutcome] = useState(null)

  // SIP State (Mutual Funds)
  const [sipAmount, setSipAmount] = useState(2500)
  const [sipTenureYears, setSipTenureYears] = useState(15)
  const [sipSuccessMsg, setSipSuccessMsg] = useState(null)

  // AI Doubt State
  const [doubtMessages, setDoubtMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: '👋 I am your AI Trading Mentor. Notice the Green (Bullish) and Red (Bearish) candles. Ask me any doubt about downtrends, shorting HDFC Bank, 20/50 EMA dynamic support, or SIP compounding!'
    }
  ])
  const [doubtInput, setDoubtInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const chatBottomRef = useRef(null)
  const chartScrollContainerRef = useRef(null)

  const portfolio = useStore(s => s.portfolio)
  const updatePortfolio = useStore(s => s.updatePortfolio)
  const resetPortfolio = useStore(s => s.resetPortfolio)

  const timerRef = useRef(null)

  // Fetch Historical Candles from Backend
  useEffect(() => {
    if (selectedAsset.type === 'stock') {
      fetch(`/api/practice/candles?symbol=${selectedAsset.symbol}&timeframe=${selectedTimeframe}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.candles && data.candles.length > 0) {
            setCandlesData(data.candles)
            setRevealedCount(selectedTimeframe === '1D' ? Math.min(40, data.candles.length) : data.candles.length)
          }
        })
        .catch(err => {
          console.error('Failed to fetch backend candles', err)
        })
      setHoveredCandle(null)
      setTimeout(() => {
        if (chartScrollContainerRef.current) {
          chartScrollContainerRef.current.scrollLeft = chartScrollContainerRef.current.scrollWidth
        }
      }, 80)
    }
  }, [selectedAsset, selectedTimeframe])

  // Filtered Assets
  const filteredAssets = ASSETS_DIRECTORY.filter(a => {
    const matchesCat = categoryFilter === 'All' || a.category === categoryFilter
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCat && matchesSearch
  })

  // Select Asset
  const handleSelectAsset = (asset) => {
    setSelectedAsset(asset)
    setIsPlaying(false)
    setOpenPosition(null)
    setTradeOutcome(null)
    setSipSuccessMsg(null)
    setHoveredCandle(null)
    if (asset.type === 'stock') {
      setStopLossInput(String(asset.stopLossPrice || (asset.price * 0.98).toFixed(1)))
      setTargetInput(String(asset.targetPrice || (asset.price * 1.04).toFixed(1)))
    }
  }

  // Current Stock Price / Visible Candles
  const visibleCandles = selectedAsset.type === 'stock' ? candlesData.slice(0, revealedCount) : []
  const currentCandle = visibleCandles[visibleCandles.length - 1]
  const currentPrice = selectedAsset.type === 'stock' ? (currentCandle?.close || selectedAsset.price) : selectedAsset.nav
  const isPositiveDay = selectedAsset.change >= 0

  // Replay Step Forward
  const stepForward = () => {
    if (revealedCount < candlesData.length) {
      setRevealedCount(prev => prev + 1)
    } else {
      setIsPlaying(false)
    }
  }

  // Play / Pause Replay Loop
  useEffect(() => {
    if (isPlaying && selectedAsset.type === 'stock') {
      timerRef.current = setInterval(() => {
        setRevealedCount(prev => {
          if (prev < candlesData.length) {
            return prev + 1
          } else {
            setIsPlaying(false)
            return prev
          }
        })
      }, 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [isPlaying, candlesData])

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

  // Position Stop Loss / Target Checker
  useEffect(() => {
    if (!openPosition) return
    const pos = openPosition
    if (pos.direction === 'BUY' && currentPrice >= pos.target) {
      closePosition(currentPrice, 'Target Reached 🎯')
    } else if (pos.direction === 'BUY' && currentPrice <= pos.stopLoss) {
      closePosition(currentPrice, 'Stop-Loss Hit 🛑')
    } else if (pos.direction === 'SELL' && currentPrice <= pos.target) {
      closePosition(currentPrice, 'Target Reached 🎯 (Short Profit)')
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
      if (lower.includes('green') || lower.includes('red') || lower.includes('color')) {
        answer = `**Candlestick Colors**: 🟢 **Green Candles** mean the price closed HIGHER than it opened (Buyers won that session). 🔴 **Red Candles** mean the price closed LOWER than it opened (Sellers dominated). Look at **HDFC Bank** for a dominant red downtrend vs **Zomato** for a strong green uptrend!`
      } else if (lower.includes('down') || lower.includes('bearish') || lower.includes('hdfc') || lower.includes('short')) {
        answer = `**Downtrend & Short-Selling**: Notice **HDFC Bank** with red candles driving the price down. When a stock breaks below the 20 & 50 EMA, click **\`SELL / SHORT\`** to profit from the decline!`
      } else if (lower.includes('rsi')) {
        answer = `The **RSI (14) indicator** below calculates momentum smoothly. An RSI value **under 30** means oversold; **above 70** means overbought. Current RSI is **${Math.round(currentRsi)}**.`
      } else {
        answer = `Regarding **"${q}"** for **${selectedAsset.name}**: Market behavior is **${selectedAsset.marketBehavior || 'Dynamic'}**. Check the Green/Red candle rhythm and the 20/50 EMA before entering.`
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

  // SIP Compounding Calculator Formula
  const monthlyRate = (selectedAsset.cagr3y || 14) / 100 / 12
  const totalMonths = sipTenureYears * 12
  const totalInvestedSip = sipAmount * totalMonths
  const projectedCorpus = Math.round(
    sipAmount * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate)
  )
  const wealthGained = projectedCorpus - totalInvestedSip

  // ── Calculate Smooth EMA and Smooth Wilder's RSI ──
  const calculateEma = (period) => {
    const k = 2 / (period + 1)
    let emaArray = []
    let ema = visibleCandles[0]?.close || 0
    visibleCandles.forEach((c) => {
      ema = c.close * k + ema * (1 - k)
      emaArray.push(ema)
    })
    return emaArray
  }

  const ema20 = calculateEma(20)
  const ema50 = calculateEma(50)

  // Smooth Wilder's RSI Algorithm
  const calculateSmoothRsi = () => {
    if (visibleCandles.length < 5) return [50]
    let gains = 0, losses = 0
    let rsiArray = []
    
    for (let i = 1; i < Math.min(14, visibleCandles.length); i++) {
      const diff = visibleCandles[i].close - visibleCandles[i - 1].close
      if (diff >= 0) gains += diff
      else losses += Math.abs(diff)
      rsiArray.push(50)
    }
    
    let avgGain = gains / 14
    let avgLoss = losses / 14
    
    for (let i = 14; i < visibleCandles.length; i++) {
      const diff = visibleCandles[i].close - visibleCandles[i - 1].close
      const gain = diff > 0 ? diff : 0
      const loss = diff < 0 ? Math.abs(diff) : 0
      
      avgGain = (avgGain * 13 + gain) / 14
      avgLoss = (avgLoss * 13 + loss) / 14
      
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
      const rsi = 100 - (100 / (1 + rs))
      rsiArray.push(Math.max(15, Math.min(85, rsi)))
    }
    return rsiArray
  }

  const rsiValues = calculateSmoothRsi()
  const currentRsi = rsiValues[rsiValues.length - 1] || 50

  // SVG Chart Dimensions with Horizontal Scroll Width
  const chartHeight = 260
  const candleColWidth = 24
  const chartWidth = Math.max(760, visibleCandles.length * candleColWidth + 90)
  const rsiHeight = 75

  const minPrice = visibleCandles.length > 0 ? Math.min(...visibleCandles.map(c => c.low)) * 0.995 : 100
  const maxPrice = visibleCandles.length > 0 ? Math.max(...visibleCandles.map(c => c.high)) * 1.005 : 200
  const priceRange = maxPrice - minPrice || 1
  const getY = (val) => chartHeight - ((val - minPrice) / priceRange) * (chartHeight - 50) - 25
  const getRsiY = (val) => rsiHeight - (val / 100) * (rsiHeight - 20) - 10

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* ── Top Bar & Live Capital ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1 font-mono text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-emerald-400 font-extrabold uppercase tracking-widest">Live Multi-Regime Financial Terminal</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <Activity className="text-red-500" size={26} /> Institutional Candlestick & Behavior Terminal
          </h1>
          <p className="text-xs text-text-muted mt-0.5">🟢 Green (Bullish) and 🔴 Red (Bearish) Candlesticks across distinct real-world trends (Downtrends, Consolidations, Breakouts & Cyclical Swings).</p>
        </div>

        {/* Live Capital Stats */}
        <div className="flex items-center gap-4 bg-void p-3 rounded-2xl border border-border">
          <div className="pr-4 border-r border-border font-mono">
            <div className="text-[10px] text-text-dim uppercase tracking-wider">Simulated Capital</div>
            <div className="text-lg font-black text-white">₹{portfolio.totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          </div>
          <div className="pr-4 border-r border-border font-mono">
            <div className="text-[10px] text-text-dim uppercase tracking-wider">Overall Return</div>
            <div className={`text-sm font-black ${portfolio.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
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
            placeholder="Search stock or fund (e.g. HDFC Bank, Reliance, Zomato)..."
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
            className={`p-3.5 rounded-xl border text-left transition-all shrink-0 min-w-[215px] ${
              selectedAsset.id === asset.id
                ? 'bg-red-500/15 border-red-500 shadow-md shadow-red-500/10'
                : 'bg-surface border-border hover:border-red-500/40'
            }`}
          >
            <div className="flex items-center justify-between font-mono mb-1">
              <span className="font-black text-white text-sm">{asset.symbol}</span>
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${asset.change < 0 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                {asset.type === 'mutual_fund' ? 'SIP Fund' : asset.change < 0 ? '📉 Downtrend' : '🟢 Stock'}
              </span>
            </div>
            <div className="text-xs text-text-muted truncate mb-2">{asset.name}</div>
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="font-black text-white">₹{asset.price || asset.nav}</span>
              <span className={`font-bold ${asset.change < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {asset.change ? `${asset.change >= 0 ? '+' : ''}${asset.change}%` : `${asset.cagr3y}% 3Y CAGR`}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* ── Main Trading Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ── LEFT: Multi-Timeframe Chart Terminal (8 Cols) ── */}
        <div className="lg:col-span-8 card rounded-2xl border border-border bg-surface p-5 flex flex-col justify-between shadow-2xl space-y-4">
          
          {/* Top Asset & Timeframe Header */}
          <div className="flex flex-wrap items-center justify-between border-b border-border pb-3 gap-2">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xl font-black text-white font-mono">{selectedAsset.symbol}</span>
                <span className="text-xs text-text-muted font-mono">{selectedAsset.market}</span>
                <span className={`text-[11px] px-2.5 py-0.5 rounded font-bold font-mono ${selectedAsset.change < 0 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  {selectedAsset.change ? `${selectedAsset.change >= 0 ? '+' : ''}${selectedAsset.change}%` : 'NAV Quote'}
                </span>
              </div>
              <div className="text-2xl font-black font-mono text-white mt-1">
                ₹{currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* Timeframe Selectors & Chart Type Toggles */}
            {selectedAsset.type === 'stock' && (
              <div className="flex flex-wrap items-center gap-2 font-mono">
                
                {/* Timeframe Chips */}
                <div className="flex bg-void p-1 rounded-xl border border-border text-xs">
                  {['1D', '1W', '1M', '1Y', '5Y', 'ALL'].map(tf => (
                    <button
                      key={tf}
                      onClick={() => setSelectedTimeframe(tf)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                        selectedTimeframe === tf
                          ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                          : 'text-text-muted hover:text-white'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>

                {/* Chart Style Toggle */}
                <div className="flex bg-void p-1 rounded-xl border border-border text-xs">
                  <button
                    onClick={() => setChartType('candles')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      chartType === 'candles' ? 'bg-white text-black' : 'text-text-muted hover:text-white'
                    }`}
                  >
                    Candles
                  </button>
                  <button
                    onClick={() => setChartType('line')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      chartType === 'line' ? 'bg-white text-black' : 'text-text-muted hover:text-white'
                    }`}
                  >
                    Line
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Asset Regime & Behavior Banner */}
          <div className="bg-void p-3 rounded-xl border border-border/80 text-xs leading-relaxed text-text-secondary flex items-center justify-between">
            <div>
              <strong className="text-red-400 uppercase tracking-wider font-mono mr-2 font-bold">
                Market Structure:
              </strong>
              <span className="text-white font-semibold mr-3">{selectedAsset.marketBehavior || 'Standard Market Regime'}</span>
              <p className="text-[11px] text-text-muted mt-1">{selectedAsset.context}</p>
            </div>
          </div>

          {/* Indicator Legend Bar */}
          {selectedAsset.type === 'stock' && (
            <div className="flex flex-wrap items-center justify-between text-[11px] font-mono bg-void px-3 py-2 rounded-xl border border-border/80 text-text-secondary">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm inline-block" /> 🟢 Green (Up)
                </span>
                <span className="flex items-center gap-1 text-red-400 font-bold">
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-sm inline-block" /> 🔴 Red (Down)
                </span>
                <span className="flex items-center gap-1 text-cyan-400 font-bold">
                  <span className="w-2.5 h-0.5 bg-cyan-400 inline-block" /> 20 EMA
                </span>
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <span className="w-2.5 h-0.5 bg-amber-400 inline-block" /> 50 EMA
                </span>
                <span className="flex items-center gap-1 text-purple-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" /> RSI: {Math.round(currentRsi)}
                </span>
              </div>
              <span className="text-text-dim text-[10px] flex items-center gap-1">
                ↔ Drag / Scroll horizontally
              </span>
            </div>
          )}

          {/* ── Horizontally Scrollable Candlestick / Line Chart Viewport ── */}
          {selectedAsset.type === 'stock' && visibleCandles.length > 0 ? (
            
            <div className="relative w-full bg-void rounded-xl border border-border p-3 overflow-hidden select-none space-y-2">
              
              {/* Permanent OHLCV Header Bar */}
              <div className="flex flex-wrap items-center gap-3 md:gap-4 px-2 py-1 rounded-lg bg-surface/80 border border-border/60 font-mono text-xs text-text-secondary">
                <span className="text-[11px] text-text-dim uppercase font-bold">
                  {hoveredCandle ? `Period: ${hoveredCandle.time}` : `Latest: ${currentCandle?.time || 'Now'}`}
                </span>
                <div><span className="text-text-dim text-[11px]">O:</span> <strong className="text-white">₹{hoveredCandle ? hoveredCandle.open : currentCandle?.open}</strong></div>
                <div><span className="text-text-dim text-[11px]">H:</span> <strong className="text-white">₹{hoveredCandle ? hoveredCandle.high : currentCandle?.high}</strong></div>
                <div><span className="text-text-dim text-[11px]">L:</span> <strong className="text-white">₹{hoveredCandle ? hoveredCandle.low : currentCandle?.low}</strong></div>
                <div>
                  <span className="text-text-dim text-[11px]">C:</span>{' '}
                  <strong className={`font-bold ${(hoveredCandle || currentCandle)?.close >= (hoveredCandle || currentCandle)?.open ? 'text-emerald-400' : 'text-red-400'}`}>
                    ₹{hoveredCandle ? hoveredCandle.close : currentCandle?.close}
                  </strong>
                </div>
                <div className="ml-auto">
                  <span className="text-text-dim text-[11px]">Vol:</span>{' '}
                  <strong className={`${(hoveredCandle || currentCandle)?.close >= (hoveredCandle || currentCandle)?.open ? 'text-emerald-400' : 'text-red-400'}`}>
                    {(hoveredCandle || currentCandle)?.volume?.toLocaleString()}
                  </strong>
                </div>
              </div>

              {/* Scrollable Canvas Container */}
              <div ref={chartScrollContainerRef} className="overflow-x-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-void pb-2">
                <svg width={chartWidth} height={chartHeight} className="bg-void/50 rounded-lg">
                  
                  {/* Horizontal Grid Lines */}
                  {[0.2, 0.4, 0.6, 0.8].map(ratio => {
                    const y = chartHeight * ratio
                    const priceAtY = maxPrice - ratio * priceRange
                    return (
                      <g key={ratio}>
                        <line x1="0" y1={y} x2={chartWidth} y2={y} stroke="#181818" strokeDasharray="3 3" />
                        <text x={chartWidth - 55} y={y - 4} fill="#444" fontSize="9" fontFamily="monospace">
                          ₹{priceAtY.toFixed(1)}
                        </text>
                      </g>
                    )
                  })}

                  {/* Current Live Price Dashed Line & Badge on Axis */}
                  <line
                    x1="0"
                    y1={getY(currentPrice)}
                    x2={chartWidth - 65}
                    y2={getY(currentPrice)}
                    stroke={isPositiveDay ? '#22C55E' : '#EF4444'}
                    strokeWidth="1.2"
                    strokeDasharray="3 3"
                    opacity="0.85"
                  />
                  <rect
                    x={chartWidth - 65}
                    y={getY(currentPrice) - 9}
                    width="62"
                    height="18"
                    fill={isPositiveDay ? '#22C55E' : '#EF4444'}
                    rx="3"
                  />
                  <text
                    x={chartWidth - 34}
                    y={getY(currentPrice) + 3.5}
                    fill="#FFFFFF"
                    fontSize="9.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    ₹{currentPrice.toFixed(1)}
                  </text>

                  {/* Open Position Lines */}
                  {openPosition && (
                    <>
                      <line x1="0" y1={getY(openPosition.entryPrice)} x2={chartWidth} y2={getY(openPosition.entryPrice)} stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="4 4" />
                      <text x="10" y={getY(openPosition.entryPrice) - 4} fill="#FFF" fontSize="9" fontFamily="monospace" fontWeight="bold">
                        Entry @ ₹{openPosition.entryPrice}
                      </text>
                      <line x1="0" y1={getY(openPosition.stopLoss)} x2={chartWidth} y2={getY(openPosition.stopLoss)} stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3 3" />
                      <text x="10" y={getY(openPosition.stopLoss) - 4} fill="#EF4444" fontSize="9" fontFamily="monospace">
                        SL @ ₹{openPosition.stopLoss}
                      </text>
                    </>
                  )}

                  {/* 20 EMA Line (Cyan) */}
                  <path
                    d={visibleCandles.map((_, i) => {
                      const x = 25 + i * candleColWidth + candleColWidth / 2
                      const y = getY(ema20[i])
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
                    }).join(' ')}
                    fill="none"
                    stroke="#22D3EE"
                    strokeWidth="1.5"
                    opacity="0.85"
                  />

                  {/* 50 EMA Line (Amber) */}
                  <path
                    d={visibleCandles.map((_, i) => {
                      const x = 25 + i * candleColWidth + candleColWidth / 2
                      const y = getY(ema50[i])
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
                    }).join(' ')}
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="1.5"
                    opacity="0.85"
                  />

                  {/* Chart Style: Dynamic Up/Down Line Chart Mode */}
                  {chartType === 'line' ? (
                    <>
                      <path
                        d={`M 25 ${chartHeight - 20} ` + visibleCandles.map((c, i) => {
                          const x = 25 + i * candleColWidth + candleColWidth / 2
                          return `L ${x} ${getY(c.close)}`
                        }).join(' ') + ` L ${25 + (visibleCandles.length - 1) * candleColWidth + candleColWidth / 2} ${chartHeight - 20} Z`}
                        fill={isPositiveDay ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)'}
                      />
                      {visibleCandles.map((c, i) => {
                        if (i === 0) return null
                        const prev = visibleCandles[i - 1]
                        const isUp = c.close >= prev.close
                        const x1 = 25 + (i - 1) * candleColWidth + candleColWidth / 2
                        const y1 = getY(prev.close)
                        const x2 = 25 + i * candleColWidth + candleColWidth / 2
                        const y2 = getY(c.close)
                        return (
                          <line
                            key={i}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke={isUp ? '#22C55E' : '#EF4444'}
                            strokeWidth="2.2"
                          />
                        )
                      })}
                    </>
                  ) : (
                    
                    /* Chart Style: Real Japanese Green & Red Candlestick Mode */
                    visibleCandles.map((c, i) => {
                      const candleWidth = Math.max(8, candleColWidth - 6)
                      const x = 25 + i * candleColWidth
                      const isGreen = c.close >= c.open
                      const candleColor = isGreen ? '#22C55E' : '#EF4444'
                      const bodyTop = getY(Math.max(c.open, c.close))
                      const bodyBottom = getY(Math.min(c.open, c.close))
                      const bodyHeight = Math.max(3, bodyBottom - bodyTop)
                      const isHovered = hoveredCandle && hoveredCandle.time === c.time && hoveredCandle.open === c.open

                      // Bottom Volume Bar height
                      const maxVol = Math.max(...visibleCandles.map(v => v.volume || 10000))
                      const volHeight = Math.min(35, ((c.volume || 10000) / maxVol) * 35)

                      return (
                        <g
                          key={i}
                          onMouseEnter={() => setHoveredCandle(c)}
                          onMouseLeave={() => setHoveredCandle(null)}
                          className="cursor-pointer"
                        >
                          {/* Column Hit-Zone */}
                          <rect
                            x={x - 2}
                            y={0}
                            width={candleColWidth}
                            height={chartHeight}
                            fill={isHovered ? (isGreen ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)') : 'transparent'}
                          />

                          {/* Hover Crosshair Guide */}
                          {isHovered && (
                            <line
                              x1={x + candleWidth / 2}
                              y1={0}
                              x2={x + candleWidth / 2}
                              y2={chartHeight}
                              stroke={candleColor}
                              strokeWidth="1"
                              strokeDasharray="2 2"
                              opacity="0.6"
                            />
                          )}

                          {/* Top & Bottom Wicks */}
                          <line
                            x1={x + candleWidth / 2}
                            y1={getY(c.high)}
                            x2={x + candleWidth / 2}
                            y2={getY(c.low)}
                            stroke={candleColor}
                            strokeWidth="1.4"
                          />
                          
                          {/* Real Body (Green for Up, Red for Down) */}
                          <rect
                            x={x}
                            y={bodyTop}
                            width={candleWidth}
                            height={bodyHeight}
                            fill={candleColor}
                            stroke={candleColor}
                            rx="1"
                          />

                          {/* Bottom Volume Bar */}
                          <rect
                            x={x}
                            y={chartHeight - 16 - volHeight}
                            width={candleWidth}
                            height={volHeight}
                            fill={candleColor}
                            opacity="0.35"
                            rx="0.5"
                          />

                          {/* Period Date/Time Label */}
                          {i % Math.max(1, Math.floor(visibleCandles.length / 9)) === 0 && (
                            <text
                              x={x + candleWidth / 2}
                              y={chartHeight - 3}
                              fill="#666"
                              fontSize="8"
                              textAnchor="middle"
                              fontFamily="monospace"
                            >
                              {c.time}
                            </text>
                          )}
                        </g>
                      )
                    })
                  )}
                </svg>
              </div>

              {/* Dedicated RSI Panel */}
              <div className="pt-2 border-t border-border/80">
                <div className="flex items-center justify-between text-[10px] font-mono text-text-dim px-2 mb-1">
                  <span className="text-purple-400 font-bold">RSI (14) Indicator · {selectedTimeframe}</span>
                  <span className="text-text-muted">Overbought: 70 · Oversold: 30</span>
                </div>
                <div className="overflow-x-auto scrollbar-none">
                  <svg width={chartWidth} height={rsiHeight} className="bg-void/50 rounded-lg">
                    <line x1="0" y1={getRsiY(70)} x2={chartWidth} y2={getRsiY(70)} stroke="#EF4444" strokeDasharray="2 2" strokeWidth="1" opacity="0.4" />
                    <text x={chartWidth - 25} y={getRsiY(70) + 3} fill="#EF4444" fontSize="8" fontFamily="monospace">70</text>
                    
                    <line x1="0" y1={getRsiY(30)} x2={chartWidth} y2={getRsiY(30)} stroke="#10B981" strokeDasharray="2 2" strokeWidth="1" opacity="0.4" />
                    <text x={chartWidth - 25} y={getRsiY(30) + 3} fill="#10B981" fontSize="8" fontFamily="monospace">30</text>

                    <path
                      d={visibleCandles.map((_, i) => {
                        const x = 25 + i * candleColWidth + candleColWidth / 2
                        const y = getRsiY(rsiValues[i] || 50)
                        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
                      }).join(' ')}
                      fill="none"
                      stroke="#C084FC"
                      strokeWidth="1.8"
                    />
                  </svg>
                </div>
              </div>

            </div>
          ) : (
            
            /* Mutual Fund Fundamentals & NAV View */
            <div className="bg-void p-5 rounded-xl border border-border space-y-4">
              <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                <div className="bg-surface p-3 rounded-lg border border-border">
                  <span className="text-text-dim block text-[10px]">3-Year CAGR</span>
                  <span className="text-base font-black text-emerald-400">+{selectedAsset.cagr3y}%</span>
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

        {/* ── RIGHT: Order Execution Pad & AI Doubt Copilot (4 Cols) ── */}
        <div className="lg:col-span-4 space-y-4 flex flex-col h-full">
          
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
                      className="py-4 rounded-xl bg-emerald-500 text-white font-black uppercase tracking-wider text-xs hover:bg-emerald-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
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
                      <span className={`font-bold px-2 py-0.5 rounded border ${openPosition.direction === 'BUY' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-300 border-red-500/40'}`}>
                        {openPosition.direction} {openPosition.quantity} QTY
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-2 border-y border-border font-mono">
                      <span className="text-xs text-text-muted">Unrealized PnL:</span>
                      <span className={`text-base font-black ${livePnL >= 0 ? 'text-emerald-400 font-extrabold' : 'text-red-400'}`}>
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
              
              /* ── Mutual Fund SIP Investing Pad ── */
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

              {/* Quick Doubts */}
              <div className="p-2 border-b border-border bg-void/50 flex gap-1.5 overflow-x-auto scrollbar-none shrink-0">
                {[
                  `Why are candles Green and Red`,
                  `How to profit from falling ${selectedAsset.symbol}`,
                  'What is 20 EMA and 50 EMA',
                  'What is RSI overbought vs oversold'
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

              {/* Messages */}
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
                      Analyzing {selectedAsset.symbol} chart...
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
