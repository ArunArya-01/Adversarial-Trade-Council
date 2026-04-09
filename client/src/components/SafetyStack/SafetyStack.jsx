import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TMR_STATUS, KILL_SWITCH_CONFIG } from '../../data/mockData'

const STATUS_COLOR = {
  GREEN:  { bg: 'rgba(6,255,165,0.12)', border: 'rgba(6,255,165,0.4)', dot: '#06FFA5', text: 'var(--accent-green)' },
  YELLOW: { bg: 'rgba(255,214,10,0.1)',  border: 'rgba(255,214,10,0.4)',  dot: '#FFD60A', text: 'var(--accent-gold)' },
  RED:    { bg: 'rgba(255,45,85,0.12)', border: 'rgba(255,45,85,0.5)',   dot: '#FF2D55', text: 'var(--accent-red)' },
}

function TrafficLight({ status }) {
  return (
    <div style={styles.trafficLight}>
      {['GREEN', 'YELLOW', 'RED'].map(s => (
        <div key={s} style={{
          ...styles.lightBulb,
          background: status === s ? STATUS_COLOR[s].dot : 'rgba(0,0,0,0.5)',
          boxShadow: status === s ? `0 0 16px ${STATUS_COLOR[s].dot}` : 'none',
        }} className={status === s && s === 'RED' ? 'animate-pulse-red' : status === s && s === 'GREEN' ? 'animate-pulse-green' : ''} />
      ))}
    </div>
  )
}

function TMRGate({ gateKey, gate }) {
  const col = STATUS_COLOR[gate.status]
  return (
    <motion.div
      style={{ ...styles.tmrGate, background: col.bg, border: `1px solid ${col.border}` }}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div style={styles.tmrGateHeader}>
        <TrafficLight status={gate.status} />
        <div>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: '#E2E8F0' }}>{gate.label}</div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: col.text }}>{gate.detail}</div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ ...styles.statusChip, background: col.bg, color: col.text, border: `1px solid ${col.border}` }}>
            {gate.status}
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#3D5A73', marginTop: 3 }}>{gate.latency}ms</div>
        </div>
      </div>
    </motion.div>
  )
}

function KillSwitchMetric({ label, value, max, unit, danger }) {
  const pct = Math.min(100, Math.abs((value / max) * 100))
  const overThreshold = danger ? value <= max * 0.6 : pct > 70
  return (
    <div style={styles.ksMetric}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span className="stat-label">{label}</span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: overThreshold ? 'var(--accent-red)' : 'var(--accent-green)', fontWeight: 700 }}>
          {value}{unit} <span style={{ color: 'var(--text-dim)' }}>/ {max}{unit}</span>
        </span>
      </div>
      <div className="progress-bar">
        <div
          className={`progress-fill ${overThreshold ? 'progress-fill-pink' : 'progress-fill-green'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function SafetyStack() {
  const [ksConfig, setKsConfig] = useState(KILL_SWITCH_CONFIG)
  const [blackSwanActive, setBlackSwanActive] = useState(false)
  const [chaosMode, setChaosMode] = useState(false)
  const [tmrStates, setTmrStates] = useState(TMR_STATUS)
  const [editDrawdown, setEditDrawdown] = useState(ksConfig.dailyDrawdownLimit)
  const [editMaxPos, setEditMaxPos] = useState(ksConfig.maxPositionPct)

  const triggerBlackSwan = () => {
    setBlackSwanActive(true)
    setChaosMode(true)
    // Degrade agents
    setTmrStates(prev => ({
      ...prev,
      sentiment: { ...prev.sentiment, status: 'RED', detail: 'Black Swan: Flash Crash Detected' },
      riskAuditor: { ...prev.riskAuditor, status: 'YELLOW', detail: 'Reviewing exposure limits' },
    }))
    setTimeout(() => {
      setTmrStates(prev => ({
        ...prev,
        sentiment: { ...prev.sentiment, status: 'GREEN', detail: 'News: CLEAR — Black Swan resolved' },
        riskAuditor: { ...prev.riskAuditor, status: 'GREEN', detail: 'Position: VALID' },
      }))
      setBlackSwanActive(false)
    }, 8000)
  }

  const resetChaos = () => {
    setChaosMode(false)
    setBlackSwanActive(false)
    setTmrStates(TMR_STATUS)
  }

  return (
    <div style={styles.container}>
      {/* Black Swan Modal */}
      <AnimatePresence>
        {blackSwanActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={styles.blackSwanOverlay}
          >
            <motion.div
              style={styles.blackSwanModal}
              initial={{ scale: 0.7, y: -40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.7, y: -40 }}
            >
              <div style={styles.bsIcon}>☠️</div>
              <div style={styles.bsTitle}>BLACK SWAN DETECTED</div>
              <div style={styles.bsSub}>Flash Crash Event · 3σ Move in Progress</div>
              <div style={styles.bsAction}>
                <span style={{ color: 'var(--accent-cyan)' }}>🧠 Agent Response:</span>
                <div style={styles.bsText}>
                  All longs halted. Rotating to defensive assets (Gold +12%, T-Bonds +8%).<br />
                  Kill-switch armed. Council in emergency consensus protocol.<br />
                  <strong style={{ color: 'var(--accent-green)' }}>Capital preservation mode ACTIVE.</strong>
                </div>
              </div>
              <div style={styles.bsBar}>
                <div style={styles.bsBarFill} className="animate-blink" />
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 8 }}>
                Resolving… auto-dismiss in 8s
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}><span style={{ color: 'var(--accent-pink)' }}>🛡</span> Safety Stack</h2>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: '#7A94B0' }}>
            Aviation-Grade Triple-Modular Redundancy · Circuit Breakers · Kill-Switch
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            id="safety-blackswan"
            className="btn btn-danger"
            onClick={triggerBlackSwan}
            disabled={blackSwanActive}
          >
            ☠️ Simulate Black Swan
          </button>
          {chaosMode && (
            <button id="safety-reset-chaos" className="btn btn-ghost" onClick={resetChaos}>↺ Reset</button>
          )}
        </div>
      </div>

      <div style={styles.body}>
        {/* TMR Gates Column */}
        <div style={styles.tmrColumn}>
          <div style={styles.sectionLabel}>
            <span>Triple-Modular Redundancy</span>
            <span className="badge badge-green animate-pulse-green">ARMED</span>
          </div>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: '#7A94B0', marginBottom: 14, lineHeight: 1.6 }}>
            A trade executes ONLY if all 3 gates return GREEN. Based on aviation TMR used in fly-by-wire systems.
          </p>
          <div style={styles.tmrGates}>
            {Object.entries(tmrStates).map(([key, gate]) => (
              <TMRGate key={key} gateKey={key} gate={gate} />
            ))}
          </div>

          {/* Consensus Visual */}
          <div style={styles.consensusViz}>
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
              {Object.values(tmrStates).map((g, i) => (
                <React.Fragment key={i}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ ...styles.consensusDot, background: STATUS_COLOR[g.status].dot, boxShadow: `0 0 12px ${STATUS_COLOR[g.status].dot}` }} className={g.status === 'GREEN' ? 'animate-pulse-green' : g.status === 'RED' ? 'animate-pulse-red' : ''} />
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem', color: '#7A94B0', marginTop: 6 }}>{g.label.split(' ')[0]}</div>
                  </div>
                  {i < 2 && (
                    <div style={styles.consensusLine}>
                      <div style={{ ...styles.consensusLineFill, background: Object.values(tmrStates)[i].status === 'GREEN' && Object.values(tmrStates)[i + 1].status === 'GREEN' ? 'var(--accent-green)' : 'var(--border)' }} />
                    </div>
                  )}
                </React.Fragment>
              ))}
              <div style={{ ...styles.consensusArrow }}>→</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  ...styles.executeDot,
                  background: Object.values(tmrStates).every(g => g.status === 'GREEN') ? 'var(--accent-green)' : 'var(--accent-red)',
                  boxShadow: Object.values(tmrStates).every(g => g.status === 'GREEN') ? '0 0 16px var(--accent-green)' : '0 0 16px var(--accent-red)',
                }} />
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem', color: '#7A94B0', marginTop: 6 }}>EXECUTE</div>
              </div>
            </div>
          </div>
        </div>

        {/* Kill Switch Column */}
        <div style={styles.ksColumn}>
          <div style={styles.sectionLabel}>
            <span>Kill-Switch Configuration</span>
            <span className={`badge ${ksConfig.status === 'ARMED' ? 'badge-green' : 'badge-red'}`}>{ksConfig.status}</span>
          </div>

          <div style={styles.ksCard}>
            <KillSwitchMetric label="Daily Drawdown" value={ksConfig.currentDailyPnL} max={Math.abs(ksConfig.dailyDrawdownLimit)} unit="%" danger={false} />
            <KillSwitchMetric label="Consecutive Losses" value={ksConfig.consecutiveLosses} max={ksConfig.consecutiveLossLimit} unit="" danger={false} />
            <KillSwitchMetric label="Black Swan σ-level" value={1.2} max={ksConfig.blackSwanThreshold} unit="σ" danger={false} />
            <KillSwitchMetric label="Max Position %" value={43.6} max={ksConfig.maxPositionPct} unit="%" danger={false} />
          </div>

          {/* Adjustable Limits */}
          <div className="glass-card" style={{ marginTop: 12 }}>
            <div style={styles.sectionLabel} style={{ marginBottom: 14 }}>
              <span>Adjust Guardrails</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span className="stat-label">Daily Drawdown Limit</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', color: 'var(--accent-red)', fontWeight: 700 }}>{editDrawdown}%</span>
                </div>
                <input
                  id="limit-drawdown"
                  type="range" min={-15} max={-1} step={0.5}
                  value={editDrawdown}
                  onChange={e => { setEditDrawdown(+e.target.value); setKsConfig(p => ({...p, dailyDrawdownLimit: +e.target.value})) }}
                  style={styles.slider}
                />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span className="stat-label">Max Position Size</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', color: 'var(--accent-gold)', fontWeight: 700 }}>{editMaxPos}%</span>
                </div>
                <input
                  id="limit-position"
                  type="range" min={10} max={100} step={5}
                  value={editMaxPos}
                  onChange={e => { setEditMaxPos(+e.target.value); setKsConfig(p => ({...p, maxPositionPct: +e.target.value})) }}
                  style={styles.slider}
                />
              </div>
            </div>
          </div>

          {/* Circuit Breaker Log */}
          <div className="glass-card glass-card-pink" style={{ marginTop: 12 }}>
            <div className="stat-label" style={{ marginBottom: 10 }}>Circuit Breaker Log</div>
            {[
              { ts: '09:34:12', event: 'Daily start — all limits reset', status: 'INFO' },
              { ts: '10:15:44', event: 'Position size check: 50 NVDA → PASS (43.6%)', status: 'PASS' },
              { ts: '11:02:18', event: 'Consecutive loss counter: 0/3', status: 'INFO' },
              { ts: '13:47:55', event: 'σ-monitor: Max move 1.2σ. Below 3σ threshold', status: 'PASS' },
            ].map((log, i) => (
              <div key={i} style={styles.logLine}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', color: '#3D5A73' }}>{log.ts}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', color: log.status === 'PASS' ? 'var(--accent-green)' : log.status === 'WARN' ? 'var(--accent-gold)' : '#7A94B0', flex: 1 }}>
                  {log.event}
                </span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: log.status === 'PASS' ? 'var(--accent-green)' : '#7A94B0' }}>{log.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chaos Mode Status */}
        {chaosMode && !blackSwanActive && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={styles.chaosResolved}
          >
            <h4 style={{ color: 'var(--accent-green)', marginBottom: 6 }}>✅ Black Swan Resolved</h4>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: '#A0B4C8', lineHeight: 1.6 }}>
              Emergency protocol executed. Rotated to defensive assets. Capital preserved. All TMR gates back to GREEN.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: { padding: 20, height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column', gap: 16, overflow: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 },
  title: { fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.3rem', fontWeight: 700, color: '#E2E8F0' },
  body: { display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 16, flex: 1 },
  sectionLabel: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.88rem', color: '#E2E8F0', marginBottom: 12 },
  tmrColumn: { display: 'flex', flexDirection: 'column', overflow: 'auto' },
  tmrGates: { display: 'flex', flexDirection: 'column', gap: 10 },
  tmrGate: { borderRadius: 10, padding: '12px 16px', transition: 'all 0.3s' },
  tmrGateHeader: { display: 'flex', alignItems: 'center', gap: 12 },
  trafficLight: { display: 'flex', flexDirection: 'column', gap: 4, padding: '4px 8px', background: 'rgba(0,0,0,0.4)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' },
  lightBulb: { width: 14, height: 14, borderRadius: '50%', transition: 'all 0.4s' },
  statusChip: { padding: '2px 10px', borderRadius: 99, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em' },
  consensusViz: { marginTop: 16, background: 'rgba(5,10,20,0.6)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 20px' },
  consensusDot: { width: 18, height: 18, borderRadius: '50%', transition: 'all 0.4s' },
  executeDot: { width: 22, height: 22, borderRadius: '50%', transition: 'all 0.4s' },
  consensusLine: { flex: 1, height: 2, background: 'var(--border)', position: 'relative', overflow: 'hidden', marginTop: 8 },
  consensusLineFill: { position: 'absolute', inset: 0, transition: 'background 0.5s' },
  consensusArrow: { fontFamily: 'JetBrains Mono, monospace', fontSize: '1rem', color: 'var(--text-dim)', marginTop: 8 },
  ksColumn: { display: 'flex', flexDirection: 'column', overflow: 'auto' },
  ksCard: { background: 'rgba(13,27,42,0.7)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 },
  ksMetric: { display: 'flex', flexDirection: 'column' },
  slider: { width: '100%', appearance: 'none', height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 99, cursor: 'pointer', outline: 'none' },
  logLine: { display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', borderBottom: '1px solid rgba(26,39,68,0.4)' },
  blackSwanOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' },
  blackSwanModal: { background: '#0D1B2A', border: '2px solid var(--accent-red)', borderRadius: 20, padding: '40px 48px', textAlign: 'center', maxWidth: 480, boxShadow: '0 0 60px rgba(255,45,85,0.5)' },
  bsIcon: { fontSize: '3rem', marginBottom: 12 },
  bsTitle: { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.6rem', color: 'var(--accent-red)', letterSpacing: '-0.02em', marginBottom: 6 },
  bsSub: { fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: '#7A94B0', marginBottom: 20 },
  bsAction: { background: 'rgba(0,245,212,0.05)', border: '1px solid rgba(0,245,212,0.15)', borderRadius: 10, padding: '14px 16px', textAlign: 'left' },
  bsText: { fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: '#A0B4C8', lineHeight: 1.8, marginTop: 8 },
  bsBar: { height: 4, background: 'rgba(255,45,85,0.2)', borderRadius: 99, marginTop: 20, overflow: 'hidden' },
  bsBarFill: { height: '100%', width: '100%', background: 'var(--accent-red)', borderRadius: 99 },
  chaosResolved: { gridColumn: '1/-1', background: 'rgba(6,255,165,0.06)', border: '1px solid rgba(6,255,165,0.2)', borderRadius: 12, padding: '16px 20px' },
}
