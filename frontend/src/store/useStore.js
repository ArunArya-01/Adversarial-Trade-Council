import { create } from 'zustand'

const useStore = create((set, get) => ({
  // ── Wallet State ─────────────────────────────────────────
  wallet: {
    cash: 100000,
    positions: [],
    totalEquity: 100000,
    totalInvested: 0,
    pnl: 0,
    pnlPct: 0,
    history: []
  },

  setWalletData: (data) => set((state) => ({
    wallet: { ...state.wallet, ...data }
  })),

  // ── Lessons State ─────────────────────────────────────────
  lessons: {
    list: [],
    progress: [],
    currentLessonId: null,
  },

  setLessonsData: (data) => set((state) => ({
    lessons: { ...state.lessons, ...data }
  })),

  // ── Market Data (Websocket) ──────────────────────────────
  market: {
    candles: [],
    currentPrice: null,
    previousPrice: null,
    replaySpeed: 1, // 0.25, 0.5, 1, 2, 4
    wsStatus: 'disconnected' // connecting, connected, disconnected
  },

  setMarketData: (data) => set((state) => ({
    market: { ...state.market, ...data }
  })),

  // Replace the entire candle array — used when a fresh SNAPSHOT arrives (e.g. on reconnect).
  // This prevents duplicate / out-of-order timestamps that crash lightweight-charts v5.
  setCandles: (newCandles) => set((state) => {
    const candles = Array.isArray(newCandles) ? newCandles : [newCandles]
    const sorted = [...candles].sort((a, b) => {
      const ta = a.date ? new Date(a.date).getTime() : (a.time ?? 0)
      const tb = b.date ? new Date(b.date).getTime() : (b.time ?? 0)
      return ta - tb
    })
    const latestPrice = sorted.length > 0 ? sorted[sorted.length - 1].close : state.market.currentPrice
    return {
      market: {
        ...state.market,
        candles: sorted.slice(-200),
        previousPrice: state.market.currentPrice,
        currentPrice: latestPrice,
      }
    }
  }),

  // Append a single live candle tick — used for streaming CANDLE events.
  addCandles: (newCandles) => set((state) => {
    const candles = Array.isArray(newCandles) ? newCandles : [newCandles];
    const latestPrice = candles.length > 0 ? candles[candles.length - 1].close : state.market.currentPrice;
    
    return {
      market: {
        ...state.market,
        candles: [...state.market.candles, ...candles].slice(-200), // Keep last 200
        previousPrice: state.market.currentPrice,
        currentPrice: latestPrice
      }
    }
  }),
  
  setReplaySpeed: (speed) => set((state) => ({
    market: { ...state.market, replaySpeed: speed }
  })),

  // ── News State ────────────────────────────────────────────
  news: {
    items: [],
  },

  setNewsData: (data) => set((state) => ({
    news: { ...state.news, ...data }
  })),

  // ── Scenario State (Lock & Key) ───────────────────────────
  // When Academy sets a scenario, War Room reads it to load
  // the appropriate historical context and challenge.
  currentScenario: null,

  setCurrentScenario: (scenario) => set({ currentScenario: scenario }),
  clearScenario: () => set({ currentScenario: null }),
}))

export default useStore
