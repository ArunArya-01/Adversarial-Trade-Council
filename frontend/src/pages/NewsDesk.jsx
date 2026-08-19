import { useEffect, useState } from 'react'
import { Newspaper, Lightbulb, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import useStore from '../store/useStore'
import useApi from '../hooks/useApi'
import { motion } from 'framer-motion'

const FALLBACK_NEWS = [
  {
    id: 1, source: 'Reuters', category: 'Earnings', sentiment: 'bullish',
    headline: 'Apple reports record Q4 revenue, beating analyst expectations',
    simplified: 'Apple made more money than experts predicted this quarter. Their iPhone and services division both hit new records, suggesting strong consumer demand heading into the holiday season.',
    beginner_tip: 'When a company beats expectations, it means Wall Street analysts predicted one number, but the company did better. This usually causes the stock price to go up.',
  },
  {
    id: 2, source: 'Bloomberg', category: 'Fed Policy', sentiment: 'bearish',
    headline: 'Federal Reserve signals rates to stay higher for longer amid sticky inflation',
    simplified: 'The Federal Reserve is keeping interest rates high because inflation is still too elevated. High rates make borrowing expensive, which can slow economic growth and pressure stock valuations.',
    beginner_tip: 'Interest rates and stock prices often move in opposite directions. When rates rise, future company profits are worth less today — which is why tech stocks often drop when the Fed raises rates.',
  },
  {
    id: 3, source: 'CNBC', category: 'Macro', sentiment: 'neutral',
    headline: 'US jobs report shows resilient labour market with 187,000 new positions added',
    simplified: 'The US economy added 187,000 jobs last month, close to what analysts expected. A strong job market means more people have income to spend, which can help company revenues.',
    beginner_tip: 'The monthly jobs report is one of the most important economic indicators. A Goldilocks number (not too hot, not too cold) is often the best outcome for stocks.',
  },
]

const sentimentConfig = {
  bullish: { label: 'BULLISH', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', Icon: TrendingUp },
  bearish: { label: 'BEARISH', color: 'text-red-400',   bg: 'bg-red-500/10',   border: 'border-red-500/30',   Icon: TrendingDown },
  neutral: { label: 'NEUTRAL', color: 'text-blue-400',  bg: 'bg-blue-500/10',  border: 'border-blue-500/30',  Icon: Minus },
}

export default function NewsDesk() {
  const { fetchNews } = useApi()
  const apiNews = useStore((state) => state.news.items)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNews().finally(() => setLoading(false))
  }, [fetchNews])

  const news = apiNews.length > 0 ? apiNews : (loading ? [] : FALLBACK_NEWS)
  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.12 } } }
  const itemAnim  = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <Newspaper className="text-gold glow-text-gold" size={28} />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">News Desk</h1>
          <p className="text-sm text-text-muted font-mono tracking-wide uppercase mt-0.5">
            Market Intelligence — AI Translation Active
            {apiNews.length === 0 && !loading && <span className="ml-2 text-blue-400/60">(demo data)</span>}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="gold-card rounded-xl p-6 animate-pulse space-y-3">
              <div className="flex gap-3"><div className="h-5 bg-border rounded w-20"></div><div className="h-5 bg-border rounded w-16"></div></div>
              <div className="h-4 bg-border rounded w-3/4"></div>
              <div className="h-16 bg-border rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <motion.div className="space-y-4" variants={container} initial="hidden" animate="show">
          {news.map((item) => {
            const s = sentimentConfig[item.sentiment?.toLowerCase()] || sentimentConfig.neutral
            const { Icon } = s
            return (
              <motion.div key={item.id} variants={itemAnim} className="gold-card rounded-xl p-6 space-y-4 hover:border-gold/30 transition-all duration-300 hover:shadow-gold-sm">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs uppercase tracking-wider text-text-muted bg-void px-2 py-1 rounded border border-border">{item.source}</span>
                    <span className="text-xs font-semibold text-text-dim px-2 py-0.5 rounded border border-border">{item.category}</span>
                  </div>
                  <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded border ${s.color} ${s.bg} ${s.border}`}>
                    <Icon size={12} />{s.label}
                  </span>
                </div>
                <p className="text-sm font-mono text-text-muted border-l-2 border-gold/40 pl-3 italic">&quot;{item.headline}&quot;</p>
                <p className="text-base text-text-primary leading-relaxed">{item.simplified}</p>
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4 flex gap-3 text-sm">
                  <Lightbulb className="text-gold shrink-0 mt-0.5 glow-text-gold" size={18} />
                  <div>
                    <span className="font-bold text-gold block mb-1">Beginner Tip</span>
                    <p className="text-text-muted leading-relaxed">{item.beginner_tip}</p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
