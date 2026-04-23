export default function StatCard({ title, value, delta, deltaLabel, icon: Icon }) {
  const isPositive = delta && delta >= 0
  const isNegative = delta && delta < 0

  return (
    <div className="gold-card rounded-xl p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between text-text-muted">
        <span className="text-sm font-medium">{title}</span>
        {Icon && <Icon size={18} className="text-gold/50" />}
      </div>
      <div className="text-3xl font-bold text-text-primary tracking-tight">
        {value}
      </div>
      {delta !== undefined && (
        <div className={`text-sm flex items-center gap-1.5 font-medium ${isPositive ? 'text-neon-green glow-text-green' : isNegative ? 'text-neon-red glow-text-red' : 'text-text-muted'}`}>
          {isPositive ? '▲' : isNegative ? '▼' : '—'} 
          {Math.abs(delta)}
          {deltaLabel && <span className="opacity-70 ml-1 font-normal">{deltaLabel}</span>}
        </div>
      )}
    </div>
  )
}
