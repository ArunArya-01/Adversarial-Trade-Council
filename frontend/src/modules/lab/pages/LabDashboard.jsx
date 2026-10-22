import { useEffect, useState } from 'react'
import { Activity, AlertTriangle, BarChart3, BrainCircuit, Database, FlaskConical, LineChart, ListChecks, Radar, WalletCards } from 'lucide-react'
import useLabStore from '../store/useLabStore'

const ICONS = {
  scanner: Radar,
  watchlists: ListChecks,
  'market-data': Database,
  strategies: LineChart,
  backtesting: BarChart3,
  ml: BrainCircuit,
  'paper-trading': WalletCards,
  risk: Activity,
}

export default function LabDashboard() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const researchPortfolio = useLabStore((state) => state.researchPortfolio)

  useEffect(() => {
    let active = true
    fetch('/api/lab/status')
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Lab status unavailable')))
      .then((data) => active && setStatus(data))
      .catch(() => active && setStatus(null))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  const capabilities = status?.capabilities || []

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <section className="card rounded-2xl p-6 md:p-8 border border-border bg-gradient-to-br from-surface via-surface to-red-950/20">
        <div className="flex gap-4 items-start">
          <div className="w-12 h-12 shrink-0 rounded-xl bg-red-gradient flex items-center justify-center"><FlaskConical size={24} /></div>
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.22em] text-red-400 font-bold">Research-only workspace</p>
            <h1 className="text-3xl font-black text-white mt-1">AI Investment Lab</h1>
            <p className="text-text-secondary mt-3 max-w-3xl">A separate platform for validated data, reproducible strategies, backtesting, and future paper trading. It currently provides no investment signals, live prices, model outputs, or order execution.</p>
          </div>
        </div>
      </section>

      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex gap-3 text-sm text-text-secondary">
        <AlertTriangle className="text-red-400 shrink-0" size={18} />
        <p><span className="font-bold text-white">Data status: </span>{loading ? 'Checking backend availability…' : status?.data_source === 'local-csv-only' ? 'Local historical CSV imports are supported; no approved provider or live feed is connected.' : 'Unknown.'} Academy simulation data is not used as Lab research evidence.</p>
      </div>

      <section>
        <div className="flex items-end justify-between gap-4 mb-3">
          <div><h2 className="text-xl font-extrabold text-white">Research roadmap</h2><p className="text-sm text-text-muted mt-1">Every capability remains unavailable until its data and evaluation requirements are met.</p></div>
          <span className="text-[10px] uppercase tracking-wider font-mono text-text-dim">Portfolio: {researchPortfolio.status}</span>
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {capabilities.map((capability) => {
            const Icon = ICONS[capability.id] || FlaskConical
            return <article key={capability.id} className="card rounded-xl border border-border p-4 min-h-40 flex flex-col">
              <Icon size={20} className="text-red-400 mb-4" />
              <h3 className="text-sm font-extrabold text-white">{capability.label}</h3>
              <p className="text-xs text-text-muted mt-2 leading-relaxed flex-1">{capability.message}</p>
              <span className="mt-4 text-[10px] uppercase font-mono font-bold tracking-wider text-text-dim border border-border rounded px-2 py-1 w-fit">{capability.status}</span>
            </article>
          })}
        </div>
      </section>
    </div>
  )
}
