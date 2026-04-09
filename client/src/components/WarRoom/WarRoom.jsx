import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MarketTerrain from './MarketTerrain'
import ContagionGraph from './ContagionGraph'
import HUDOverlay from './HUDOverlay'

const VIEWS = [
  { id: 'terrain', label: 'Market Terrain', icon: '⛰' },
  { id: 'contagion', label: 'Contagion Web', icon: '🕸' },
]

export default function WarRoom() {
  const [view3D, setView3D] = useState('terrain')
  const [activeSymbol, setActiveSymbol] = useState('NVDA')
  const [terrainReady, setTerrainReady] = useState(false)

  return (
    <div style={styles.container}>
      {/* Header Row */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>
            <span style={{ color: 'var(--accent-cyan)' }}>⚡</span> War Room
          </h2>
          <p style={styles.subtitle}>Live 3D market visualization · Agentic surveillance active</p>
        </div>
        {/* 3D View Toggle */}
        <div style={styles.viewToggle}>
          {VIEWS.map(v => (
            <button
              key={v.id}
              id={`warroom-view-${v.id}`}
              style={{
                ...styles.toggleBtn,
                ...(view3D === v.id ? styles.toggleBtnActive : {}),
              }}
              onClick={() => setView3D(v.id)}
            >
              {v.icon} {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main 3D Canvas + HUD */}
      <div style={styles.mainCanvas}>
        <AnimatePresence mode="wait">
          {view3D === 'terrain' ? (
            <motion.div
              key="terrain"
              style={styles.canvasWrap}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <MarketTerrain symbol={activeSymbol} onReady={() => setTerrainReady(true)} />
            </motion.div>
          ) : (
            <motion.div
              key="contagion"
              style={styles.canvasWrap}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <ContagionGraph
                activeNode={activeSymbol}
                onNodeClick={setActiveSymbol}
              />
            </motion.div>
          )}
        </AnimatePresence>
        {/* HUD always on top */}
        <HUDOverlay activeSymbol={activeSymbol} onSymbolChange={setActiveSymbol} />

        {/* View Label */}
        <div style={styles.viewLabel}>
          <span style={styles.viewLabelDot} className="animate-pulse-cyan" />
          {view3D === 'terrain'
            ? `3D Price Terrain · ${activeSymbol} · 200 Days`
            : 'Market Contagion Web · GNN Correlation Graph'}
        </div>
      </div>

      {/* Bottom Stats Row */}
      <div style={styles.statsRow}>
        {STATS.map(s => (
          <motion.div
            key={s.label}
            style={styles.statCard}
            className="glass-card"
            whileHover={{ y: -3, borderColor: 'rgba(0,245,212,0.3)' }}
          >
            <div className="stat-label">{s.label}</div>
            <div style={{ ...styles.statVal, color: s.color || 'var(--text-primary)' }}>{s.value}</div>
            <div style={styles.statSub}>{s.sub}</div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

const STATS = [
  { label: 'Active Agent', value: 'RL Strategist', sub: 'Multi-Indicator PPO', color: 'var(--accent-cyan)' },
  { label: 'Signals Today', value: '14', sub: '11 Approved · 3 Vetoed', color: 'var(--text-primary)' },
  { label: 'Win Rate (30D)', value: '68.4%', sub: 'Sharpe: 1.84', color: 'var(--accent-green)' },
  { label: 'Max Drawdown', value: '-3.2%', sub: 'Limit: -5.0%', color: 'var(--accent-gold)' },
  { label: 'TMR Status', value: 'ALL GREEN', sub: 'Triple-Modular Armed', color: 'var(--accent-green)' },
  { label: 'Council', value: '4 / 4 Active', sub: 'Consensus Protocol ON', color: 'var(--accent-purple)' + 'ff' },
]

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    height: 'calc(100vh - 60px)',
    padding: 20,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  title: {
    fontFamily: 'Space Grotesk, sans-serif',
    fontSize: '1.3rem',
    fontWeight: 700,
    color: '#E2E8F0',
  },
  subtitle: {
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '0.7rem',
    color: '#7A94B0',
    marginTop: 2,
  },
  viewToggle: {
    display: 'flex',
    gap: 6,
    background: 'rgba(13,27,42,0.8)',
    border: '1px solid rgba(0,245,212,0.12)',
    borderRadius: 10,
    padding: 4,
  },
  toggleBtn: {
    padding: '6px 16px',
    background: 'transparent',
    border: 'none',
    borderRadius: 7,
    color: '#7A94B0',
    fontFamily: 'Space Grotesk, sans-serif',
    fontSize: '0.82rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  toggleBtnActive: {
    background: 'rgba(0,245,212,0.12)',
    color: '#00F5D4',
  },
  mainCanvas: {
    flex: 1,
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    border: '1px solid rgba(0,245,212,0.12)',
    minHeight: 0,
  },
  canvasWrap: {
    position: 'absolute',
    inset: 0,
  },
  viewLabel: {
    position: 'absolute',
    bottom: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(5,10,20,0.85)',
    border: '1px solid rgba(0,245,212,0.15)',
    borderRadius: 99,
    padding: '5px 16px',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '0.65rem',
    color: '#7A94B0',
    letterSpacing: '0.06em',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    pointerEvents: 'none',
  },
  viewLabelDot: {
    width: 6,
    height: 6,
    background: '#00F5D4',
    borderRadius: '50%',
    display: 'inline-block',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: 10,
    flexShrink: 0,
  },
  statCard: {
    padding: '12px 16px',
  },
  statVal: {
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '1rem',
    fontWeight: 700,
    marginTop: 4,
  },
  statSub: {
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '0.62rem',
    color: '#7A94B0',
    marginTop: 2,
  },
}
