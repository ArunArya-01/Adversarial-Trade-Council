export default function Badge({ children, sentiment, className = '' }) {
  let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700'
  
  if (sentiment === 'BULLISH') {
    colorClasses = 'bg-teal-950/50 text-neon-green border-teal-900 glow-border-green'
  } else if (sentiment === 'BEARISH') {
    colorClasses = 'bg-rose-950/50 text-neon-red border-rose-900'
  } else if (sentiment === 'NEUTRAL') {
    colorClasses = 'bg-slate-800/50 text-slate-400 border-slate-700'
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${colorClasses} ${className}`}>
      {children}
    </span>
  )
}
