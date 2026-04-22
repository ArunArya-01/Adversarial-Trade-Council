import useStore from '../../store/useStore'

export default function TickerStrip() {
  const currentPrice = useStore((state) => state.market.currentPrice)
  const previousPrice = useStore((state) => state.market.previousPrice)

  const isUp = currentPrice >= previousPrice
  const colorClass = isUp ? 'text-neon-green' : 'text-neon-red'
  
  const displayPrice = currentPrice ? currentPrice.toFixed(2) : '---'

  return (
    <div className="flex-1 overflow-hidden relative mx-6 h-full flex items-center border-l border-r border-border/50">
      <div className="whitespace-nowrap animate-marquee flex gap-12 text-sm font-mono tracking-wider font-semibold">
        {/* Repeat enough times to fill the screen for the marquee effect */}
        {[...Array(10)].map((_, i) => (
          <span key={i} className="flex gap-2 items-center">
            <span className="text-text-muted">AAPL</span>
            <span className={colorClass}>{isUp ? '▲' : '▼'}</span>
            <span className={colorClass}>${displayPrice}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
