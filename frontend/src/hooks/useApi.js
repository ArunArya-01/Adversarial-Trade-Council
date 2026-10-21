import { useCallback } from 'react'

const ACADEMY_API = '/api/academy'

export default function useApi() {
  const fetchChapters = useCallback(async () => {
    try {
      const res = await fetch(`${ACADEMY_API}/chapters`)
      if (res.ok) return await res.json()
    } catch (e) { console.error('fetchChapters error', e) }
    return []
  }, [])

  const fetchChapter = useCallback(async (chapterId) => {
    try {
      const res = await fetch(`${ACADEMY_API}/chapters/${chapterId}`)
      if (res.ok) return await res.json()
    } catch (e) { console.error('fetchLesson error', e) }
    return null
  }, [])

  const submitQuiz = useCallback(async (chapterId, answers) => {
    try {
      const res = await fetch(`${ACADEMY_API}/quizzes/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapter_id: chapterId, answers })
      })
      if (res.ok) return await res.json()
    } catch (e) { console.error('submitQuiz error', e) }
    return null
  }, [])

  const fetchPracticeCandles = useCallback(async (symbol, timeframe = '1D') => {
    try {
      const params = new URLSearchParams({ symbol, timeframe })
      const res = await fetch(`${ACADEMY_API}/practice/candles?${params}`)
      if (res.ok) return await res.json()
    } catch (e) { console.error('fetchPracticeCandles error', e) }
    return []
  }, [])

  const fetchNews = useCallback(async (category = 'all') => {
    try {
      const res = await fetch(`${ACADEMY_API}/news?category=${category}`)
      if (res.ok) return await res.json()
    } catch (e) { console.error('fetchNews error', e) }
    return { items: [], last_updated: null }
  }, [])

  return { fetchChapters, fetchChapter, submitQuiz, fetchPracticeCandles, fetchNews }
}
