import { useCallback } from 'react'
import useStore from '../store/useStore'

const API_BASE = '/api' // Proxied via Vite

export default function useApi() {
  const setWalletData = useStore((state) => state.setWalletData)
  const setLessonsData = useStore((state) => state.setLessonsData)
  const setNewsData = useStore((state) => state.setNewsData)

  const fetchWalletBalance = useCallback(async (userId = 1) => {
    try {
      const res = await fetch(`${API_BASE}/wallet/balance?user_id=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setWalletData({
          cash: data.cash_balance,
          positions: data.positions,
          totalEquity: data.total_equity,
          totalInvested: data.total_invested,
          pnl: data.total_unrealised_pnl,
          pnlPct: data.total_unrealised_pnl_pct
        })
      }
    } catch (e) {
      console.error("Failed to fetch wallet balance", e)
    }
  }, [setWalletData])

  const fetchLessons = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/lessons`)
      if (res.ok) {
        const data = await res.json()
        setLessonsData({ list: data })
      }
    } catch (e) {
      console.error("Failed to fetch lessons", e)
    }
  }, [setLessonsData])

  const fetchNews = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/news`)
      if (res.ok) {
        const data = await res.json()
        setNewsData({ items: data })
      }
    } catch (e) {
      console.error("Failed to fetch news", e)
    }
  }, [setNewsData])

  const executeTrade = useCallback(async (action, symbol, qty, price, context) => {
    try {
      const endpoint = action === 'BUY' ? '/wallet/buy' : '/wallet/sell'
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 1, symbol, qty, price, market_context: context })
      })
      const data = await res.json()
      if (res.ok) {
        fetchWalletBalance(1)
        return { success: true, data }
      }
      return { success: false, error: data.detail }
    } catch (e) {
      console.error(`Failed to execute ${action}`, e)
      return { success: false, error: e.message }
    }
  }, [fetchWalletBalance])

  return { fetchWalletBalance, fetchLessons, fetchNews, executeTrade }
}
