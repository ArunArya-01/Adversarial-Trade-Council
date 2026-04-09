import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { generateAgentVotes, TRADE_PROPOSALS } from '../../data/mockData'

const AGENT_META = {
  strategist: { fullName: 'RL Strategist',    role: 'Technical Analysis & RL Signal',       icon: '🧠', colorVar: '--accent-cyan',   badgeClass: 'badge-cyan'   },
  macro:       { fullName: 'Macro Agent',      role: 'Global Sentiment & Fed Policy',        icon: '📡', colorVar: '--accent-purple', badgeClass: 'badge-purple' },
  graph:       { fullName: 'GNN Graph Agent',  role: 'Correlation Contagion Mapping',        icon: '🕸', colorVar: '--accent-gold',   badgeClass: 'badge-gold'   },
  devil:       { fullName: "Devil's Advocate", role: 'Adversarial Risk & VETO Authority',    icon: '👿', colorVar: '--accent-pink',   badgeClass: 'badge-pink'   },
}

function VerdictBadge({ verdict, agent }) {
  const isPositive = ['BUY', 'BULLISH', 'LOW CONTAGION', 'NO VETO'].includes(verdict)
  const isVeto = verdict === 'VETO'
  const cls = isVeto ? 'badge-red' : (isPositive ? 'badge-green' : 'badge-pink')
  return <span className={`badge ${cls}`}>{verdict}</span>
}

function AgentCard({ agentKey, vote, isDeliberating }) {
  const meta = AGENT_META[agentKey]
  const accentColor = `var(${meta.colorVar})`
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      layout
      style={{
        ...styles.agentCard,
        borderColor: expanded ? accentColor : 'rgba(0,245,212,0.1)',
        boxShadow: expanded ? `0 0 20px ${accentColor}33` : 'none',
      }}
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {/* Card Header */}
      <div style={styles.agentHeader} onClick={() => setExpanded(!expanded)}>
        <div style={styles.agentIconWrap}>
          <span style={styles.agentIcon}>{meta.icon}</span>
          <div style={{ ...styles.agentPulse, background: accentColor }} className={isDeliberating ? 'animate-pulse-cyan' : ''} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={styles.agentName}>{meta.fullName}</div>
          <div style={styles.agentRole}>{meta.role}</div>
        </div>
        <div style={styles.agentVerdictWrap}>
          {isDeliberating ? (
            <span className="badge badge-gold animate-blink">THINKING…</span>
          ) : (
            <VerdictBadge verdict={vote.verdict} agent={agentKey} />
          )}
          <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginLeft: 4 }}>
            {expanded ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {/* Confidence bar */}
      {!isDeliberating && (
        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span className="stat-label">Confidence</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: accentColor }}>
              {(vote.confidence * 100).toFixed(0)}%
            </span>
          </div>
          <div className="progress-bar">
            <motion.div
              className={`progress-fill progress-fill-${meta.colorVar.replace('--accent-', '')}`}
              initial={{ width: 0 }}
              animate={{ width: `${vote.confidence * 100}%` }}
              transition={{ duration: 0.8, delay: 0.2 }}
              style={{ height: '100%', borderRadius: 99 }}
            />
          </div>
        </div>
      )}

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && !isDeliberating && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={styles.expandBody}>
              <div style={styles.reasoningBox}>
                <span style={{ ...styles.reasoningLabel, color: accentColor }}>REASONING</span>
                <p style={styles.reasoningText}>{vote.reasoning}</p>
              </div>

              {/* Agent-specific metrics */}
              {agentKey === 'strategist' && vote.indicators && (
                <div style={styles.metricsRow}>
                  {Object.entries(vote.indicators).map(([k, v]) => (
                    <div key={k} style={styles.metricChip}>
                      <div className="stat-label">{k}</div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: accentColor }}>{v}</div>
                    </div>
                  ))}
                </div>
              )}
              {agentKey === 'macro' && vote.sentiment && (
                <div style={styles.metricsRow}>
                  {Object.entries(vote.sentiment).map(([k, v]) => (
                    <div key={k} style={styles.metricChip}>
                      <div className="stat-label">{k}</div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: v >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                        {v > 0 ? '+' : ''}{v.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {agentKey === 'graph' && (
                <div style={styles.metricsRow}>
                  <div style={styles.metricChip}>
                    <div className="stat-label">Contagion Score</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', color: vote.contagionScore > 0.5 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                      {(vote.contagionScore * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div style={styles.metricChip}>
                    <div className="stat-label">Affected Nodes</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: accentColor }}>
                      {vote.affectedNodes.join(' · ')}
                    </div>
                  </div>
                </div>
              )}
              {agentKey === 'devil' && vote.risks && (
                <div style={{ marginTop: 10 }}>
                  <div className="stat-label" style={{ marginBottom: 6 }}>Identified Risks</div>
                  {vote.risks.map((r, i) => (
                    <div key={i} style={styles.riskItem}>
                      <span style={{ color: 'var(--accent-pink)' }}>⚠</span> {r}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function CouncilChamber() {
  const [signal, setSignal] = useState('BUY')
  const [votes, setVotes] = useState(null)
  const [deliberating, setDeliberating] = useState(false)
  const [tmrResult, setTmrResult] = useState(null)
  const [selectedProposal, setSelectedProposal] = useState(TRADE_PROPOSALS[0])

  const runCouncil = (sig) => {
    setSignal(sig)
    setDeliberating(true)
    setVotes(null)
    setTmrResult(null)
    // Pre-generate votes immediately, reveal after deliberation window
    const v = generateAgentVotes(sig)
    setTimeout(() => {
      setVotes(v)
      setDeliberating(false)
      const approved = sig === 'BUY'
        ? v.strategist.confidence > 0.65 && v.devil.verdict === 'NO VETO'
        : false
      setTimeout(() => setTmrResult(approved ? 'APPROVED' : 'BLOCKED'), 600)
    }, 1800)
  }

  useEffect(() => { runCouncil('BUY') }, [])

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}><span style={{ color: 'var(--accent-cyan)' }}>🧠</span> Council Chamber</h2>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: '#7A94B0' }}>
            Multi-agent adversarial consensus · Institutional-grade deliberation
          </p>
        </div>
        <div style={styles.headerActions}>
          <button id="council-buy" className="btn btn-primary" onClick={() => runCouncil('BUY')}>▲ Test BUY Signal</button>
          <button id="council-sell" className="btn btn-danger" onClick={() => runCouncil('SELL')}>▼ Test SELL Signal</button>
        </div>
      </div>

      <div style={styles.body}>
        {/* Trade Proposal */}
        <div style={styles.proposalSection}>
          <div className="glass-card" style={{ borderColor: 'rgba(247,37,133,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div className="stat-label">Active Trade Proposal</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {TRADE_PROPOSALS.map(p => (
                  <button
                    key={p.id}
                    id={`proposal-${p.id}`}
                    style={{
                      ...styles.propBtn,
                      borderColor: selectedProposal.id === p.id ? 'var(--accent-cyan)' : 'var(--border)',
                      color: selectedProposal.id === p.id ? 'var(--accent-cyan)' : 'var(--text-muted)',
                    }}
                    onClick={() => { setSelectedProposal(p); runCouncil(p.action) }}
                  >
                    {p.symbol} {p.action}
                  </button>
                ))}
              </div>
            </div>
            <div style={styles.proposalGrid}>
              <div className="stat-block">
                <div className="stat-label">Symbol</div>
                <div style={{ ...styles.propVal, color: 'var(--accent-cyan)' }}>{selectedProposal.symbol}</div>
              </div>
              <div className="stat-block">
                <div className="stat-label">Action</div>
                <div style={{ ...styles.propVal, color: selectedProposal.action === 'BUY' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                  {selectedProposal.action}
                </div>
              </div>
              <div className="stat-block">
                <div className="stat-label">Entry</div>
                <div className="stat-value">${selectedProposal.entryPrice.toLocaleString()}</div>
              </div>
              <div className="stat-block">
                <div className="stat-label">Stop Loss</div>
                <div style={{ ...styles.propVal, color: 'var(--accent-red)' }}>${selectedProposal.stopLoss.toLocaleString()}</div>
              </div>
              <div className="stat-block">
                <div className="stat-label">Take Profit</div>
                <div style={{ ...styles.propVal, color: 'var(--accent-green)' }}>${selectedProposal.takeProfit.toLocaleString()}</div>
              </div>
              <div className="stat-block">
                <div className="stat-label">R:R Ratio</div>
                <div style={{ ...styles.propVal, color: 'var(--accent-gold)' }}>{selectedProposal.riskReward}</div>
              </div>
            </div>
            <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(114,9,183,0.1)', borderRadius: 8, border: '1px solid rgba(114,9,183,0.2)' }}>
              <span className="stat-label">Strategy: </span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: '#BF7AFF' }}>{selectedProposal.strategy}</span>
            </div>
          </div>

          {/* TMR Result */}
          <AnimatePresence>
            {tmrResult && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                style={{
                  ...styles.tmrResult,
                  background: tmrResult === 'APPROVED' ? 'rgba(6,255,165,0.08)' : 'rgba(255,45,85,0.08)',
                  borderColor: tmrResult === 'APPROVED' ? 'rgba(6,255,165,0.3)' : 'rgba(255,45,85,0.3)',
                }}
              >
                <div style={{ fontSize: '2rem' }}>{tmrResult === 'APPROVED' ? '✅' : '🛑'}</div>
                <div>
                  <div style={{ ...styles.tmrLabel, color: tmrResult === 'APPROVED' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                    TMR VERDICT: {tmrResult}
                  </div>
                  <div style={styles.tmrSub}>
                    {tmrResult === 'APPROVED'
                      ? 'All safety checks passed. Trade cleared for execution.'
                      : 'Trade blocked. Risk guardrails triggered. Capital preserved.'}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Agent Cards */}
        <div style={styles.agentGrid}>
          {Object.entries(AGENT_META).map(([key]) => (
            <AgentCard
              key={key}
              agentKey={key}
              vote={votes?.[key] || { verdict: '—', confidence: 0, reasoning: '', risks: [], indicators: {} }}
              isDeliberating={deliberating}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { padding: 20, display: 'flex', flexDirection: 'column', gap: 16, height: 'calc(100vh - 60px)', overflow: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 },
  title: { fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.3rem', fontWeight: 700, color: '#E2E8F0' },
  headerActions: { display: 'flex', gap: 10 },
  body: { display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 16, flex: 1 },
  proposalSection: { display: 'flex', flexDirection: 'column', gap: 12 },
  proposalGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 4 },
  propVal: { fontFamily: 'JetBrains Mono, monospace', fontSize: '1.1rem', fontWeight: 700, marginTop: 2 },
  propBtn: { padding: '4px 12px', background: 'transparent', border: '1px solid', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, transition: 'all 0.2s' },
  agentGrid: { display: 'flex', flexDirection: 'column', gap: 10, overflow: 'auto' },
  agentCard: { background: 'rgba(13,27,42,0.7)', border: '1px solid', borderRadius: 12, padding: '14px 16px', cursor: 'pointer', transition: 'all 0.25s', backdropFilter: 'blur(12px)' },
  agentHeader: { display: 'flex', alignItems: 'center', gap: 12 },
  agentIconWrap: { position: 'relative', width: 40, height: 40, flexShrink: 0 },
  agentIcon: { fontSize: '1.4rem', lineHeight: 1 },
  agentPulse: { position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', border: '2px solid var(--bg-void)' },
  agentName: { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: '#E2E8F0' },
  agentRole: { fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', color: '#7A94B0', marginTop: 2 },
  agentVerdictWrap: { display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 },
  expandBody: { marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(0,245,212,0.08)' },
  reasoningBox: { background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '10px 12px', marginBottom: 10 },
  reasoningLabel: { fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', display: 'block', marginBottom: 6 },
  reasoningText: { fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', color: '#A0B4C8', lineHeight: 1.6 },
  metricsRow: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  metricChip: { background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '6px 12px', border: '1px solid rgba(0,245,212,0.08)' },
  riskItem: { fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: '#7A94B0', padding: '3px 0' },
  tmrResult: { borderRadius: 12, padding: '16px 20px', border: '1px solid', display: 'flex', alignItems: 'center', gap: 16 },
  tmrLabel: { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.01em' },
  tmrSub: { fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: '#7A94B0', marginTop: 4 },
}
