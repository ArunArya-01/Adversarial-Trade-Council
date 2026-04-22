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
      <div className="p-4 py-6 text-xs font-mono text-text-muted uppercase tracking-widest border-b border-border/50">
        Navigation
      </div>
      
      <nav className="flex-1 py-4 flex flex-col gap-1 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors duration-200
               ${isActive 
                 ? 'bg-void text-neon-green box-shadow-glow border border-neon-green/20 glow-text-green' 
                 : 'text-text-muted hover:text-text-primary hover:bg-white/5'}`
            }
          >
            <item.icon size={18} />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-border mt-auto">
        <div className="flex items-center gap-3 p-3 bg-void rounded-xl border border-border/50">
          <div className="relative">
            <ShieldAlert size={28} className="text-neon-cyan" />
          </div>
          <div>
            <div className="text-xs text-text-muted uppercase tracking-wider font-mono">TMR Stack</div>
            <div className="text-sm font-semibold text-text-primary">ACTIVE</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
