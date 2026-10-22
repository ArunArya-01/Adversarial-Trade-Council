import { useState, useEffect, useRef } from 'react'
import { Target, Play, Pause, SkipForward, RotateCcw, TrendingUp, TrendingDown, ShieldAlert, Zap, CheckCircle2, XCircle, ArrowUpRight, ArrowDownRight, DollarSign, Activity, MessageSquareQuote, Send, Sparkles, HelpCircle, Bot, ChevronDown, Search, Layers, PieChart, Landmark, Globe, BarChart2, Calendar, ZoomIn, ZoomOut, Sliders, Clock, Flame, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../store/useStore'
import ProgressBar from '../components/ui/ProgressBar'
import TradingViewChart from '../components/practice/TradingViewChart'

// Initial Default Candles Helper
function getDefaultCandles(basePrice = 1600, trend = 'downtrend') {
  const arr = []
  let curr = basePrice * 1.05
  for (let i = 0; i < 45; i++) {
    const delta = (Math.sin(i * 0.4) * 0.4 + (trend === 'downtrend' ? -0.28 : 0.28)) * curr * 0.008
    const o = Math.round(curr * 10) / 10
    const cl = Math.round(Math.max(10, curr + delta) * 10) / 10
    const h = Math.round((Math.max(o, cl) + Math.abs(delta) * 0.5) * 10) / 10
    const l = Math.round((Math.min(o, cl) - Math.abs(delta) * 0.5) * 10) / 10
    arr.push({ time: `T${i+1}`, open: o, high: h, low: l, close: cl, volume: 35000 + i * 800 })
    curr = cl
  }
  return arr
}

// ── Multi-Asset Universal Directory ──
const ASSETS_DIRECTORY = [
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
  const [showEma, setShowEma] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Candles from backend API + Live Ticking
  const [candlesData, setCandlesData] = useState(() => getDefaultCandles(265, 'uptrend'))
  const [latestTick, setLatestTick] = useState(null)
  const [livePriceFlash, setLivePriceFlash] = useState(null) // 'up' | 'down' | null
  const [liveSpeed, setLiveSpeed] = useState(1) // 1x, 3x, 8x
  const [isLiveMarketActive, setIsLiveMarketActive] = useState(true)
  const [marketClock, setMarketClock] = useState({ hour: 9, minute: 32, second: 15 })

  const [crosshairData, setCrosshairData] = useState(null)
  const [activeTab, setActiveTab] = useState('order')
  const [orderToast, setOrderToast] = useState(null)

  // Trading State (Stocks)
  const [tradeQuantity, setTradeQuantity] = useState(25)
  const [stopLossInput, setStopLossInput] = useState('254')
  const [targetInput, setTargetInput] = useState('280')
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
      text: '👋 I am your AI Trading Mentor. You are in the **Live Simulated Trading Session (9:15 AM - 3:30 PM)**! Notice the price ticking second-by-second. Click **BUY** or **SELL** to enter a live trade and watch your PnL fluctuate in real-time!'
    }
  ])
  const [doubtInput, setDoubtInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const chatBottomRef = useRef(null)

  const portfolio = useStore(s => s.portfolio)
  const updatePortfolio = useStore(s => s.updatePortfolio)
  const resetPortfolio = useStore(s => s.resetPortfolio)

  // Fetch Historical Candles from Backend
  useEffect(() => {
    if (selectedAsset.type === 'stock') {
      fetch(`/api/academy/practice/candles?symbol=${selectedAsset.symbol}&timeframe=${selectedTimeframe}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.candles && data.candles.length > 0) {
            setCandlesData(data.candles)
            const last = data.candles[data.candles.length - 1]
            setLatestTick(last)
          }
        })
        .catch(err => {
          console.error('Failed to fetch backend candles', err)
        })
      setCrosshairData(null)
    }
  }, [selectedAsset, selectedTimeframe])

  // ── Real-Time Market Tick Engine (Second-by-Second Price Action) ──
  useEffect(() => {
    if (!isLiveMarketActive || selectedAsset.type !== 'stock' || candlesData.length === 0) return

    const tickIntervalMs = Math.max(300, 1000 / liveSpeed)

    const interval = setInterval(() => {
      // 1. Advance market clock
      setMarketClock(prev => {
        let sec = prev.second + (liveSpeed >= 3 ? 15 : 1)
        let min = prev.minute
        let hr = prev.hour
        if (sec >= 60) {
          min += Math.floor(sec / 60)
          sec = sec % 60
        }
        if (min >= 60) {
          hr += Math.floor(min / 60)
          min = min % 60
        }
        if (hr > 15 || (hr === 15 && min > 30)) {
          // Market Day Close -> Reset to 09:15 AM
          hr = 9
          min = 15
          sec = 0
        }
        return { hour: hr, minute: min, second: sec }
      })

      // 2. Compute tick price change
      setCandlesData(prev => {
        if (!prev || prev.length === 0) return prev
        const lastIdx = prev.length - 1
        const active = { ...prev[lastIdx] }

        // Micro tick step based on asset volatility
        const isBullishAsset = selectedAsset.marketBehavior.includes('Uptrend') || selectedAsset.marketBehavior.includes('Breakout')
        const isBearishAsset = selectedAsset.marketBehavior.includes('Downtrend')
        
        const tickDelta = (Math.random() - (isBullishAsset ? 0.44 : isBearishAsset ? 0.56 : 0.49)) * active.close * 0.0018
        const newClose = Math.round(Math.max(5.0, active.close + tickDelta) * 100) / 100
        const newHigh = Math.round(Math.max(active.high, newClose) * 100) / 100
        const newLow = Math.round(Math.min(active.low, newClose) * 100) / 100
        const newVol = (active.volume || 30000) + Math.floor(Math.random() * 400 + 50)

        const updatedCandle = {
          ...active,
          close: newClose,
          high: newHigh,
          low: newLow,
          volume: newVol,
        }

        setLatestTick(updatedCandle)
        setLivePriceFlash(tickDelta >= 0 ? 'up' : 'down')
        setTimeout(() => setLivePriceFlash(null), 350)

        const copy = [...prev]
        copy[lastIdx] = updatedCandle
        return copy
      })
    }, tickIntervalMs)

    return () => clearInterval(interval)
  }, [isLiveMarketActive, liveSpeed, selectedAsset, candlesData.length])

  // Current Live Price
  const currentPrice = selectedAsset.type === 'stock'
    ? (latestTick?.close || candlesData[candlesData.length - 1]?.close || selectedAsset.price)
    : selectedAsset.nav

  // Filtered Assets
  const filteredAssets = ASSETS_DIRECTORY.filter(a => {
    const matchesCat = categoryFilter === 'All' || a.category === categoryFilter
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCat && matchesSearch
  })

  // Select Asset
  const handleSelectAsset = (asset) => {
    setSelectedAsset(asset)
    setOpenPosition(null)
    setTradeOutcome(null)
    setSipSuccessMsg(null)
    setCrosshairData(null)
    if (asset.type === 'stock') {
      setStopLossInput(String(asset.stopLossPrice || (asset.price * 0.98).toFixed(1)))
      setTargetInput(String(asset.targetPrice || (asset.price * 1.04).toFixed(1)))
    }
  }

  // Execute Stock Order (Instant Fill)
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
      openedAt: `${String(marketClock.hour).padStart(2, '0')}:${String(marketClock.minute).padStart(2, '0')}:${String(marketClock.second).padStart(2, '0')}`,
      closed: false
    }

    setOpenPosition(newPos)
    setTradeOutcome(null)

    // Trigger Order Fill Toast
    setOrderToast({
      direction,
      qty: tradeQuantity,
      price: currentPrice,
      symbol: selectedAsset.symbol
    })
    setTimeout(() => setOrderToast(null), 4000)
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
    setTradeOutcome({
      ...pos,
      exitPrice,
      pnl,
      pnlPct,
      reason
    })
  }

  // Live Position Stop Loss / Target Auto-Checker
  useEffect(() => {
    if (!openPosition) return
    const pos = openPosition
    if (pos.direction === 'BUY' && currentPrice >= pos.target) {
      closePosition(currentPrice, 'Target Reached 🎯 (+Profit Booked)')
    } else if (pos.direction === 'BUY' && currentPrice <= pos.stopLoss) {
      closePosition(currentPrice, 'Stop-Loss Hit 🛑 (Risk Cut)')
    } else if (pos.direction === 'SELL' && currentPrice <= pos.target) {
      closePosition(currentPrice, 'Target Reached 🎯 (+Short Profit Booked)')
    } else if (pos.direction === 'SELL' && currentPrice >= pos.stopLoss) {
      closePosition(currentPrice, 'Stop-Loss Hit 🛑 (Short Stopped)')
    }
  }, [currentPrice])

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
      if (lower.includes('live') || lower.includes('9 to 4') || lower.includes('time') || lower.includes('market open') || lower.includes('how does buy and sell work')) {
        answer = `**How Real Live Market Trading Works**:
1. **Exchange Trading Hours**: Indian markets (NSE/BSE) trade actively from **9:15 AM to 3:30 PM IST**.
2. **Real-Time Price Discovery**: Every second, buyers place 'Bid' orders and sellers place 'Ask' orders. The price moves whenever trades are matched.
3. **Live Candle Formation**: A 15m or 1-day candlestick starts at the Open. As seconds tick, its high, low, and current close wicks fluctuate continuously until that timeframe closes!
4. **How You Profit**: 
   - **BUY / LONG ↗**: You buy at ₹${currentPrice}. If the live price ticks UP to ₹${targetInput}, you make profit!
   - **SELL / SHORT ↘**: If you anticipate a drop, you sell high and buy back lower to profit from falling prices!`
      } else if (lower.includes('green') || lower.includes('red') || lower.includes('color')) {
        answer = `**Candlestick Colors**: 🟢 **Green Candles** mean the price closed HIGHER than it opened (Buyers won that session). 🔴 **Red Candles** mean the price closed LOWER than it opened (Sellers dominated).`
      } else if (lower.includes('down') || lower.includes('bearish') || lower.includes('hdfc') || lower.includes('short')) {
        answer = `**Downtrend & Short-Selling**: Notice **HDFC Bank** with red candles driving the price down. When a stock breaks below the 20 & 50 EMA, click **\`SELL / SHORT\`** to profit from the decline!`
      } else {
        answer = `Regarding **"${q}"** for **${selectedAsset.name}**: Look at the active ticking price (**₹${currentPrice}**) and market clock. Always set a Stop-Loss before entering a trade.`
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

  const livePnLPct = openPosition
    ? ((currentPrice - openPosition.entryPrice) / openPosition.entryPrice) * (openPosition.direction === 'BUY' ? 100 : -100)
    : 0

  // SIP Compounding Calculator Formula
  const monthlyRate = (selectedAsset.cagr3y || 14) / 100 / 12
  const totalMonths = sipTenureYears * 12
  const totalInvestedSip = sipAmount * totalMonths
  const projectedCorpus = Math.round(
    sipAmount * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate)
  )
  const wealthGained = projectedCorpus - totalInvestedSip

  // Smooth Wilder's RSI Algorithm
  const calculateSmoothRsi = () => {
    if (candlesData.length < 5) return [50]
    let gains = 0, losses = 0
    let rsiArray = []
    
    for (let i = 1; i < Math.min(14, candlesData.length); i++) {
      const diff = candlesData[i].close - candlesData[i - 1].close
      if (diff >= 0) gains += diff
      else losses += Math.abs(diff)
      rsiArray.push(50)
    }
    
    let avgGain = gains / 14
    let avgLoss = losses / 14
    
    for (let i = 14; i < candlesData.length; i++) {
      const diff = candlesData[i].close - candlesData[i - 1].close
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
  const rsiHeight = 70
  const getRsiY = (val) => rsiHeight - (val / 100) * (rsiHeight - 20) - 10

  const formattedClock = `${String(marketClock.hour).padStart(2, '0')}:${String(marketClock.minute).padStart(2, '0')}:${String(marketClock.second).padStart(2, '0')} IST`

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* ── Top Bar: Live Market Clock & Virtual Capital ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-3 mb-1 font-mono text-xs">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              🟢 MARKET OPEN (09:15 - 15:30)
            </span>
            <span className="text-white font-bold flex items-center gap-1 bg-void px-2 py-0.5 rounded border border-border">
              <Clock size={12} className="text-red-400" /> {formattedClock}
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <Activity className="text-red-500" size={26} /> Live Real-Time Trading Terminal
          </h1>
          <p className="text-xs text-text-muted mt-0.5">Live tick-by-tick order matching, pulsating PnL, 🟢 Green & 🔴 Red candlesticks, and real-time execution.</p>
        </div>

        {/* Live Capital Stats & Speed Controls */}
        <div className="flex items-center gap-4 bg-void p-3 rounded-2xl border border-border">
          
          {/* Speed Selector */}
          <div className="pr-3 border-r border-border font-mono text-xs">
            <div className="text-[10px] text-text-dim uppercase tracking-wider mb-1">Tick Speed</div>
            <div className="flex gap-1">
              {[1, 3, 8].map(s => (
                <button
                  key={s}
                  onClick={() => setLiveSpeed(s)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                    liveSpeed === s ? 'bg-red-500 text-white border-red-500' : 'border-border text-text-muted hover:text-white'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

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
            placeholder="Search stock or fund (e.g. Zomato, Tata Motors)..."
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

      {/* ── Main Trading Grid (TradingView Canvas + Order Execution / Doubt Copilot) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ── LEFT: Official TradingView Canvas Terminal (8 Cols) ── */}
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
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-2xl font-black font-mono transition-colors duration-200 ${
                  livePriceFlash === 'up' ? 'text-emerald-400 bg-emerald-500/20 px-1 rounded' :
                  livePriceFlash === 'down' ? 'text-red-400 bg-red-500/20 px-1 rounded' : 'text-white'
                }`}>
                  ₹{currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-1 font-bold animate-pulse">
                  ● LIVE TICKING
                </span>
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
                    Area Line
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
                <button onClick={() => setShowEma(!showEma)} className="flex items-center gap-1 text-cyan-400 font-bold hover:underline">
                  <span className="w-2.5 h-0.5 bg-cyan-400 inline-block" /> 20 EMA
                </button>
                <button onClick={() => setShowEma(!showEma)} className="flex items-center gap-1 text-amber-400 font-bold hover:underline">
                  <span className="w-2.5 h-0.5 bg-amber-400 inline-block" /> 50 EMA
                </button>
                <span className="flex items-center gap-1 text-purple-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" /> RSI: {Math.round(currentRsi)}
                </span>
              </div>
              <span className="text-text-dim text-[10px] flex items-center gap-1">
                🔍 Mouse-wheel to Zoom · Drag to Pan
              </span>
            </div>
          )}

          {/* ── Official TradingView Canvas Engine Viewport ── */}
          {selectedAsset.type === 'stock' && candlesData.length > 0 ? (
            
            <div className="space-y-2">
              
              {/* Permanent / Crosshair OHLCV Header */}
              <div className="flex flex-wrap items-center gap-3 md:gap-4 px-3 py-1.5 rounded-xl bg-void border border-border/80 font-mono text-xs text-text-secondary">
                <span className="text-[11px] text-text-dim uppercase font-bold">
                  {crosshairData ? `Hovered Bar` : `Active Tick`}
                </span>
                <div><span className="text-text-dim text-[11px]">O:</span> <strong className="text-white">₹{crosshairData ? crosshairData.open : latestTick?.open}</strong></div>
                <div><span className="text-text-dim text-[11px]">H:</span> <strong className="text-white">₹{crosshairData ? crosshairData.high : latestTick?.high}</strong></div>
                <div><span className="text-text-dim text-[11px]">L:</span> <strong className="text-white">₹{crosshairData ? crosshairData.low : latestTick?.low}</strong></div>
                <div>
                  <span className="text-text-dim text-[11px]">C:</span>{' '}
                  <strong className={`font-bold ${(crosshairData || latestTick)?.close >= (crosshairData || latestTick)?.open ? 'text-emerald-400' : 'text-red-400'}`}>
                    ₹{crosshairData ? crosshairData.close : latestTick?.close}
                  </strong>
                </div>
                <div className="ml-auto">
                  <span className="text-text-dim text-[11px]">Vol:</span>{' '}
                  <strong className="text-emerald-400">
                    {(latestTick?.volume || 45000).toLocaleString()}
                  </strong>
                </div>
              </div>

              {/* Official TradingView Canvas Chart with Live Real-Time Ticking */}
              <TradingViewChart
                candles={candlesData}
                chartType={chartType}
                showEma={showEma}
                openPosition={openPosition}
                latestTick={latestTick}
                onCrosshairMove={setCrosshairData}
              />

              {/* Dedicated Wilder's RSI (14) Panel */}
              <div className="p-3 bg-void rounded-xl border border-border/80">
                <div className="flex items-center justify-between text-[10px] font-mono text-text-dim mb-1">
                  <span className="text-purple-400 font-bold">RSI (14) Momentum Oscillator</span>
                  <span className="text-text-muted">Overbought: 70 · Oversold: 30 · Current: {Math.round(currentRsi)}</span>
                </div>
                <svg viewBox="0 0 700 70" className="w-full h-14 bg-surface/40 rounded-lg">
                  <line x1="0" y1={getRsiY(70)} x2="700" y2={getRsiY(70)} stroke="#EF4444" strokeDasharray="2 2" strokeWidth="1" opacity="0.4" />
                  <text x="670" y={getRsiY(70) + 3} fill="#EF4444" fontSize="8" fontFamily="monospace">70</text>
                  
                  <line x1="0" y1={getRsiY(30)} x2="700" y2={getRsiY(30)} stroke="#10B981" strokeDasharray="2 2" strokeWidth="1" opacity="0.4" />
                  <text x="670" y={getRsiY(30) + 3} fill="#10B981" fontSize="8" fontFamily="monospace">30</text>

                  <path
                    d={candlesData.map((_, i) => {
                      const x = 10 + i * ((700 - 40) / Math.max(1, candlesData.length - 1))
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
                
                {/* Instant Order Fill Alert Toast */}
                <AnimatePresence>
                  {orderToast && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-xs font-mono text-emerald-300 flex items-center gap-2 shadow-lg"
                    >
                      <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                      <div>
                        <strong>Order Filled!</strong> {orderToast.direction === 'BUY' ? 'BOUGHT' : 'SHORTED'} {orderToast.qty} Qty {orderToast.symbol} @ ₹{orderToast.price.toFixed(2)}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="card rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <span className="text-xs font-mono font-bold uppercase tracking-widest text-white">Live Order Pad</span>
                    <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1">
                      <Flame size={12} /> Paper Trading (₹15,000 Wallet)
                    </span>
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

                {/* Active Position Live Real-Time PnL Box */}
                {openPosition && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card rounded-2xl border border-red-500/50 bg-void p-5 space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-extrabold text-white flex items-center gap-1.5">
                        <Activity size={14} className="text-emerald-400 animate-pulse" /> LIVE POSITION
                      </span>
                      <span className={`font-bold px-2 py-0.5 rounded border ${openPosition.direction === 'BUY' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-300 border-red-500/40'}`}>
                        {openPosition.direction} {openPosition.quantity} QTY @ ₹{openPosition.entryPrice.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-2 border-y border-border font-mono">
                      <span className="text-xs text-text-muted">Unrealized PnL:</span>
                      <span className={`text-base font-black transition-all ${livePnL >= 0 ? 'text-emerald-400 font-extrabold' : 'text-red-400 font-extrabold'}`}>
                        {livePnL >= 0 ? '+' : ''}₹{livePnL.toFixed(2)} ({livePnLPct >= 0 ? '+' : ''}{livePnLPct.toFixed(2)}%)
                      </span>
                    </div>

                    <button
                      onClick={() => closePosition(currentPrice, 'Manual Market Exit')}
                      className="w-full py-2.5 rounded-xl border border-red-500/40 text-xs font-mono font-bold text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      Market Close Position @ ₹{currentPrice.toFixed(2)}
                    </button>
                  </motion.div>
                )}

                {/* Completed Trade Outcome Banner */}
                {tradeOutcome && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-xl bg-surface border border-border space-y-1 font-mono text-xs">
                    <div className="flex justify-between font-bold">
                      <span className="text-white">Trade Result: {tradeOutcome.reason}</span>
                      <span className={tradeOutcome.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {tradeOutcome.pnl >= 0 ? '+' : ''}₹{tradeOutcome.pnl.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-[10px] text-text-dim">
                      Entry @ ₹{tradeOutcome.entryPrice.toFixed(2)} $\rightarrow$ Exit @ ₹{tradeOutcome.exitPrice.toFixed(2)} ({tradeOutcome.quantity} Shares)
                    </p>
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
            <div className="card rounded-2xl border border-border bg-surface flex flex-col h-[540px] overflow-hidden shadow-2xl">
              
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
                  `How does real 9:15-3:30 market trading work`,
                  `How to profit from falling ${selectedAsset.symbol}`,
                  'Why are candles Green and Red',
                  'What is 20 EMA and 50 EMA'
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
                      Analyzing {selectedAsset.symbol} live order book...
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
