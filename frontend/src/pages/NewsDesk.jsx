import { useEffect } from 'react'
import { Newspaper, Lightbulb } from 'lucide-react'
import useStore from '../store/useStore'
import useApi from '../hooks/useApi'
import Badge from '../components/ui/Badge'
import { motion } from 'framer-motion'

export default function NewsDesk() {
  const { fetchNews } = useApi()
  const news = useStore((state) => state.news.items)

  useEffect(() => {
    fetchNews()
  }, [fetchNews])

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemAnim = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <Newspaper className="text-gold" size={28} />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">News Desk</h1>
          <p className="text-sm text-text-muted font-mono tracking-wide uppercase">📡 Market Intelligence — AI Translation Active</p>
        </div>
      </div>

      {news.length === 0 ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-surface border border-border rounded-xl p-6 h-40" />
          ))}
        </div>
      ) : (
        <motion.div 
          className="space-y-4"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {news.map((item) => (
            <motion.div key={item.id} variants={itemAnim} className="gold-card rounded-xl p-6 space-y-4 hover:border-gold/20 transition-all duration-300 hover:shadow-gold-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs uppercase tracking-wider text-text-muted bg-void px-2 py-1 rounded border border-border">
                    {item.source}
                  </span>
                  <span className="text-xs font-semibold text-text-dim px-2 py-0.5 rounded border border-border">
                    {item.category}
                  </span>
                </div>
                <Badge sentiment={item.sentiment}>{item.sentiment}</Badge>
              </div>

              <div>
                <p className="text-sm font-mono text-text-muted mb-2 border-l-2 border-gold/30 pl-3">
                  "{item.headline}"
                </p>
                <p className="text-lg text-text-primary leading-relaxed">
                  {item.simplified}
                </p>
              </div>

              <div className="bg-gold-wash border border-gold/20 rounded-lg p-4 flex gap-3 text-sm">
                <Lightbulb className="text-gold shrink-0 mt-0.5" size={18} />
                <div>
                  <span className="font-bold text-gold block mb-1">Beginner Tip</span>
                  <p className="text-text-muted">{item.beginner_tip}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
