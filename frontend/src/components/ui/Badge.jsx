export default function Badge({ children, sentiment, className = '' }) {
  let colorClasses = 'bg-zinc-900 text-zinc-400 border-zinc-800'
  
  if (sentiment === 'BULLISH') {
    colorClasses = 'bg-emerald-950/50 text-neon-green border-emerald-900 glow-border-green'
  } else if (sentiment === 'BEARISH') {
    colorClasses = 'bg-red-950/50 text-neon-red border-red-900'
  } else if (sentiment === 'NEUTRAL') {
    colorClasses = 'bg-zinc-900/50 text-zinc-400 border-zinc-800'
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${colorClasses} ${className}`}>
      {children}
    </span>
  )
}
