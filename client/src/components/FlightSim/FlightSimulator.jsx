import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { HISTORICAL_SCENARIOS, MARKET_DATA, PAPER_PORTFOLIO, formatCurrency, formatPct } from '../../data/mockData'

const CUSTOM_TOOLTIP = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{ background: 'rgba(13,27,42,0.95)', border: '1px solid rgba(0,245,212,0.2)', borderRadius: 8, padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem' }}>
      <div style={{ color: '#7A94B0' }}>{new Date(d.ts).toLocaleDateString()}</div>
      <div style={{ color: '#E2E8F0' }}>${d.close.toFixed(2)}</div>
    </div>
  )
}

export default function FlightSimulator() {
  const [selectedScenario, setSelectedScenario] = useState(null)
  const [sliderValue, setSliderValue] = useState(100)
  const [activeSymbol, setActiveSymbol] = useState('SPY')
  const [chartData, setChartData] = useState([])
  const [portfolio, setPortfolio] = useState({ ...PAPER_PORTFOLIO })
  const [patternVisible, setPatternVisible] = useState(false)
  const [activatingScenario, setActivatingScenario] = useState(false)
  const [scenarioActive, setScenarioActive] = useState(false)

  useEffect(() => {
    const candles = MARKET_DATA[activeSymbol]?.candles || []
    const sliced = candles.slice(0, Math.max(5, Math.floor((sliderValue / 100) * candles.length)))
    setChartData(sliced)
  }, [sliderValue, activeSymbol])

  const activateScenario = (sc) => {
    setActivatingScenario(true)
    setTimeout(() => {
      setSelectedScenario(sc)
      setActivatingScenario(false)
      setScenarioActive(true)
      // Simulate portfolio impact
      const multiplier = 1 + sc.drawdown / 100
      setPortfolio(prev => ({
        ...prev,
        totalValue: +(prev.totalValue * (sc.drawdown > 0 ? multiplier * 0.3 + 1 : multiplier)).toFixed(2),
        dayPnL: +((sc.drawdown / 100) * prev.totalValue * 0.4).toFixed(2),
        dayPnLPct: +(sc.drawdown * 0.4).toFixed(2),
      }))
    }, 1000)
  }

  const resetSim = () => {
    setSelectedScenario(null)
    setScenarioActive(false)
    setPortfolio({ ...PAPER_PORTFOLIO })
    setSliderValue(100)
  }

  const latestPrice = chartData[chartData.length - 1]?.close || 0
  const firstPrice = chartData[0]?.close || 1
  const totalReturn = ((latestPrice - firstPrice) / firstPrice) * 100
  const isPositive = totalReturn >= 0

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}><span style={{ color: 'var(--accent-cyan)' }}>🕹</span> Flight Simulator</h2>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: '#7A94B0' }}>
            Backtest agent strategies · Scrub through history · Learn without risk
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={styles.budgetBadge}>
            <span className="stat-label">Paper Capital</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.1rem', fontWeight: 700, color: scenarioActive && portfolio.dayPnL < 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
              {formatCurrency(portfolio.totalValue)}
            </span>
          </div>
          {scenarioActive && (
            <button id="flightsim-reset" className="btn btn-ghost" onClick={resetSim}>↺ Reset Sim</button>
          )}
        </div>
      </div>

      <div style={styles.body}>
        {/* Chart Column */}
        <div style={styles.chartColumn}>
          {/* Symbol + Time Scrubber */}
          <div className="glass-card" style={{ marginBottom: 12 }}>
            <div style={styles.scrubberHeader}>
              {/* Symbol tabs */}
              <div style={styles.symbolTabs}>
                {['SPY', 'NVDA', 'BTC', 'ETH', 'MSFT', 'AAPL'].map(s => (
                  <button
                    key={s}
                    id={`flightsim-symbol-${s}`}
                    style={{ ...styles.symbolTab, ...(activeSymbol === s ? styles.symbolTabActive : {}) }}
                    onClick={() => setActiveSymbol(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {/* Pattern toggle */}
              <button
                id="flightsim-pattern"
                style={styles.patternBtn}
                onClick={() => setPatternVisible(!patternVisible)}
              >
                {patternVisible ? '🔴' : '🟢'} Pattern Recognition
              </button>
            </div>

            {/* Time scrubber */}
            <div style={styles.scrubWrap}>
              <span className="stat-label">⏮ Start</span>
              <input
                id="time-scrubber"
                type="range"
                min={10}
                max={100}
                value={sliderValue}
                onChange={e => setSliderValue(+e.target.value)}
                style={styles.slider}
              />
              <span className="stat-label">Now ⏭</span>
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#7A94B0', textAlign: 'center', marginTop: 6 }}>
              Showing {chartData.length} candles · {chartData[0] ? new Date(chartData[0].ts).toLocaleDateString() : '—'} → {chartData[chartData.length-1] ? new Date(chartData[chartData.length-1].ts).toLocaleDateString() : '—'}
            </div>
          </div>

          {/* Chart */}
          <div className="glass-card" style={{ flex: 1, minHeight: 280 }}>
            <div style={styles.chartHeader}>
              <div>
                <div style={styles.chartSymbol}>{activeSymbol}</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: isPositive ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                  ${latestPrice.toFixed(2)} &nbsp; {isPositive ? '▲' : '▼'}{Math.abs(totalReturn).toFixed(2)}%
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span className={`badge ${isPositive ? 'badge-green' : 'badge-red'}`}>
                  {totalReturn > 0 ? '+' : ''}{totalReturn.toFixed(1)}% period return
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={isPositive ? '#06FFA5' : '#FF2D55'} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={isPositive ? '#06FFA5' : '#FF2D55'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="ts" tickFormatter={v => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} tick={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, fill: '#3D5A73' }} axisLine={false} tickLine={false} interval={Math.floor(chartData.length / 6)} />
                <YAxis tick={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, fill: '#3D5A73' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v.toFixed(0)}`} domain={['auto', 'auto']} width={55} />
                <Tooltip content={<CUSTOM_TOOLTIP />} />
                <Area type="monotone" dataKey="close" stroke={isPositive ? '#06FFA5' : '#FF2D55'} strokeWidth={1.5} fill="url(#areaGrad)" dot={false} />
                {patternVisible && chartData.length > 60 && (
                  <ReferenceLine x={chartData[Math.floor(chartData.length * 0.35)]?.ts} stroke="var(--accent-gold)" strokeDasharray="4 4" label={{ value: 'Pattern', fill: 'var(--accent-gold)', fontSize: 9 }} />
                )}
              </AreaChart>
            </ResponsiveContainer>

            {/* Pattern overlay */}
            <AnimatePresence>
              {patternVisible && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={styles.patternBadge}
                >
                  <span style={{ color: 'var(--accent-gold)' }}>⚡</span>
                  <span>AI Detected: <strong>Double Bottom</strong> forming at support · Confirmation: 74%</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Scenario Column */}
        <div style={styles.scenarioColumn}>
          <div style={{ marginBottom: 10 }}>
            <div style={styles.scenLabel}>Historical Scenarios</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#7A94B0' }}>
              Simulate Black Swan events · Test agent resilience
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activatingScenario ? (
              <motion.div key="loading" style={styles.loadingOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={styles.loadingSpinner} className="animate-spin-slow">◉</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--accent-cyan)', marginTop: 8 }}>Loading scenario…</div>
                </div>
              </motion.div>
            ) : selectedScenario ? (
              <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <div style={{ ...styles.scenarioDetail, borderColor: `var(--accent-${selectedScenario.color})` }}>
                  <div style={styles.scenDetailHeader}>
                    <div>
                      <div style={{ ...styles.scenDetailName, color: `var(--accent-${selectedScenario.color})` }}>{selectedScenario.name}</div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#7A94B0' }}>{selectedScenario.date}</div>
                    </div>
                    <span style={{ ...styles.severityBadge, color: `var(--accent-${selectedScenario.color})` }}>{selectedScenario.severity}</span>
                  </div>
                  <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: '#A0B4C8', margin: '10px 0', lineHeight: 1.6 }}>
                    {selectedScenario.description}
                  </p>
                  <div style={styles.scenStats}>
                    <div>
                      <div className="stat-label">Max Drawdown</div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1rem', fontWeight: 700, color: selectedScenario.drawdown < 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                        {selectedScenario.drawdown > 0 ? '+' : ''}{selectedScenario.drawdown}%
                      </div>
                    </div>
                    <div>
                      <div className="stat-label">Recovery</div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1rem', fontWeight: 700, color: '#E2E8F0' }}>
                        {selectedScenario.recoveryDays > 0 ? `${selectedScenario.recoveryDays}d` : 'Ongoing'}
                      </div>
                    </div>
                    <div>
                      <div className="stat-label">Pattern</div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--accent-gold)' }}>
                        {selectedScenario.pattern}
                      </div>
                    </div>
                  </div>
                  <div style={styles.agentActionBox}>
                    <div style={{ color: 'var(--accent-cyan)', fontSize: '0.62rem', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em', marginBottom: 6 }}>🧠 AGENT RESPONSE</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: '#A0B4C8', lineHeight: 1.6 }}>{selectedScenario.agentAction}</div>
                  </div>
                  {/* Portfolio impact */}
                  <div style={styles.portfolioImpact}>
                    <div className="stat-label" style={{ marginBottom: 8 }}>Portfolio Impact</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.2rem', fontWeight: 700, color: portfolio.dayPnL < 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                          {formatCurrency(portfolio.totalValue)}
                        </div>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: portfolio.dayPnL < 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                          {formatPct(portfolio.dayPnLPct)} session
                        </div>
                      </div>
                      <button id="flightsim-reset-2" className="btn btn-ghost" style={{ fontSize: '0.72rem', padding: '5px 12px' }} onClick={resetSim}>↺ Reset</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="list" style={styles.scenarioList} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {HISTORICAL_SCENARIOS.map(sc => (
                  <motion.button
                    key={sc.id}
                    id={`scenario-${sc.id}`}
                    style={{ ...styles.scenarioCard, borderColor: `rgba(${sc.color === 'red' ? '255,45,85' : sc.color === 'green' ? '6,255,165' : sc.color === 'orange' ? '255,107,53' : '255,214,10'},0.2)` }}
                    whileHover={{ x: 4, borderColor: `var(--accent-${sc.color})` }}
                    onClick={() => activateScenario(sc)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={styles.scenName}>{sc.name}</div>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', fontWeight: 700, color: sc.drawdown < 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                        {sc.drawdown > 0 ? '+' : ''}{sc.drawdown}%
                      </span>
                    </div>
                    <div style={styles.scenDate}>{sc.date} · {sc.severity}</div>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { padding: 20, height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column', gap: 16, overflow: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 },
  title: { fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.3rem', fontWeight: 700, color: '#E2E8F0' },
  budgetBadge: { background: 'rgba(13,27,42,0.8)', border: '1px solid rgba(0,245,212,0.15)', borderRadius: 10, padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 2 },
  body: { display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, flex: 1 },
  chartColumn: { display: 'flex', flexDirection: 'column', gap: 0 },
  scrubberHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  symbolTabs: { display: 'flex', gap: 4 },
  symbolTab: { padding: '4px 12px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' },
  symbolTabActive: { background: 'rgba(0,245,212,0.1)', border: '1px solid rgba(0,245,212,0.3)', color: 'var(--accent-cyan)' },
  patternBtn: { padding: '5px 12px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', cursor: 'pointer', transition: 'all 0.2s' },
  scrubWrap: { display: 'flex', alignItems: 'center', gap: 12 },
  slider: { flex: 1, appearance: 'none', height: 4, background: 'linear-gradient(90deg, #00F5D4, #7209B7)', borderRadius: 99, cursor: 'pointer', outline: 'none' },
  chartHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  chartSymbol: { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.2rem', color: '#E2E8F0' },
  patternBadge: { background: 'rgba(255,214,10,0.08)', border: '1px solid rgba(255,214,10,0.2)', borderRadius: 8, padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: '#A0B4C8', display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 },
  scenarioColumn: { display: 'flex', flexDirection: 'column', background: 'rgba(13,27,42,0.5)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, overflow: 'auto' },
  scenLabel: { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: '#E2E8F0', marginBottom: 2 },
  scenarioList: { display: 'flex', flexDirection: 'column', gap: 8 },
  scenarioCard: { background: 'rgba(13,27,42,0.7)', border: '1px solid', borderRadius: 10, padding: '12px 14px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' },
  scenName: { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.85rem', color: '#E2E8F0', marginBottom: 4 },
  scenDate: { fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: '#7A94B0' },
  loadingOverlay: { display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingSpinner: { fontSize: '2rem', color: 'var(--accent-cyan)' },
  scenarioDetail: { background: 'rgba(13,27,42,0.7)', border: '1px solid', borderRadius: 12, padding: '16px' },
  scenDetailHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  scenDetailName: { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1rem' },
  severityBadge: { fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' },
  scenStats: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, margin: '12px 0', padding: '12px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' },
  agentActionBox: { background: 'rgba(0,245,212,0.05)', border: '1px solid rgba(0,245,212,0.1)', borderRadius: 8, padding: '10px 12px', margin: '12px 0' },
  portfolioImpact: { background: 'rgba(13,27,42,0.8)', borderRadius: 8, padding: '12px', marginTop: 8 },
}
