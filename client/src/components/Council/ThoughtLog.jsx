import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { THOUGHT_LOG_ENTRIES, formatTs } from '../../data/mockData'

const AGENT_COLORS = {
  'Strategist':   'var(--accent-cyan)',
  'Graph Agent':  'var(--accent-gold)',
  'Macro Agent':  '#BF7AFF',
  "Devil's Adv.": 'var(--accent-pink)',
  'TMR Engine':   'var(--accent-green)',
  'Risk Auditor': 'var(--accent-orange)',
  'TradeMind':    'var(--accent-cyan)',
}
const TYPE_ICONS = {
  ANALYSIS:  '🔍',
  CONTAGION: '🕸',
  SENTIMENT: '📡',
  SIGNAL:    '⚡',
  AUDIT:     '👿',
  CONSENSUS: '⚖️',
  SAFETY:    '🛡',
  EXECUTE:   '🚀',
}

export default function ThoughtLog({ isLive = true }) {
  const [entries, setEntries] = useState([])
  const [isRunning, setIsRunning] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    // Replay initial log entry by entry
    let i = 0
    const addNext = () => {
      if (i < THOUGHT_LOG_ENTRIES.length) {
        const entry = { ...THOUGHT_LOG_ENTRIES[i], id: `entry-${i}` }
        setEntries(prev => [...prev, entry])
        i++
        setTimeout(addNext, 600 + Math.random() * 800)
      }
    }
    addNext()
  }, [])

  // Scroll to bottom on new entries
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [entries])

  // Continuously add synthetic log entries when live
  useEffect(() => {
    if (!isRunning) return
    const LIVE_ENTRIES = [
      { agent: 'Strategist',   type: 'ANALYSIS',  text: 'Re-scanning RSI across watchlist... NVDA RSI dropping toward 38.' },
      { agent: 'Graph Agent',  type: 'CONTAGION', text: 'NVDA-TSMC edge weight: 0.91 → stable. No cascade expansion.' },
      { agent: 'Macro Agent',  type: 'SENTIMENT', text: 'Twitter sentiment shift: BTC narrative turning bullish. Score: +0.48.' },
      { agent: "Devil's Adv.", type: 'AUDIT',      text: 'Scanning for fake-out patterns... MSFT at $412 near prior resistance.' },
      { agent: 'Risk Auditor', type: 'SAFETY',     text: 'Daily drawdown: -0.12%. Kill-switch threshold clear. All positions within limits.' },
      { agent: 'TMR Engine',   type: 'CONSENSUS',  text: 'Monitoring for new proposal submission. Council on standby.' },
      { agent: 'Strategist',   type: 'SIGNAL',     text: 'MACD crossover detected on AAPL (1H chart). Preparing proposal.' },
      { agent: 'TradeMind',    type: 'EXECUTE',    text: 'System heartbeat: All agents nominal. Market session: ACTIVE.' },
    ]
    const iv = setInterval(() => {
      if (Math.random() > 0.3) {
        const e = LIVE_ENTRIES[Math.floor(Math.random() * LIVE_ENTRIES.length)]
        setEntries(prev => [...prev.slice(-50), {
          ...e,
          ts: Date.now(),
          id: `live-${Date.now()}`,
        }])
      }
    }, 3000)
    return () => clearInterval(iv)
  }, [isRunning])

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerDot} className={isRunning ? 'animate-blink' : ''} />
          <span style={styles.headerTitle}>Agent Thought Log</span>
          <span className="badge badge-cyan">{entries.length} events</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            id="thoughtlog-toggle"
            className={`btn ${isRunning ? 'btn-ghost' : 'btn-primary'}`}
            style={{ padding: '4px 12px', fontSize: '0.72rem' }}
            onClick={() => setIsRunning(!isRunning)}
          >
            {isRunning ? '⏸ Pause' : '▶ Resume'}
          </button>
          <button
            id="thoughtlog-clear"
            className="btn btn-ghost"
            style={{ padding: '4px 12px', fontSize: '0.72rem' }}
            onClick={() => setEntries([])}
          >
            🗑 Clear
          </button>
        </div>
      </div>

      {/* Log Body */}
      <div style={styles.logBody}>
        <AnimatePresence initial={false}>
          {entries.map(entry => {
            const color = AGENT_COLORS[entry.agent] || 'var(--accent-cyan)'
            const icon = TYPE_ICONS[entry.type] || '•'
            const isExecute = entry.type === 'EXECUTE'
            const isConsensus = entry.type === 'CONSENSUS'

            return (
              <motion.div
                key={entry.id}
                style={{
                  ...styles.logEntry,
                  background: isExecute
                    ? 'rgba(0,245,212,0.06)'
                    : isConsensus
                      ? 'rgba(6,255,165,0.04)'
                      : 'transparent',
                  borderLeft: `2px solid ${color}`,
                }}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.25 }}
              >
                <div style={styles.entryMeta}>
                  <span style={styles.entryTs}>{formatTs(entry.ts)}</span>
                  <span style={{ ...styles.entryAgent, color }}>{icon} {entry.agent}</span>
                  <span style={{ ...styles.entryType, color: `${color}99` }}>{entry.type}</span>
                </div>
                <div style={styles.entryText}>{entry.text}</div>
              </motion.div>
            )
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Scan line effect */}
      <div style={styles.scanLine}>
        <div style={styles.scanLineBar} />
      </div>
    </div>
  )
}

const styles = {
  container: {
    position: 'relative',
    background: 'rgba(5,10,20,0.95)',
    border: '1px solid rgba(0,245,212,0.12)',
    borderRadius: 12,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    borderBottom: '1px solid rgba(0,245,212,0.1)',
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  headerDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: 'var(--accent-cyan)',
    display: 'inline-block',
  },
  headerTitle: {
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '0.8rem',
    fontWeight: 700,
    color: '#E2E8F0',
    letterSpacing: '0.04em',
  },
  logBody: {
    flex: 1,
    overflowY: 'auto',
    padding: '10px 0',
    fontFamily: 'JetBrains Mono, monospace',
  },
  logEntry: {
    padding: '7px 16px 7px 14px',
    borderLeft: '2px solid',
    marginBottom: 1,
    transition: 'background 0.2s',
  },
  entryMeta: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    marginBottom: 3,
  },
  entryTs: {
    fontSize: '0.62rem',
    color: '#3D5A73',
    flexShrink: 0,
  },
  entryAgent: {
    fontSize: '0.68rem',
    fontWeight: 700,
    letterSpacing: '0.04em',
  },
  entryType: {
    fontSize: '0.6rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  entryText: {
    fontSize: '0.78rem',
    color: '#A0B4C8',
    lineHeight: 1.5,
  },
  scanLine: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    overflow: 'hidden',
  },
  scanLineBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    background: 'linear-gradient(90deg, transparent, rgba(0,245,212,0.3), transparent)',
    animation: 'scan-line 4s linear infinite',
  },
}
