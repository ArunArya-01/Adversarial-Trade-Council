import useStore from '../../store/useStore'

export default function TopNav() {
  const marketFocus = useStore(s => s.marketFocus)
  const setMarketFocus = useStore(s => s.setMarketFocus)

  return (
    <header className="h-14 border-b border-border bg-surface flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-2 text-xs font-mono text-text-muted">
        <span className="text-text-dim font-bold uppercase tracking-wider text-[11px]">Market Filter:</span>
        {['india', 'global', 'both'].map(m => (
          <button
            key={m}
            onClick={() => setMarketFocus(m)}
            className={`px-3 py-1.5 rounded-lg uppercase tracking-wider text-[11px] font-bold transition-all ${
              marketFocus === m
                ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                : 'text-text-muted border border-border hover:border-red-500/40 hover:text-white'
            }`}
          >
            {m === 'india' ? '🇮🇳 India' : m === 'global' ? '🌐 Global' : '🌍 Both'}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 text-xs font-mono text-text-dim">
        <span className="inline-flex items-center gap-1.5 bg-void border border-border rounded-lg px-2.5 py-1 text-white text-[11px]">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span className="font-bold text-red-400">TRADEMIND_PRO</span>
        </span>
      </div>
    </header>
  )
}
