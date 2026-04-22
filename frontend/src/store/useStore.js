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
  }))
}))

export default useStore
