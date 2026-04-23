import { NavLink } from 'react-router-dom'
import { LayoutDashboard, GraduationCap, Crosshair, Newspaper, ShieldAlert } from 'lucide-react'

export default function Sidebar() {
  const navItems = [
    { name: 'The Hub', path: '/hub', icon: LayoutDashboard },
    { name: 'Academy', path: '/academy', icon: GraduationCap },
    { name: 'War Room', path: '/war-room', icon: Crosshair },
    { name: 'News Desk', path: '/news', icon: Newspaper },
  ]

  return (
    <aside className="w-56 border-r border-border bg-surface flex flex-col shrink-0">
      <div className="p-4 py-6 text-xs font-mono text-text-dim uppercase tracking-widest border-b border-border">
        Navigation
      </div>
      
      <nav className="flex-1 py-4 flex flex-col gap-1 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-all duration-200
               ${isActive 
                 ? 'bg-gold-wash text-gold border border-gold/20 glow-border-gold shadow-gold-sm' 
                 : 'text-text-muted hover:text-text-primary hover:bg-white/5 border border-transparent'}`
            }
          >
            <item.icon size={18} />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-border mt-auto">
        <div className="flex items-center gap-3 p-3 bg-void rounded-xl border border-border">
          <div className="relative">
            <ShieldAlert size={28} className="text-gold" />
          </div>
          <div>
            <div className="text-xs text-text-dim uppercase tracking-wider font-mono">TMR Stack</div>
            <div className="text-sm font-semibold text-gold glow-text-gold">ACTIVE</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
