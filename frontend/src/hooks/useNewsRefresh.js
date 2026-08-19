import { useState, useEffect, useCallback, useRef } from 'react'

const REFRESH_INTERVAL = 5 * 60 * 1000 // 5 minutes

export default function useNewsRefresh(fetchFn, category = 'all') {
  const [news, setNews] = useState([])
  const [lastUpdated, setLastUpdated] = useState(null)
  const [loading, setLoading] = useState(true)
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL / 1000)
  const timerRef = useRef(null)
  const countdownRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await fetchFn(category)
    if (data?.items) {
      setNews(data.items)
      setLastUpdated(new Date())
    }
    setLoading(false)
    setCountdown(REFRESH_INTERVAL / 1000)
  }, [fetchFn, category])

  useEffect(() => {
    load()
    timerRef.current = setInterval(load, REFRESH_INTERVAL)
    countdownRef.current = setInterval(() => {
      setCountdown(prev => (prev <= 1 ? REFRESH_INTERVAL / 1000 : prev - 1))
    }, 1000)
    return () => {
      clearInterval(timerRef.current)
      clearInterval(countdownRef.current)
    }
  }, [load])

  return { news, lastUpdated, loading, countdown, refresh: load }
}
