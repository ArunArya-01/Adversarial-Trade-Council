import { useCallback } from 'react'

const API = '/api'

export default function useApi() {
  const fetchModules = useCallback(async (market = 'both') => {
    try {
      const res = await fetch(`${API}/learn/modules?market=${market}`)
      if (res.ok) return await res.json()
    } catch (e) { console.error('fetchModules error', e) }
    return []
  }, [])

  const fetchLesson = useCallback(async (lessonId) => {
    try {
      const res = await fetch(`${API}/learn/lessons/${lessonId}`)
      if (res.ok) return await res.json()
    } catch (e) { console.error('fetchLesson error', e) }
    return null
  }, [])

  const submitQuiz = useCallback(async (lessonId, answers) => {
    try {
      const res = await fetch(`${API}/learn/quiz/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson_id: lessonId, answers })
      })
      if (res.ok) return await res.json()
    } catch (e) { console.error('submitQuiz error', e) }
    return null
  }, [])

  const fetchScenarios = useCallback(async (difficulty = 'beginner') => {
    try {
      const res = await fetch(`${API}/practice/scenarios?difficulty=${difficulty}`)
      if (res.ok) return await res.json()
    } catch (e) { console.error('fetchScenarios error', e) }
    return []
  }, [])

  const evaluateAnswer = useCallback(async (scenarioId, answer, context) => {
    try {
      const res = await fetch(`${API}/practice/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_id: scenarioId, answer, context })
      })
      if (res.ok) return await res.json()
    } catch (e) { console.error('evaluateAnswer error', e) }
    return null
  }, [])

  const fetchNews = useCallback(async (category = 'all') => {
    try {
      const res = await fetch(`${API}/news?category=${category}`)
      if (res.ok) return await res.json()
    } catch (e) { console.error('fetchNews error', e) }
    return { items: [], last_updated: null }
  }, [])

  return { fetchModules, fetchLesson, submitQuiz, fetchScenarios, evaluateAnswer, fetchNews }
}
