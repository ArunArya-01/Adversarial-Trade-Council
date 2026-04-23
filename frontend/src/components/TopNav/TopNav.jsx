import { Hexagon, Activity } from 'lucide-react'
import TickerStrip from './TickerStrip'
import useStore from '../../store/useStore'

export default function TopNav() {
  const wsStatus = useStore((state) => state.market.wsStatus)

  return (
    <header className="h-14 border-b border-border bg-surface flex items-center justify-between px-4 shrink-0 z-10">
      <div className="flex items-center gap-2 w-56">
        <Hexagon className="text-gold glow-text-gold" size={24} />
        <span className="font-bold tracking-widest uppercase text-sm">TradeMind<span className="text-text-dim">_AI</span></span>
      </div>

      <TickerStrip />

      <div className="flex items-center gap-4 text-xs font-mono font-medium text-text-muted">
        <div className="hidden md:flex gap-3">
          <span><kbd className="bg-void border border-border rounded px-1.5 py-0.5 text-text-primary">1</kbd> Hub</span>
          <span><kbd className="bg-void border border-border rounded px-1.5 py-0.5 text-text-primary">2</kbd> Acdmy</span>
          <span><kbd className="bg-void border border-border rounded px-1.5 py-0.5 text-text-primary">3</kbd> W-Room</span>
          <span><kbd className="bg-void border border-border rounded px-1.5 py-0.5 text-text-primary">4</kbd> News</span>
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          <div className="relative flex h-2 w-2">
            {wsStatus === 'connected' && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${wsStatus === 'connected' ? 'bg-gold' : wsStatus === 'connecting' ? 'bg-gold-dim' : 'bg-neon-red'}`}></span>
          </div>
          <Activity size={16} />
        </div>
      </div>
    </header>
  )
}
