import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { generateTick } from '../data/mockData'

const NAV_ITEMS = [
  { id: 'warroom',   label: 'War Room',       icon: '⚡', shortcut: '1' },
  { id: 'council',   label: 'Council',         icon: '🧠', shortcut: '2' },
  { id: 'flightsim', label: 'Flight Sim',      icon: '🕹', shortcut: '3' },
  { id: 'safety',    label: 'Safety Stack',    icon: '🛡', shortcut: '4' },
]

const TICKER_SYMBOLS = ['NVDA', 'BTC', 'ETH', 'MSFT', 'AAPL', 'SPY', 'AMZN', 'GOOG']

export default function TopNav({ activeView, onNavigate }) {
  const [ticks, setTicks] = useState({})
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    // Populate initial ticks
    const initial = {}
    TICKER_SYMBOLS.forEach(s => { initial[s] = generateTick(s) })
    setTicks(initial)

    const tickInterval = setInterval(() => {
      const sym = TICKER_SYMBOLS[Math.floor(Math.random() * TICKER_SYMBOLS.length)]
      setTicks(prev => ({ ...prev, [sym]: generateTick(sym) }))
    }, 1200)

    const clockInterval = setInterval(() => setTime(new Date()), 1000)
    return () => { clearInterval(tickInterval); clearInterval(clockInterval) }
  }, [])

  return (
    <nav style={styles.nav}>
      {/* Brand */}
      <div style={styles.brand}>
        <div style={styles.brandIcon}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#00F5D4" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="#F72585" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M2 12L12 17L22 12" stroke="#7209B7" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <div style={styles.brandName}>TradeMind AI</div>
          <div style={styles.brandSub}>Adversarial Trade Council</div>
        </div>
      </div>

      {/* Nav Items */}
      <div style={styles.navItems}>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            style={{
              ...styles.navBtn,
              ...(activeView === item.id ? styles.navBtnActive : {}),
            }}
            onClick={() => onNavigate(item.id)}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
            <span style={styles.shortcut}>{item.shortcut}</span>
          </button>
        ))}
      </div>

      {/* Live Tickers */}
      <div style={styles.tickerStrip}>
        {TICKER_SYMBOLS.map(sym => {
          const t = ticks[sym]
          if (!t) return null
          const pos = t.changePct >= 0
          return (
            <motion.div
              key={sym}
              style={styles.tickerItem}
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 0.3, repeat: 0 }}
            >
              <span style={styles.tickerSymbol}>{sym}</span>
              <span style={{ ...styles.tickerPrice, color: pos ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                {t.price.toLocaleString()}
              </span>
              <span style={{ ...styles.tickerChange, color: pos ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                {pos ? '▲' : '▼'}{Math.abs(t.changePct).toFixed(2)}%
              </span>
            </motion.div>
          )
        })}
      </div>

      {/* Clock */}
      <div style={styles.clock}>
        <div style={styles.clockTime}>{time.toLocaleTimeString('en-US', { hour12: false })}</div>
        <div style={styles.clockDate}>{time.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
        <div style={styles.liveIndicator}>
          <span className="animate-pulse-cyan" style={styles.liveDot} />
          LIVE
        </div>
      </div>
    </nav>
  )
}

const styles = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '0 20px',
    height: '60px',
    background: 'rgba(5, 10, 20, 0.92)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(0,245,212,0.12)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    overflow: 'hidden',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexShrink: 0,
  },
  brandIcon: {
    width: 38,
    height: 38,
    background: 'rgba(0,245,212,0.08)',
    border: '1px solid rgba(0,245,212,0.2)',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontFamily: 'Space Grotesk, sans-serif',
    fontWeight: 700,
    fontSize: '0.95rem',
    color: '#E2E8F0',
    lineHeight: 1.2,
  },
  brandSub: {
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '0.6rem',
    color: '#00F5D4',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  navItems: {
    display: 'flex',
    gap: '4px',
    flexShrink: 0,
  },
  navBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 14px',
    background: 'transparent',
    border: '1px solid transparent',
    borderRadius: 6,
    color: '#7A94B0',
    fontFamily: 'Space Grotesk, sans-serif',
    fontSize: '0.82rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    letterSpacing: '0.02em',
  },
  navBtnActive: {
    background: 'rgba(0,245,212,0.1)',
    border: '1px solid rgba(0,245,212,0.25)',
    color: '#00F5D4',
  },
  shortcut: {
    fontSize: '0.62rem',
    fontFamily: 'JetBrains Mono, monospace',
    color: '#3D5A73',
    border: '1px solid #1A2744',
    borderRadius: 3,
    padding: '1px 5px',
  },
  tickerStrip: {
    display: 'flex',
    gap: '16px',
    flex: 1,
    overflow: 'hidden',
    borderLeft: '1px solid rgba(0,245,212,0.1)',
    borderRight: '1px solid rgba(0,245,212,0.1)',
    padding: '0 16px',
  },
  tickerItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexShrink: 0,
  },
  tickerSymbol: {
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '0.7rem',
    fontWeight: 700,
    color: '#7A94B0',
    letterSpacing: '0.06em',
  },
  tickerPrice: {
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '0.75rem',
    fontWeight: 500,
  },
  tickerChange: {
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '0.65rem',
  },
  clock: {
    flexShrink: 0,
    textAlign: 'right',
  },
  clockTime: {
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '1rem',
    fontWeight: 700,
    color: '#E2E8F0',
    lineHeight: 1.2,
  },
  clockDate: {
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '0.62rem',
    color: '#7A94B0',
  },
  liveIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '0.6rem',
    fontWeight: 700,
    color: '#00F5D4',
    letterSpacing: '0.1em',
    marginTop: '2px',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#00F5D4',
    display: 'inline-block',
  },
}
