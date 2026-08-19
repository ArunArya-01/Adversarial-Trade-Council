import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useStore = create(
  persist(
    (set, get) => ({
      // ── Market Preference ──────────────────────────────────
      marketFocus: 'both', // 'india' | 'global' | 'both'
      setMarketFocus: (focus) => set({ marketFocus: focus }),

      // ── Learning Progress ──────────────────────────────────
      completedLessons: [], // array of lesson IDs
      lessonScores: {},     // { lessonId: score }
      totalXP: 0,

      completeLesson: (lessonId, score) => set((state) => ({
        completedLessons: state.completedLessons.includes(lessonId)
          ? state.completedLessons
          : [...state.completedLessons, lessonId],
        lessonScores: { ...state.lessonScores, [lessonId]: score },
        totalXP: state.totalXP + (score >= 80 ? 100 : score >= 60 ? 60 : 30),
      })),

      // ── Virtual Portfolio (Practice Game) ─────────────────
      portfolio: {
        cash: 15000,          // Starting ₹15,000
        holdings: [],         // [{ symbol, name, qty, buyPrice, currentPrice }]
        totalValue: 15000,
        pnl: 0,
        pnlPct: 0,
        tradeHistory: [],
      },

      updatePortfolio: (data) => set((state) => ({
        portfolio: { ...state.portfolio, ...data }
      })),

      executeTrade: (trade) => set((state) => {
        const p = state.portfolio
        if (trade.action === 'BUY') {
          const cost = trade.qty * trade.price
          if (cost > p.cash) return state
          const existing = p.holdings.find(h => h.symbol === trade.symbol)
          const newHoldings = existing
            ? p.holdings.map(h => h.symbol === trade.symbol
                ? { ...h, qty: h.qty + trade.qty, buyPrice: (h.buyPrice * h.qty + cost) / (h.qty + trade.qty) }
                : h)
            : [...p.holdings, { symbol: trade.symbol, name: trade.name, qty: trade.qty, buyPrice: trade.price, currentPrice: trade.price }]
          const newCash = p.cash - cost
          const totalInvested = newHoldings.reduce((s, h) => s + h.qty * h.buyPrice, 0)
          return {
            portfolio: {
              ...p,
              cash: newCash,
              holdings: newHoldings,
              totalValue: newCash + totalInvested,
              tradeHistory: [{ ...trade, time: new Date().toISOString() }, ...p.tradeHistory].slice(0, 50),
            }
          }
        }
        if (trade.action === 'SELL') {
          const holding = p.holdings.find(h => h.symbol === trade.symbol)
          if (!holding || holding.qty < trade.qty) return state
          const proceeds = trade.qty * trade.price
          const newHoldings = holding.qty === trade.qty
            ? p.holdings.filter(h => h.symbol !== trade.symbol)
            : p.holdings.map(h => h.symbol === trade.symbol ? { ...h, qty: h.qty - trade.qty } : h)
          const newCash = p.cash + proceeds
          const totalInvested = newHoldings.reduce((s, h) => s + h.qty * h.buyPrice, 0)
          const totalValue = newCash + totalInvested
          return {
            portfolio: {
              ...p,
              cash: newCash,
              holdings: newHoldings,
              totalValue,
              pnl: totalValue - 15000,
              pnlPct: ((totalValue - 15000) / 15000) * 100,
              tradeHistory: [{ ...trade, time: new Date().toISOString() }, ...p.tradeHistory].slice(0, 50),
            }
          }
        }
        return state
      }),

      resetPortfolio: () => set({
        portfolio: { cash: 15000, holdings: [], totalValue: 15000, pnl: 0, pnlPct: 0, tradeHistory: [] }
      }),

      // ── Practice Scenarios ────────────────────────────────
      completedScenarios: [],
      scenarioScores: {},

      completeScenario: (scenarioId, score) => set((state) => ({
        completedScenarios: state.completedScenarios.includes(scenarioId)
          ? state.completedScenarios
          : [...state.completedScenarios, scenarioId],
        scenarioScores: { ...state.scenarioScores, [scenarioId]: score },
        totalXP: state.totalXP + (score >= 80 ? 150 : score >= 60 ? 80 : 40),
        portfolio: {
          ...state.portfolio,
          cash: state.portfolio.cash + (score >= 80 ? 2000 : score >= 60 ? 1000 : 500),
          totalValue: state.portfolio.totalValue + (score >= 80 ? 2000 : score >= 60 ? 1000 : 500),
        }
      })),

      // ── Computed Level ────────────────────────────────────
      getLevel: () => {
        const xp = get().totalXP
        if (xp < 300) return { name: 'Novice', next: 300, color: 'text-gray-400' }
        if (xp < 800) return { name: 'Apprentice', next: 800, color: 'text-blue-400' }
        if (xp < 1800) return { name: 'Trader', next: 1800, color: 'text-green-400' }
        if (xp < 4000) return { name: 'Analyst', next: 4000, color: 'text-purple-400' }
        return { name: 'Expert', next: null, color: 'text-yellow-400' }
      },
    }),
    {
      name: 'trademind-storage',
      partialize: (state) => ({
        completedLessons: state.completedLessons,
        lessonScores: state.lessonScores,
        totalXP: state.totalXP,
        portfolio: state.portfolio,
        completedScenarios: state.completedScenarios,
        scenarioScores: state.scenarioScores,
        marketFocus: state.marketFocus,
      }),
    }
  )
)

export default useStore
