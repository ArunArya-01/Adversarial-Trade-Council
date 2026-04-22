import { useState, useEffect, useRef } from 'react'
import { Terminal, Crosshair } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import useStore from '../store/useStore'
import useWebSocket from '../hooks/useWebSocket'
import useApi from '../hooks/useApi'

export default function WarRoom() {
  const { sendCommand } = useWebSocket() // Starts the WebSocket connection on mount
  const { executeTrade, fetchWalletBalance } = useApi()
  
  const candles = useStore((state) => state.market.candles)
  const currentPrice = useStore((state) => state.market.currentPrice)
  const replaySpeed = useStore((state) => state.market.replaySpeed)
  const setReplaySpeed = useStore((state) => state.setReplaySpeed)
  const wallet = useStore((state) => state.wallet)
  
  const [qty, setQty] = useState(10)
  const [logs, setLogs] = useState([
    { type: 'system', text: '> TRADEMIND_AI v0.2.0 // MENTOR & DEVIL ACTIVE' },
    { type: 'system', text: '> Connecting to live market replay stream...' },
    { type: 'system', text: '> Listening for order execution.' }
  ])

  const logEndRef = useRef(null)

  useEffect(() => {
    fetchWalletBalance()
  }, [fetchWalletBalance])

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const handleTrade = async (action) => {
    if (!currentPrice) return;
    
    setLogs(prev => [...prev, { type: 'user', text: `> EXECUTING ${action} ${qty} AAPL @ $${currentPrice.toFixed(2)}` }])
    
    const contextStr = "Standard market execution."
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

  // A simple line/area chart using Recharts for phase 1. 
  // (Full candlestick implementation requires significant Recharts custom drawing setup.)
  const chartData = candles.map(c => ({
    name: c.date.split('T')[0],
    price: c.close
  }))

  const hasPosition = wallet.positions.find(p => p.symbol === 'AAPL')

  return (
    <div className="h-[calc(100vh-80px)] flex gap-4 max-w-[1600px] mx-auto pb-4">
      
      {/* ── LEFT: Retro Terminal Thought Log ── */}
      <div className="w-80 bg-void border border-border rounded-xl flex flex-col relative overflow-hidden shrink-0">
        <div className="terminal-scanlines absolute inset-0 pointer-events-none z-10" />
        
        <div className="h-10 border-b border-border bg-surface flex items-center px-4 shrink-0 relative z-20">
          <Terminal size={16} className="text-text-muted mr-2" />
          <span className="text-xs font-mono text-text-muted font-semibold tracking-widest">AI THOUGHT LOG</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] leading-relaxed break-words space-y-2 relative z-20">
          {logs.map((log, i) => (
            <div key={i} className={`
              ${log.type === 'system' ? 'text-slate-500' : ''}
              ${log.type === 'user' ? 'text-white' : ''}
              ${log.type === 'mentor' ? 'text-neon-green glow-text-green' : ''}
              ${log.type === 'devil' ? 'text-neon-gold' : ''}
              ${log.type === 'error' ? 'text-neon-red glow-text-red' : ''}
            `}>
              {log.text}
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>

      {/* ── CENTER: Chart & Scrubber ── */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        <div className="flex-1 bg-surface border border-border rounded-xl p-4 flex flex-col relative">
          <div className="absolute top-4 left-4 z-10">
            <h2 className="text-xl font-bold tracking-tight">AAPL / USD</h2>
            <div className="text-sm text-text-muted border border-border px-2 py-0.5 mt-1 rounded inline-block bg-void">Synthetic Market Replay</div>
          </div>
          
          <div className="flex-1 mt-12 w-full h-full relative pl-2">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00D4FF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" hide />
                  <YAxis domain={['auto', 'auto']} stroke="#3D526A" tick={{ fill: '#7A94B0', fontSize: 12 }} orientation="right" tickFormatter={(v) => `$${v}`}/>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#040810', border: '1px solid #1A2744', fontFamily: 'monospace', borderRadius: '8px' }}
                    labelStyle={{ color: '#7A94B0' }}
                    itemStyle={{ color: '#00D4FF' }}
                    formatter={(value) => [`$${value.toFixed(2)}`, 'Price']}
                  />
                  <Area type="monotone" dataKey="price" stroke="#00D4FF" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-text-muted font-mono animate-pulse">Establishing market connection...</div>
            )}
          </div>
        </div>

        {/* Time Scrubber */}
        <div className="h-16 shrink-0 bg-surface border border-border rounded-xl flex items-center px-6 gap-4">
           <span className="text-xs font-bold text-text-muted uppercase tracking-widest mr-2">Replay Speed</span>
           {[0.25, 0.5, 1, 2, 4].map(speed => (
             <button 
                key={speed}
                onClick={() => setReplaySpeed(speed)}
                className={`px-3 py-1.5 rounded text-sm font-mono font-bold border transition-colors ${
                  replaySpeed === speed 
                    ? 'border-neon-cyan text-neon-cyan bg-cyan-950/30 glow-border-cyan' 
                    : 'border-border text-text-muted hover:border-text-dim hover:text-white'
                }`}
             >
               {speed}x
             </button>
           ))}
        </div>
      </div>

      {/* ── RIGHT: Order Execution ── */}
      <div className="w-80 bg-surface border border-border rounded-xl flex flex-col p-5 shrink-0 space-y-6">
        <div>
          <h3 className="text-sm font-bold tracking-widest text-text-muted uppercase flex items-center gap-2 mb-4">
            <Crosshair size={16} /> Execution Box
          </h3>
          <div className="text-4xl font-bold text-white mb-2 font-mono">
            ${currentPrice ? currentPrice.toFixed(2) : '---'}
          </div>
          <div className="text-sm text-text-muted">Current Ask</div>
        </div>

        <div className="space-y-4 pt-4 border-t border-border">
          <div>
            <label className="block text-xs uppercase tracking-widest text-text-muted font-bold mb-2">Quantity (Shares)</label>
            <input 
              type="number" 
              value={qty}
              onChange={e => setQty(Number(e.target.value))}
              className="w-full bg-void border border-border rounded-lg px-4 py-3 text-lg font-mono text-white focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan"
            />
          </div>
          
          <div className="flex justify-between text-sm py-2 border-b border-border/50 font-mono">
            <span className="text-text-muted cursor-pointer hover:text-white transition-colors" onClick={() => setQty(10)}>10</span>
            <span className="text-text-muted cursor-pointer hover:text-white transition-colors" onClick={() => setQty(50)}>50</span>
            <span className="text-text-muted cursor-pointer hover:text-white transition-colors" onClick={() => setQty(100)}>100</span>
            <span className="text-neon-gold glow-text-gold cursor-pointer font-bold" onClick={() => setQty(Math.floor(wallet.cash/(currentPrice || 1)))}>All In</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button 
              onClick={() => handleTrade('BUY')}
              disabled={!currentPrice || wallet.cash < qty * currentPrice}
              className="bg-neon-green/10 hover:bg-neon-green/20 border border-neon-green text-neon-green font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed glow-border-green focus:outline-none"
            >
              BUY
            </button>
            <button 
              onClick={() => handleTrade('SELL')}
              disabled={!currentPrice || !hasPosition || hasPosition.qty < qty}
              className="bg-neon-red/10 hover:bg-neon-red/20 border border-neon-red text-neon-red font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed glow-border-red focus:outline-none"
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
            <div className="p-3 bg-neon-cyan/5 border border-neon-cyan/20 rounded-lg space-y-2 mt-4">
              <div className="flex justify-between text-xs">
                <span className="text-neon-cyan font-bold tracking-widest uppercase">Position_Open</span>
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
