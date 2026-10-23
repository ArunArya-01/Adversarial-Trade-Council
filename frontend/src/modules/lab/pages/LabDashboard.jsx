import { useEffect, useState } from 'react'
import { Activity, AlertTriangle, BarChart3, BrainCircuit, Database, FileUp, FlaskConical, LineChart, ListChecks, Radar, WalletCards } from 'lucide-react'
import useLabStore from '../store/useLabStore'

const ICONS = { scanner: Radar, watchlists: ListChecks, 'market-data': Database, strategies: LineChart, backtesting: BarChart3, ml: BrainCircuit, 'paper-trading': WalletCards, risk: Activity }
const number = (value) => typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'
const percent = (value) => typeof value === 'number' ? `${(value * 100).toFixed(2)}%` : '—'
const downloadJson = (filename, value) => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url)
}

export default function LabDashboard() {
  const [status, setStatus] = useState(null)
  const [datasets, setDatasets] = useState([])
  const [watchlists, setWatchlists] = useState([])
  const [datasetId, setDatasetId] = useState('')
  const [strategy, setStrategy] = useState('sma_crossover')
  const [backtest, setBacktest] = useState(null)
  const [scan, setScan] = useState(null)
  const [portfolio, setPortfolio] = useState(null)
  const [report, setReport] = useState(null)
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')
  const researchPortfolio = useLabStore((state) => state.researchPortfolio)

  const loadDatasets = async () => {
    const response = await fetch('/api/lab/datasets')
    if (!response.ok) throw new Error('Historical datasets are unavailable.')
    const rows = await response.json()
    setDatasets(rows)
    setDatasetId((current) => current || rows[0]?.dataset_id || '')
  }

  const loadWatchlists = async () => {
    const response = await fetch('/api/lab/watchlists')
    if (!response.ok) throw new Error('Watchlists are unavailable.')
    setWatchlists(await response.json())
  }

  useEffect(() => {
    let active = true
    Promise.all([fetch('/api/lab/status').then((response) => response.ok ? response.json() : null), loadDatasets().catch(() => []), loadWatchlists().catch(() => [])])
      .then(([labStatus]) => active && setStatus(labStatus))
      .catch(() => active && setMessage('The Lab backend is unavailable.'))
    return () => { active = false }
  }, [])

  const importDataset = async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    const file = form.datasetFile.files[0]
    const source = form.datasetSource.value.trim()
    if (!file || !source) return setMessage('Choose a CSV and identify its licensed source or local export.')
    setBusy('import'); setMessage('')
    try {
      const body = new FormData(); body.append('file', file); body.append('source', source)
      const response = await fetch('/api/lab/datasets/import', { method: 'POST', body })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.detail || 'Import failed.')
      await loadDatasets(); setDatasetId(payload.dataset_id); setMessage(`Imported ${payload.instrument} historical data (${payload.row_count} rows).`); form.reset()
    } catch (error) { setMessage(error.message) } finally { setBusy('') }
  }

  const runBacktest = async () => {
    if (!datasetId) return setMessage('Import and select a historical dataset first.')
    setBusy('backtest'); setMessage('')
    try {
      const response = await fetch('/api/lab/backtests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dataset_id: datasetId, strategy }) })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.detail || 'Backtest failed.')
      setBacktest(payload)
    } catch (error) { setMessage(error.message) } finally { setBusy('') }
  }

  const runScan = async () => {
    if (!datasetId) return setMessage('Import and select a historical dataset first.')
    setBusy('scan'); setMessage('')
    try {
      const response = await fetch('/api/lab/scans/historical', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dataset_id: datasetId, minimum_rsi: 50, require_positive_momentum: true }) })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.detail || 'Historical scan failed.')
      setScan(payload)
    } catch (error) { setMessage(error.message) } finally { setBusy('') }
  }

  const createWatchlist = async (event) => {
    event.preventDefault()
    const name = event.currentTarget.watchlistName.value.trim()
    if (!name) return
    setBusy('watchlist'); setMessage('')
    try {
      const response = await fetch('/api/lab/watchlists', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.detail || 'Could not create watchlist.')
      setWatchlists((current) => [payload, ...current]); event.currentTarget.reset()
    } catch (error) { setMessage(error.message) } finally { setBusy('') }
  }

  const createPortfolio = async () => {
    setBusy('portfolio'); setMessage('')
    try {
      const response = await fetch('/api/lab/paper-portfolios', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Lab paper portfolio', starting_capital: 100000, benchmark_symbol: 'NIFTY' }) })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.detail || 'Could not create a paper portfolio.')
      setPortfolio(payload)
    } catch (error) { setMessage(error.message) } finally { setBusy('') }
  }

  const createReport = async () => {
    if (!portfolio) return setMessage('Create a paper portfolio first; reports require verified Lab records.')
    setBusy('report'); setMessage('')
    try {
      const response = await fetch('/api/lab/research/reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ portfolio_id: portfolio.portfolio.id, dataset_id: datasetId || null, question: 'Summarize the available evidence and limitations.' }) })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.detail || 'Research report failed.')
      setReport(payload)
    } catch (error) { setMessage(error.message) } finally { setBusy('') }
  }

  const result = backtest?.strategy_result
  return <div className="max-w-6xl mx-auto space-y-6">
    <section className="card rounded-2xl p-6 md:p-8 border border-border bg-gradient-to-br from-surface via-surface to-red-950/20"><div className="flex gap-4 items-start"><div className="w-12 h-12 shrink-0 rounded-xl bg-red-gradient flex items-center justify-center"><FlaskConical size={24} /></div><div><p className="text-xs font-mono uppercase tracking-[0.22em] text-red-400 font-bold">Research-only workspace</p><h1 className="text-3xl font-black text-white mt-1">AI Investment Lab</h1><p className="text-text-secondary mt-3 max-w-3xl">Validated historical research, reproducible simulations, and auditable paper portfolios. No live orders or investment advice.</p></div></div></section>
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex gap-3 text-sm text-text-secondary"><AlertTriangle className="text-red-400 shrink-0" size={18} /><p><b className="text-white">Data status: </b>Local historical imports are available. Live Groww data remains disabled until verified server-side credentials are supplied.</p></div>
    {message && <div className="rounded-xl border border-border bg-surface p-3 text-sm text-text-secondary">{message}</div>}
    <section className="grid lg:grid-cols-2 gap-5">
      <article className="card rounded-xl border border-border p-5"><h2 className="flex items-center gap-2 text-white font-bold"><FileUp size={18} className="text-red-400" />Historical dataset</h2><p className="text-xs text-text-muted mt-2">Import validated OHLCV CSV data with a provenance source.</p><form onSubmit={importDataset} className="mt-4 space-y-3"><input name="datasetFile" type="file" accept=".csv,text/csv" className="block w-full text-xs text-text-muted" /><input name="datasetSource" placeholder="Licensed provider or local export" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-white" /><button disabled={busy === 'import'} className="rounded-lg bg-red-gradient px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busy === 'import' ? 'Importing…' : 'Import historical CSV'}</button></form>{datasets.length > 0 && <select value={datasetId} onChange={(event) => setDatasetId(event.target.value)} className="mt-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-white">{datasets.map((dataset) => <option key={dataset.dataset_id} value={dataset.dataset_id}>{dataset.instrument} · {dataset.frequency} · {dataset.row_count} bars</option>)}</select>}</article>
      <article className="card rounded-xl border border-border p-5"><h2 className="flex items-center gap-2 text-white font-bold"><BarChart3 size={18} className="text-red-400" />Reproducible backtest</h2><p className="text-xs text-text-muted mt-2">Signals execute at the following bar open with documented costs.</p><div className="flex gap-3 mt-4"><select value={strategy} onChange={(event) => setStrategy(event.target.value)} className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-white"><option value="sma_crossover">SMA crossover</option><option value="momentum">Momentum</option><option value="buy_and_hold">Buy and hold</option></select><button onClick={runBacktest} disabled={busy === 'backtest'} className="rounded-lg bg-red-gradient px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busy === 'backtest' ? 'Running…' : 'Run'}</button></div>{result && <div className="mt-4 grid grid-cols-2 gap-3 text-xs"><div className="rounded-lg bg-background p-3"><span className="text-text-muted">Final equity</span><div className="text-white font-bold mt-1">₹{number(result.final_equity)}</div></div><div className="rounded-lg bg-background p-3"><span className="text-text-muted">Return / drawdown</span><div className="text-white font-bold mt-1">{percent(result.metrics.cumulative_return)} / {percent(result.metrics.max_drawdown)}</div></div><p className="col-span-2 text-text-muted">Historical simulation only. Excess return vs buy-and-hold: {percent(backtest.excess_cumulative_return)}.</p><button onClick={() => downloadJson('trademind-backtest.json', backtest)} className="w-fit rounded border border-border px-3 py-1 text-text-secondary">Export JSON</button></div>}</article>
    </section>
    <section className="card rounded-xl border border-border p-5"><h2 className="flex items-center gap-2 text-white font-bold"><Radar size={18} className="text-red-400" />Historical scanner</h2><p className="text-xs text-text-muted mt-2">Checks the selected dataset’s most recent historical bar against SMA trend, RSI ≥ 50, and positive 20-period momentum.</p><button onClick={runScan} disabled={busy === 'scan'} className="mt-4 rounded-lg border border-red-500/50 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busy === 'scan' ? 'Scanning…' : 'Run historical scan'}</button>{scan && <div className="mt-4 grid sm:grid-cols-2 gap-3 text-xs"><div className="rounded-lg bg-background p-3"><span className="text-text-muted">As of</span><div className="text-white font-bold mt-1">{scan.as_of}</div></div><div className="rounded-lg bg-background p-3"><span className="text-text-muted">Result</span><div className="text-white font-bold mt-1">{scan.qualified ? 'All criteria met' : 'Criteria not met'}</div></div><p className="sm:col-span-2 text-text-muted">{Object.entries(scan.qualifications).map(([name, passed]) => `${name.replaceAll('_', ' ')}: ${passed ? 'pass' : 'fail'}`).join(' · ')}. Historical screen only; not a recommendation.</p></div>}</section>
    <section className="card rounded-xl border border-border p-5"><h2 className="flex items-center gap-2 text-white font-bold"><ListChecks size={18} className="text-red-400" />Research watchlists</h2><p className="text-xs text-text-muted mt-2">Organize symbols and notes only. Watchlists do not include live prices, signals, or trade actions.</p><form onSubmit={createWatchlist} className="mt-4 flex gap-3"><input name="watchlistName" placeholder="e.g. Quality research" className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-white" /><button disabled={busy === 'watchlist'} className="rounded-lg border border-red-500/50 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busy === 'watchlist' ? 'Saving…' : 'Create'}</button></form>{watchlists.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{watchlists.map((watchlist) => <span key={watchlist.id} className="rounded-full border border-border px-3 py-1 text-xs text-text-secondary">{watchlist.name} · {watchlist.items.length} symbol(s)</span>)}</div>}</section>
    <section className="grid lg:grid-cols-2 gap-5">
      <article className="card rounded-xl border border-border p-5"><h2 className="flex items-center gap-2 text-white font-bold"><WalletCards size={18} className="text-red-400" />Paper portfolio</h2><p className="text-xs text-text-muted mt-2">Creates a separate ₹100,000 virtual portfolio with cost and risk controls. No broker order is sent.</p><button onClick={createPortfolio} disabled={busy === 'portfolio'} className="mt-4 rounded-lg border border-red-500/50 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busy === 'portfolio' ? 'Creating…' : 'Create simulated portfolio'}</button>{portfolio && <p className="mt-4 text-xs text-text-muted">Portfolio <b className="text-white">{portfolio.portfolio.name}</b> · Cash ₹{number(portfolio.portfolio.cash)} · Equity ₹{number(portfolio.portfolio.equity)}<br /><a className="inline-block mt-2 text-red-300 underline" href={`/api/lab/paper-portfolios/${portfolio.portfolio.id}/trades.csv`}>Export trade CSV</a></p>}</article>
      <article className="card rounded-xl border border-border p-5"><h2 className="flex items-center gap-2 text-white font-bold"><BrainCircuit size={18} className="text-red-400" />Evidence report</h2><p className="text-xs text-text-muted mt-2">Creates a source-linked report from verified Lab records. Optional AI narration is server-side and disabled by default.</p><button onClick={createReport} disabled={busy === 'report' || !portfolio} className="mt-4 rounded-lg border border-red-500/50 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busy === 'report' ? 'Preparing…' : 'Create evidence report'}</button>{report && <p className="mt-4 text-xs text-text-muted"><b className="text-white">Narration: </b>{report.ai_narration.message}<br /><b className="text-white">Sources: </b>{report.verified_evidence.source_records.length} verified record(s).<br /><button onClick={() => downloadJson('trademind-evidence-report.json', report)} className="mt-2 text-red-300 underline">Export JSON</button></p>}</article>
    </section>
    <section><div className="flex items-end justify-between gap-4 mb-3"><div><h2 className="text-xl font-extrabold text-white">Research roadmap</h2><p className="text-sm text-text-muted mt-1">Capabilities are available only when their source and evaluation boundaries exist.</p></div><span className="text-[10px] uppercase tracking-wider font-mono text-text-dim">Portfolio: {researchPortfolio.status}</span></div><div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">{(status?.capabilities || []).map((capability) => { const Icon = ICONS[capability.id] || FlaskConical; return <article key={capability.id} className="card rounded-xl border border-border p-4 min-h-40 flex flex-col"><Icon size={20} className="text-red-400 mb-4" /><h3 className="text-sm font-extrabold text-white">{capability.label}</h3><p className="text-xs text-text-muted mt-2 leading-relaxed flex-1">{capability.message}</p><span className="mt-4 text-[10px] uppercase font-mono font-bold tracking-wider text-text-dim border border-border rounded px-2 py-1 w-fit">{capability.status}</span></article> })}</div></section>
  </div>
}
