import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PAPER_PORTFOLIO, MARKET_DATA, formatCurrency, formatPct, generateTick, SYMBOLS } from '../../data/mockData'

export default function HUDOverlay({ activeSymbol, onSymbolChange }) {
  const [ticks, setTicks] = useState({})
  const [portfolio] = useState(PAPER_PORTFOLIO)
  const [activeTrade, setActiveTrade] = useState(null)

  useEffect(() => {
    const t = {}
    SYMBOLS.forEach(s => { t[s] = generateTick(s) })
    setTicks(t)
    const iv = setInterval(() => {
      const sym = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
      setTicks(prev => ({ ...prev, [sym]: generateTick(sym) }))
    }, 800)
    return () => clearInterval(iv)
  }, [])

  return (
    <div style={styles.overlay}>
      {/* P&L Counter — top left */}
      <motion.div
        style={styles.pnlPanel}
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="glass-card"
      >
        <div className="stat-label">Portfolio Value</div>
        <div style={styles.pnlValue}>{formatCurrency(portfolio.totalValue)}</div>
        <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
          <div>
            <div className="stat-label">Day P&L</div>
            <div style={{ ...styles.pnlSub, color: portfolio.dayPnL >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {formatCurrency(portfolio.dayPnL)} ({formatPct(portfolio.dayPnLPct)})
            </div>
          </div>
          <div>
            <div className="stat-label">All Time</div>
            <div style={{ ...styles.pnlSub, color: portfolio.allTimePnL >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {formatCurrency(portfolio.allTimePnL)} ({formatPct(portfolio.allTimePnLPct)})
            </div>
          </div>
        </div>
        {/* Cash bar */}
        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span className="stat-label">Cash Available</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: 'var(--accent-cyan)' }}>
              {formatCurrency(portfolio.cashBalance)}
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill progress-fill-cyan" style={{ width: `${(portfolio.cashBalance / portfolio.totalValue) * 100}%` }} />
          </div>
        </div>
      </motion.div>

      {/* Positions Panel — bottom left */}
      <motion.div
        style={styles.positionsPanel}
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.35, type: 'spring', stiffness: 200 }}
        className="glass-card"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span className="stat-label">Open Positions</span>
          <span className="badge badge-cyan">{portfolio.positions.length}</span>
        </div>
        {portfolio.positions.map(pos => (
          <div key={pos.symbol} style={styles.posRow}>
            <div>
              <div style={styles.posSymbol}>{pos.symbol}</div>
              <div style={styles.posQty}>{pos.qty} shares</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                ${pos.current.toFixed(2)}
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: pos.pnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                {pos.pnl >= 0 ? '+' : ''}{formatCurrency(pos.pnl)} ({formatPct(pos.pnlPct)})
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Symbol Selector — top right */}
      <motion.div
        style={styles.symbolPanel}
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="glass-card"
      >
        <div className="stat-label" style={{ marginBottom: 10 }}>Market Watch</div>
        <div style={styles.symbolGrid}>
          {SYMBOLS.map(sym => {
            const t = ticks[sym]
            const pos = t?.changePct >= 0
            const isActive = sym === activeSymbol
            return (
              <button
                key={sym}
                id={`symbol-${sym}`}
                style={{
                  ...styles.symbolBtn,
                  ...(isActive ? styles.symbolBtnActive : {}),
                  borderColor: isActive ? 'var(--accent-cyan)' : 'transparent',
                }}
                onClick={() => onSymbolChange?.(sym)}
              >
                <span style={styles.symLabel}>{sym}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: pos ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                  {pos ? '▲' : '▼'}{t ? Math.abs(t.changePct).toFixed(2) : '—'}%
                </span>
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* Last Trade Badge — bottom right */}
      <motion.div
        style={styles.lastTrade}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="glass-card glass-card-pink"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span className="animate-pulse-cyan" style={{ width: 8, height: 8, background: 'var(--accent-cyan)', borderRadius: '50%', display: 'inline-block' }} />
          <span className="stat-label">Last Signal</span>
          <span className="badge badge-green">APPROVED</span>
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', color: 'var(--accent-cyan)' }}>
          BUY 50 NVDA @ $871.45
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4 }}>
          SL: $845.00 · TP: $920.00 · R:R 1:1.8
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <span className="badge badge-cyan">TMR PASS</span>
          <span className="badge badge-purple">Conf: 84%</span>
        </div>
      </motion.div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    padding: '16px',
    display: 'grid',
    gridTemplateColumns: '260px 1fr 220px',
    gridTemplateRows: 'auto 1fr auto',
    gap: '12px',
  },
  pnlPanel: {
    gridColumn: 1,
    gridRow: 1,
    pointerEvents: 'all',
    background: 'rgba(5,10,20,0.88)',
  },
  pnlValue: {
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#E2E8F0',
    lineHeight: 1.2,
    marginTop: 4,
  },
  pnlSub: {
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '0.8rem',
    fontWeight: 600,
  },
  positionsPanel: {
    gridColumn: 1,
    gridRow: 3,
    pointerEvents: 'all',
    background: 'rgba(5,10,20,0.88)',
  },
  posRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid rgba(26,39,68,0.6)',
  },
  posSymbol: {
    fontFamily: 'Space Grotesk, sans-serif',
    fontWeight: 700,
    fontSize: '0.88rem',
    color: '#E2E8F0',
  },
  posQty: {
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '0.65rem',
    color: '#7A94B0',
  },
  symbolPanel: {
    gridColumn: 3,
    gridRow: '1 / 2',
    pointerEvents: 'all',
    background: 'rgba(5,10,20,0.88)',
  },
  symbolGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  symbolBtn: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 10px',
    background: 'rgba(13,27,42,0.6)',
    border: '1px solid transparent',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  symbolBtnActive: {
    background: 'rgba(0,245,212,0.08)',
  },
  symLabel: {
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#E2E8F0',
  },
  lastTrade: {
    gridColumn: 3,
    gridRow: 3,
    pointerEvents: 'all',
    background: 'rgba(5,10,20,0.88)',
  },
}
