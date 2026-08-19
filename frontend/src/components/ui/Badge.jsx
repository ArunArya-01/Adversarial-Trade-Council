export default function Badge({ type = 'neutral', children }) {
  const styles = {
    bullish: 'bg-green-500/10 text-green-400 border-green-500/30',
    bearish: 'bg-red-500/15 text-red-400 border-red-500/40',
    neutral: 'bg-white/10 text-white border-white/20',
    warning: 'bg-red-500/20 text-red-300 border-red-500/50',
    info:    'bg-white/10 text-text-secondary border-border',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border font-mono ${styles[type] || styles.neutral}`}>
      {children}
    </span>
  )
}
