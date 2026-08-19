import { useState } from 'react'
import { Newspaper, RefreshCw, TrendingUp, TrendingDown, Minus, Clock, ExternalLink } from 'lucide-react'
import { motion } from 'framer-motion'
import useApi from '../hooks/useApi'
import useNewsRefresh from '../hooks/useNewsRefresh'

const CATEGORIES = [
  { key: 'all', label: 'All Feeds' },
  { key: 'stocks', label: 'Stocks & Equities' },
  { key: 'ipo', label: 'IPOs & Listings' },
  { key: 'mutual_funds', label: 'Mutual Funds & SIP' },
  { key: 'economy', label: 'Economy & Central Banks' },
  { key: 'global', label: 'Global Markets' },
]

const SENTIMENT = {
  bullish:  { label: 'BULLISH',  color: 'text-white',     bg: 'bg-white/10',     border: 'border-white/30',   Icon: TrendingUp },
  bearish:  { label: 'BEARISH',  color: 'text-red-400',   bg: 'bg-red-500/20',   border: 'border-red-500/40', Icon: TrendingDown },
  neutral:  { label: 'NEUTRAL',  color: 'text-text-muted', bg: 'bg-surface',     border: 'border-border',     Icon: Minus },
}

const FALLBACK_NEWS = [
  { id: 1, title: 'Nifty 50 sustains 24,600 level as domestic and FII inflows surge', source: 'Economic Times', category: 'stocks', sentiment: 'bullish', summary: 'Indian benchmark indices recorded broad-based buying in banking and auto stocks as foreign portfolio investors turned net buyers.', published: '3 minutes ago', url: 'https://economictimes.indiatimes.com' },
  { id: 2, title: 'RBI MPC Meeting: Repo rate held steady at 6.50% to balance growth & core inflation', source: 'Moneycontrol', category: 'economy', sentiment: 'neutral', summary: 'Governor highlighted resilient GDP projections of 7.2% for the fiscal year while cautioning against global supply-chain shocks.', published: '18 minutes ago', url: 'https://moneycontrol.com' },
  { id: 3, title: 'Major Fintech IPO receives 78x subscription with record retail participation', source: 'NDTV Profit', category: 'ipo', sentiment: 'bullish', summary: 'Anchor investors included top global sovereign wealth funds; Grey Market Premium (GMP) indicates strong listing gains.', published: '45 minutes ago', url: 'https://ndtvprofit.com' },
  { id: 4, title: 'Federal Reserve confirms rate cut trajectory as US inflation cools towards 2% target', source: 'Reuters', category: 'global', sentiment: 'bullish', summary: 'Global equities and emerging market currencies rallied following Powell comments signalling looser monetary conditions.', published: '1 hour ago', url: 'https://reuters.com' },
  { id: 5, title: 'SEBI mandates strict risk disclosures for retail derivatives trading', source: 'Business Standard', category: 'stocks', sentiment: 'neutral', summary: 'Market regulator enforces standardized index derivative contracts to curb excessive speculative options turnover.', published: '2 hours ago', url: 'https://business-standard.com' },
  { id: 6, title: 'Mutual Fund SIP inflows hit record high of ₹23,500 crore in single month', source: 'ValueResearch', category: 'mutual_funds', sentiment: 'bullish', summary: 'Retail discipline drives massive compounding in passive index and flexi-cap schemes despite market volatility.', published: '3 hours ago', url: 'https://valueresearchonline.com' },
  { id: 7, title: 'Crude Oil surges 3% amid geopolitical tensions in the Middle East', source: 'Bloomberg', category: 'global', sentiment: 'bearish', summary: 'Higher Brent crude prices raise input costs for airlines, paints, and tire manufacturers while boosting upstream energy firms.', published: '4 hours ago', url: 'https://bloomberg.com' },
]

function formatCountdown(secs) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function News() {
  const [activeCategory, setActiveCategory] = useState('all')
  const { fetchNews } = useApi()
  const { news: liveNews, lastUpdated, loading, countdown, refresh } = useNewsRefresh(fetchNews, activeCategory)

  const news = liveNews.length > 0 ? liveNews : (loading ? [] : FALLBACK_NEWS)
  const filtered = activeCategory === 'all' ? news : news.filter(n => n.category === activeCategory)

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-3 text-white">
            <Newspaper className="text-red-500" size={26} /> Financial News Terminal
          </h1>
          <p className="text-sm text-text-muted mt-1">Live auto-updating market intelligence across Equities, IPOs, Mutual Funds, and Macro.</p>
        </div>

        {/* Live Status & Auto Refresh */}
        <div className="shrink-0 text-right bg-surface border border-border p-3 rounded-xl">
          <div className="flex items-center gap-2 justify-end mb-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="text-xs text-red-400 font-mono font-bold">5-MIN SYNC ACTIVE</span>
            <button onClick={refresh} disabled={loading} className="p-1 rounded hover:bg-border transition-colors disabled:opacity-50">
              <RefreshCw size={13} className={`text-text-muted ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="text-xs text-text-muted font-mono">
            Next sync in: <span className="text-white font-bold font-mono">{formatCountdown(countdown)}</span>
          </div>
          {lastUpdated && (
            <div className="text-[10px] text-text-dim mt-0.5 font-mono">
              Synced: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider font-mono transition-all duration-150 ${
              activeCategory === cat.key
                ? 'bg-red-500 text-white shadow-md shadow-red-500/25 border border-red-400/40'
                : 'text-text-muted border border-border hover:border-red-500/40 hover:text-white'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* News Feed */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="card rounded-xl p-5 animate-pulse space-y-3 border border-border">
              <div className="flex gap-2"><div className="h-4 bg-border rounded w-24" /><div className="h-4 bg-border rounded w-16" /></div>
              <div className="h-5 bg-border rounded w-4/5" />
              <div className="h-12 bg-border rounded" />
            </div>
          ))}
        </div>
      ) : (
        <motion.div
          className="space-y-4"
          key={activeCategory}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-text-dim card rounded-xl p-8">
              <Newspaper size={40} className="mx-auto mb-3 opacity-30" />
              <p>No headlines in this category currently.</p>
            </div>
          ) : (
            filtered.map((item, idx) => {
              const s = SENTIMENT[item.sentiment?.toLowerCase()] || SENTIMENT.neutral
              const { Icon } = s
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="card rounded-xl p-5 hover:border-red-500/40 transition-all duration-200 group border border-border hover:shadow-lg hover:shadow-red-500/10"
                >
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted bg-void border border-border rounded px-2 py-0.5 font-bold">
                        {item.source}
                      </span>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-text-dim border border-border rounded px-2 py-0.5 font-semibold">
                        {CATEGORIES.find(c => c.key === item.category)?.label || item.category}
                      </span>
                    </div>
                    <span className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded border font-mono ${s.color} ${s.bg} ${s.border}`}>
                      <Icon size={10} />{s.label}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-white group-hover:text-red-400 transition-colors mb-2 leading-snug">
                    {item.title || item.headline}
                  </h3>

                  {(item.summary || item.simplified) && (
                    <p className="text-sm text-text-secondary leading-relaxed mb-3">
                      {item.summary || item.simplified}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[10px] font-mono text-text-muted">
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> {item.published || item.published_at || 'Recently updated'}
                    </span>
                    {item.url && item.url !== '#' && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-red-400 hover:underline font-bold">
                        Original Report <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </motion.div>
              )
            })
          )}
        </motion.div>
      )}
    </div>
  )
}
