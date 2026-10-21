import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const INITIAL_PORTFOLIO = {
  startingCapital: 0,
  cash: 0,
  positions: [],
  tradeHistory: [],
  status: 'not-configured',
}

// This state intentionally does not share the Academy game wallet. It is a
// placeholder for the auditable paper portfolio introduced in Phase 6.
const useLabStore = create(
  persist(
    (set) => ({
      watchlistIds: [],
      researchPortfolio: INITIAL_PORTFOLIO,
      setWatchlistIds: (watchlistIds) => set({ watchlistIds }),
      resetResearchPortfolio: () => set({ researchPortfolio: INITIAL_PORTFOLIO }),
    }),
    { name: 'trademind-lab-storage' }
  )
)

export default useLabStore
