import { useState, useEffect, useRef, useCallback } from 'react'
import { Terminal, Crosshair } from 'lucide-react'
import { createChart } from 'lightweight-charts'
import useStore from '../store/useStore'
import useWebSocket from '../hooks/useWebSocket'
import useApi from '../hooks/useApi'
import ThoughtLog from '../components/WarRoom/ThoughtLog'

export default function WarRoom() {
  const { sendCommand } = useWebSocket() // Starts the WebSocket connection on mount
  const { executeTrade, fetchWalletBalance } = useApi()
  
  const candles = useStore((state) => state.market.candles)
  const currentPrice = useStore((state) => state.market.currentPrice)
  const replaySpeed = useStore((state) => state.market.replaySpeed)
  const setReplaySpeed = useStore((state) => state.setReplaySpeed)
  const wallet = useStore((state) => state.wallet)
  const currentScenario = useStore((state) => state.currentScenario)
  const clearScenario = useStore((state) => state.clearScenario)
  
  const [qty, setQty] = useState(10)
  const [logs, setLogs] = useState([
    { type: 'system', text: '> TRADEMIND_AI v0.2.0 // MENTOR & DEVIL ACTIVE' },
    { type: 'system', text: '> Connecting to live market replay stream...' },
    { type: 'system', text: '> Listening for order execution.' }
  ])

  // ── Lightweight-Charts Refs ──
  const chartContainerRef = useRef(null)
  const chartRef = useRef(null)
  const candlestickSeriesRef = useRef(null)

  useEffect(() => {
    fetchWalletBalance()
  }, [fetchWalletBalance])

  // ── Inject scenario context into the thought log ──
  useEffect(() => {
    if (currentScenario) {
      setLogs(prev => [
        ...prev,
        { type: 'system', text: `> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` },
        { type: 'mentor', text: `SCENARIO LOADED: "${currentScenario.title}"` },
        { type: 'mentor', text: `CONTEXT: ${currentScenario.context}` },
        { type: 'system', text: `> Challenge objective activated. Good luck, trader.` },
      ])
    }
  }, [currentScenario])

  // ── Initialize Lightweight Chart ──
  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      layout: {
        background: { type: 'solid', color: 'transparent' },
        textColor: '#888888',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(255, 215, 0, 0.04)' },
        horzLines: { color: 'rgba(255, 215, 0, 0.04)' },
      },
      rightPriceScale: {
        borderColor: '#1C1C1C',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: '#1C1C1C',
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 0, // Normal
        vertLine: { color: 'rgba(255, 215, 0, 0.3)', width: 1, style: 2, labelBackgroundColor: '#FFD700' },
        horzLine: { color: 'rgba(255, 215, 0, 0.3)', width: 1, style: 2, labelBackgroundColor: '#FFD700' },
      },
    })

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#22C55E',
      downColor: '#EF4444',
      borderUpColor: '#22C55E',
      borderDownColor: '#EF4444',
      wickUpColor: '#22C55E',
      wickDownColor: '#EF4444',
    })

    chartRef.current = chart
    candlestickSeriesRef.current = candlestickSeries

    // ── Handle resize ──
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        })
      }
    }

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(chartContainerRef.current)

    return () => {
      resizeObserver.disconnect()
      chart.remove()
      chartRef.current = null
      candlestickSeriesRef.current = null
    }
  }, [])

  // ── Feed candle data into the chart ──
  useEffect(() => {
    if (!candlestickSeriesRef.current || candles.length === 0) return

    const formattedCandles = candles.map(c => ({
      time: c.date ? c.date.split('T')[0] : c.time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }))

    candlestickSeriesRef.current.setData(formattedCandles)
    chartRef.current?.timeScale().fitContent()
  }, [candles])

  const handleTrade = async (action) => {
    if (!currentPrice) return;
    
    setLogs(prev => [...prev, { type: 'user', text: `> EXECUTING ${action} ${qty} AAPL @ $${currentPrice.toFixed(2)}` }])
    
    const contextStr = currentScenario 
      ? `Scenario: ${currentScenario.title}. ${currentScenario.context}`
      : "Standard market execution."
    const res = await executeTrade(action, 'AAPL', qty, currentPrice, contextStr)
    
    if (res.success) {
      setLogs(prev => [
        ...prev, 
        { type: 'system', text: `> CONFIRMED. Total: $${res.data.total_value.toLocaleString()}` },
        { type: 'mentor', text: `MENTOR GRADE: [${res.data.mentor.grade}] - ${res.data.mentor.what_went_right}` },
        { type: 'mentor', text: `TIP: ${res.data.mentor.lesson_tip}` },
        { type: 'devil', text: `RISK: [${res.data.devil.risk_level}] - ${res.data.devil.warnings[0]}` }
      ])
    } else {
      setLogs(prev => [...prev, { type: 'error', text: `> ERROR: ${res.error}` }])
    }
  }

  const hasPosition = wallet.positions.find(p => p.symbol === 'AAPL')

  return (
    <div className="h-[calc(100vh-80px)] flex gap-4 max-w-[1600px] mx-auto pb-4">
      
      {/* ── LEFT: AI Thought Log (CRT + Typewriter) ── */}
      <ThoughtLog logs={logs} />

      {/* ── CENTER: Candlestick Chart & Scrubber ── */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        <div className="flex-1 gold-card rounded-xl p-4 flex flex-col relative">
          <div className="absolute top-4 left-4 z-10">
            <h2 className="text-xl font-bold tracking-tight">AAPL / USD</h2>
            <div className="text-xs text-text-dim border border-border px-2 py-0.5 mt-1 rounded inline-block bg-void font-mono">
              {currentScenario ? `📡 ${currentScenario.title}` : 'Synthetic Market Replay'}
            </div>
          </div>
          
          <div className="flex-1 mt-12 w-full h-full relative">
            <div ref={chartContainerRef} className="absolute inset-0 tv-chart-container" />
            {candles.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-text-muted font-mono animate-pulse z-10">
                Establishing market connection...
              </div>
            )}
          </div>
        </div>

        {/* Time Scrubber */}
        <div className="h-16 shrink-0 gold-card rounded-xl flex items-center px-6 gap-4">
           <span className="text-xs font-bold text-text-dim uppercase tracking-widest mr-2">Replay Speed</span>
           {[0.25, 0.5, 1, 2, 4].map(speed => (
             <button 
                key={speed}
                onClick={() => setReplaySpeed(speed)}
                className={`px-3 py-1.5 rounded text-sm font-mono font-bold border transition-all duration-200 ${
                  replaySpeed === speed 
                    ? 'border-gold text-gold bg-gold-wash glow-border-gold shadow-gold-sm' 
                    : 'border-border text-text-muted hover:border-text-dim hover:text-white'
                }`}
             >
               {speed}x
             </button>
           ))}
           
           {currentScenario && (
             <button 
               onClick={clearScenario}
               className="ml-auto text-xs font-mono text-neon-red hover:text-red-300 border border-neon-red/30 px-3 py-1.5 rounded hover:bg-red-950/20 transition-colors"
             >
               ✕ Exit Scenario
             </button>
           )}
        </div>
      </div>

      {/* ── RIGHT: Order Execution ── */}
      <div className="w-80 gold-card rounded-xl flex flex-col p-5 shrink-0 space-y-6">
        <div>
          <h3 className="text-sm font-bold tracking-widest text-text-dim uppercase flex items-center gap-2 mb-4">
            <Crosshair size={16} className="text-gold" /> Execution Box
          </h3>
          <div className="text-4xl font-bold text-white mb-2 font-mono">
            ${currentPrice ? currentPrice.toFixed(2) : '---'}
          </div>
          <div className="text-sm text-text-muted">Current Ask</div>
        </div>

        <div className="space-y-4 pt-4 border-t border-border">
          <div>
            <label className="block text-xs uppercase tracking-widest text-text-dim font-bold mb-2">Quantity (Shares)</label>
            <input 
              type="number" 
              value={qty}
              onChange={e => setQty(Number(e.target.value))}
              className="w-full bg-void border border-border rounded-lg px-4 py-3 text-lg font-mono text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
            />
          </div>
          
          <div className="flex justify-between text-sm py-2 border-b border-border font-mono">
            <span className="text-text-muted cursor-pointer hover:text-white transition-colors" onClick={() => setQty(10)}>10</span>
            <span className="text-text-muted cursor-pointer hover:text-white transition-colors" onClick={() => setQty(50)}>50</span>
            <span className="text-text-muted cursor-pointer hover:text-white transition-colors" onClick={() => setQty(100)}>100</span>
            <span className="text-gold glow-text-gold cursor-pointer font-bold" onClick={() => setQty(Math.floor(wallet.cash/(currentPrice || 1)))}>All In</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button 
              onClick={() => handleTrade('BUY')}
              disabled={!currentPrice || wallet.cash < qty * currentPrice}
              className="bg-neon-green/10 hover:bg-neon-green/20 border border-neon-green text-neon-green font-bold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed glow-border-green focus:outline-none"
            >
              BUY
            </button>
            <button 
              onClick={() => handleTrade('SELL')}
              disabled={!currentPrice || !hasPosition || hasPosition.qty < qty}
              className="bg-neon-red/10 hover:bg-neon-red/20 border border-neon-red text-neon-red font-bold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed glow-border-red focus:outline-none"
            >
              SELL
            </button>
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-border space-y-3">
           <div className="flex justify-between items-center text-sm">
             <span className="text-text-muted font-mono tracking-wider">CASH_A</span>
             <span className="font-mono font-bold">${wallet.cash.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
           </div>
           {hasPosition && (
            <div className="p-3 bg-gold-wash border border-gold/20 rounded-lg space-y-2 mt-4">
              <div className="flex justify-between text-xs">
                <span className="text-gold font-bold tracking-widest uppercase">Position_Open</span>
                <span className="font-mono font-bold text-white">{hasPosition.qty} AAPL</span>
              </div>
              <div className="flex justify-between text-xs text-text-muted font-mono">
                <span>Avg Cost</span>
                <span>${hasPosition.avg_cost.toFixed(2)}</span>
              </div>
            </div>
           )}
        </div>
      </div>
    </div>
  )
}
