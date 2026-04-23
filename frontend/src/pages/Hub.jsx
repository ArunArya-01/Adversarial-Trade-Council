import { useEffect } from 'react'
import { Wallet, GraduationCap, TrendingUp } from 'lucide-react'
import StatCard from '../components/ui/StatCard'
import ProgressBar from '../components/ui/ProgressBar'
import CandleVisualizer from '../components/3d/CandleVisualizer'
import useStore from '../store/useStore'
import useApi from '../hooks/useApi'

export default function Hub() {
  const { fetchWalletBalance, fetchLessons } = useApi()
  const wallet = useStore((state) => state.wallet)
  const currentPrice = useStore((state) => state.market.currentPrice)
  const lessons = useStore((state) => state.lessons.list)

  useEffect(() => {
    fetchWalletBalance()
    fetchLessons()
  }, [fetchWalletBalance, fetchLessons])

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">The Hub</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Portfolio Widget */}
        <StatCard 
          title="Total Equity" 
          value={`$${wallet.totalEquity.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
          delta={wallet.pnl}
          deltaLabel="Overall Return"
          icon={Wallet}
        />

        {/* Academy Widget */}
        <div className="gold-card rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-sm font-medium">Academy Progress</span>
            <GraduationCap size={18} className="text-gold/50" />
          </div>
          <div>
            <div className="text-lg font-semibold mb-1">Module 1: Fundamentals</div>
            <div className="text-sm text-text-muted mb-3">{lessons.length > 0 ? lessons[0].title : 'Loading...'}</div>
            <ProgressBar progress={15} />
          </div>
        </div>

        {/* Market Sentiment Widget */}
        <div className="gold-card rounded-xl p-5 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-5 left-5 right-5 flex justify-between z-10 text-sm">
            <span className="text-text-muted font-medium flex items-center gap-2"><TrendingUp size={16}/> Market Sentiment</span>
          </div>
          <div className="absolute top-5 right-5 z-10 text-lg font-mono font-bold text-gold glow-text-gold">
            AAPL
          </div>
          <CandleVisualizer isGreen={true} />
        </div>
      </div>

      <h2 className="text-lg font-semibold mt-8 mb-4">Recent Transmissions</h2>
      <div className="gold-card rounded-xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-void text-text-dim font-mono uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3">Time</th>
              <th className="px-6 py-3">Action</th>
              <th className="px-6 py-3">Symbol</th>
              <th className="px-6 py-3">Value</th>
              <th className="px-6 py-3">AI Grade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {/* Hardcoded placeholder for now since we don't have trade history API connected yet */}
            <tr className="hover:bg-gold-wash transition-colors">
              <td className="px-6 py-4 font-mono text-text-muted">10:45 AM</td>
              <td className="px-6 py-4 font-bold text-neon-green glow-text-green">BUY</td>
              <td className="px-6 py-4 font-mono">AAPL</td>
              <td className="px-6 py-4">$18,500.00</td>
              <td className="px-6 py-4">
                <span className="bg-neon-green/20 text-neon-green px-2 py-1 rounded inline-flex font-bold justify-center items-center h-6 w-6">A</span>
              </td>
            </tr>
             <tr className="hover:bg-gold-wash transition-colors">
              <td className="px-6 py-4 font-mono text-text-muted">09:12 AM</td>
              <td className="px-6 py-4 font-bold text-neon-red glow-text-red">SELL</td>
              <td className="px-6 py-4 font-mono">NVDA</td>
              <td className="px-6 py-4">$42,100.00</td>
              <td className="px-6 py-4">
                 <span className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded inline-flex font-bold justify-center items-center h-6 w-6">C</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
