import { NavLink } from 'react-router-dom'
import { BookOpen, Target, Newspaper, TrendingUp, ShieldAlert, Award } from 'lucide-react'
import useStore from '../../store/useStore'

const NAV = [
  { name: 'Learn', path: '/learn', icon: BookOpen, desc: 'Training modules' },
  { name: 'Practice', path: '/practice', icon: Target, desc: 'Real scenarios' },
  { name: 'News', path: '/news', icon: Newspaper, desc: 'Live market feed' },
]

export default function Sidebar() {
  const totalXP = useStore(s => s.totalXP)
  const getLevel = useStore(s => s.getLevel)
  const portfolio = useStore(s => s.portfolio)
  const level = getLevel()

  return (
    <aside className="w-60 bg-surface border-r border-border flex flex-col shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-gradient flex items-center justify-center shadow-lg shadow-red-500/25 border border-red-400/30">
            <TrendingUp size={18} className="text-white" />
          </div>
          <div>
            <div className="font-extrabold text-sm tracking-wider text-white uppercase">Trade<span className="text-red-500">Mind</span></div>
            <div className="text-[10px] text-text-muted font-mono tracking-widest uppercase">Red·White·Black</div>
          </div>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 py-5 px-3 space-y-1.5">
        {NAV.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-red-500/15 text-white border border-red-500/40 shadow-sm shadow-red-500/10'
                  : 'text-text-muted hover:text-white hover:bg-white/5 border border-transparent'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={18} className={isActive ? 'text-red-500' : 'text-text-dim group-hover:text-white transition-colors'} />
                <div>
                  <div className={`text-sm font-bold ${isActive ? 'text-white' : 'text-text-secondary'}`}>{item.name}</div>
                  <div className="text-[10px] text-text-dim">{item.desc}</div>
                </div>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Stats Bottom */}
      <div className="p-3 border-t border-border space-y-3">
        {/* Level badge */}
        <div className="bg-void rounded-xl p-3.5 border border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Award size={15} className="text-red-500" />
              <span className="text-xs font-extrabold text-white uppercase tracking-wider">{level.name}</span>
            </div>
            <span className="text-xs font-mono text-red-400 font-bold">{totalXP} XP</span>
          </div>
          {level.next && (
            <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-red-gradient h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((totalXP / level.next) * 100, 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* Portfolio value */}
        <div className="bg-void rounded-xl p-3.5 border border-border">
          <div className="text-[10px] text-text-dim uppercase tracking-widest font-mono mb-1">Simulated Wallet</div>
          <div className="text-base font-extrabold font-mono text-white">₹{portfolio.totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          <div className={`text-xs font-mono mt-0.5 font-bold ${
            portfolio.pnl >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {portfolio.pnl >= 0 ? '+' : ''}₹{portfolio.pnl.toFixed(0)} ({portfolio.pnlPct.toFixed(1)}%)
          </div>
        </div>
      </div>
    </aside>
  )
}
