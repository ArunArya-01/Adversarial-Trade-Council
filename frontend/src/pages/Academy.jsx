import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, PlayCircle, CheckCircle2, Crosshair, Rotate3D } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../store/useStore'
import useApi from '../hooks/useApi'
import CandleVisualizer from '../components/3d/CandleVisualizer'

// ── Scenario definitions keyed to lesson IDs ──
// These provide historical market context tailored to each lesson.
const LESSON_SCENARIOS = {
  'candlestick-basics': {
    title: 'Candlestick Pattern Recognition',
    context: 'You are trading AAPL during Q4 2023 earnings season. Identify the hammer and doji patterns in the replay, then decide whether to enter long.',
    symbol: 'AAPL',
    period: '2023-Q4',
  },
  'support-resistance': {
    title: 'Support & Resistance Levels',
    context: 'AAPL is approaching a key support level at $175. The market has bounced here 3 times in the last month. Watch the candlestick patterns and decide: is support holding?',
    symbol: 'AAPL',
    period: '2024-Q1',
  },
  'risk-management': {
    title: 'Stop-Loss Discipline',
    context: 'You entered AAPL at $182. Your stop-loss is set at $178. The market is selling off aggressively. Execute the stop-loss or hold through the volatility.',
    symbol: 'AAPL',
    period: '2024-Q2',
  },
}

export default function Academy() {
  const navigate = useNavigate()
  const { fetchLessons } = useApi()
  const lessons = useStore((state) => state.lessons.list)
  const setCurrentScenario = useStore((state) => state.setCurrentScenario)
  const [selectedLesson, setSelectedLesson] = useState(null)
  const [quizAnswer, setQuizAnswer] = useState(null)

  useEffect(() => {
    fetchLessons()
  }, [fetchLessons])

  // ── Determine if the current lesson has a candlestick anatomy section ──
  const isCandlestickLesson = selectedLesson?.id === 'candlestick-basics' 
    || selectedLesson?.title?.toLowerCase().includes('candlestick')
    || selectedLesson?.tags?.includes('candlestick')

  // ── Launch the scenario challenge ──
  const handleSimulateChallenge = useCallback(() => {
    if (!selectedLesson) return

    // Look up a tailored scenario, or create a generic one
    const scenario = LESSON_SCENARIOS[selectedLesson.id] || {
      title: `${selectedLesson.title} — Practice Challenge`,
      context: `Apply the concepts from "${selectedLesson.title}" in a live market replay. Make at least one trade and review the AI mentor's feedback.`,
      symbol: 'AAPL',
      period: 'general',
    }

    setCurrentScenario(scenario)
    setSelectedLesson(null)
    navigate('/war-room')
  }, [selectedLesson, setCurrentScenario, navigate])

  // Simple custom Markdown parser
  const renderMarkdown = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold mt-6 mb-3 text-gold">{line.slice(3)}</h2>
      if (line.startsWith('### ')) return <h3 key={i} className="text-xl font-semibold mt-5 mb-2 text-text-primary">{line.slice(4)}</h3>
      if (line.startsWith('> ')) return <blockquote key={i} className="border-l-4 border-gold pl-4 py-1 my-4 text-gold bg-gold-wash italic rounded-r">{line.slice(2)}</blockquote>
      if (line.startsWith('- ')) return <li key={i} className="ml-4 mb-1 list-disc text-text-muted">{line.slice(2)}</li>
      if (line.trim() === '') return <div key={i} className="h-2"></div>
      
      // Inline styling (very basic)
      let formattedLine = line
        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-gold">$1</strong>')
        .replace(/`(.*?)`/g, '<code class="bg-void border border-border text-gold/80 px-1.5 py-0.5 rounded font-mono text-sm">$1</code>')
      
      return <p key={i} className="mb-4 text-text-muted leading-relaxed" dangerouslySetInnerHTML={{ __html: formattedLine }} />
    });
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <GraduationCap className="text-gold glow-text-gold" size={32} />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">TradeMind Academy</h1>
          <p className="text-sm text-text-muted mt-1">Master the markets. Learn the fundamentals.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lessons.length === 0 ? (
          // Loading skeleton
          [1,2,3].map(i => (
            <div key={i} className="gold-card rounded-xl p-5 animate-pulse h-40">
              <div className="h-4 bg-border rounded w-1/3 mb-4"></div>
              <div className="h-5 bg-border rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-border rounded w-1/2"></div>
            </div>
          ))
        ) : (
          lessons.map((lesson) => (
            <div key={lesson.id} className="gold-card rounded-xl p-5 hover:border-gold/40 transition-all duration-300 flex flex-col h-full group cursor-pointer hover:shadow-gold-sm" onClick={() => {
              fetch('/api/lessons/' + lesson.id)
                .then(r => r.json())
                .then(data => {
                  setSelectedLesson(data)
                  setQuizAnswer(null)
                })
            }}>
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-mono font-bold text-gold bg-gold-wash px-2 py-1 rounded border border-gold/20">Mod {lesson.module}</span>
                <span className="text-xs font-mono text-text-muted border border-border px-2 py-1 rounded flex items-center gap-1">
                  {lesson.xp_reward} XP
                </span>
              </div>
              
              <h3 className="text-lg font-bold mb-2 group-hover:text-gold transition-colors">{lesson.title}</h3>
              <div className="flex gap-2 mb-4 flex-wrap">
                {(lesson.tags || []).map(tag => <span key={tag} className="text-[10px] uppercase font-mono text-text-dim border border-border px-1.5 py-0.5 rounded">#{tag}</span>)}
              </div>

              <div className="mt-auto pt-4 border-t border-border flex items-center justify-between text-sm font-medium text-text-muted">
                <span className="flex items-center gap-1"><PlayCircle size={16}/> {lesson.duration_min} min</span>
                <span className="text-gold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">Start <span className="text-lg leading-none">→</span></span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Lesson Modal ── */}
      <AnimatePresence>
        {selectedLesson && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-void/95 backdrop-blur-sm flex justify-center items-start overflow-y-auto p-4 md:p-8"
          >
            <motion.div 
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="w-full max-w-3xl gold-card rounded-2xl shadow-2xl shadow-gold/5 overflow-hidden relative my-8"
            >
              {/* Header */}
              <div className="sticky top-0 bg-surface/95 backdrop-blur border-b border-border px-8 py-4 flex justify-between items-center z-10">
                <div>
                  <div className="text-xs font-mono text-gold mb-1">{selectedLesson.module_name}</div>
                  <h2 className="text-xl font-bold">{selectedLesson.title}</h2>
                </div>
                <button 
                  onClick={() => setSelectedLesson(null)}
                  className="text-text-muted hover:text-white pb-1 w-8 h-8 flex items-center justify-center rounded-full hover:bg-void transition-colors border border-transparent hover:border-border"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="px-8 py-6 max-w-none">
                {renderMarkdown(selectedLesson.content)}
              </div>

              {/* ── 3D Candle Anatomy (only for candlestick lessons) ── */}
              {isCandlestickLesson && (
                <div className="mx-8 mb-6 gold-card rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface">
                    <Rotate3D size={16} className="text-gold" />
                    <span className="text-xs font-mono text-gold/70 font-semibold tracking-widest">INTERACTIVE 3D — DRAG TO ROTATE</span>
                  </div>
                  <div className="h-[320px] bg-void">
                    <CandleVisualizer isGreen={true} showLabels={true} />
                  </div>
                </div>
              )}

              {/* Quiz */}
              <div className="px-8 py-8 bg-void border-t border-border">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 border-b border-border pb-2">
                  <CheckCircle2 className="text-gold"/> Knowledge Check
                </h3>
                <div className="p-6 gold-card rounded-xl">
                  <p className="font-medium mb-4 text-text-primary">{selectedLesson.quiz.question}</p>
                  <div className="space-y-3">
                    {selectedLesson.quiz.options.map((opt, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => setQuizAnswer(idx)}
                        className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                          quizAnswer === idx 
                            ? 'border-gold bg-gold-wash text-gold' 
                            : 'border-border hover:border-gold/30 hover:bg-gold-wash text-text-muted'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Simulate Challenge Button (Lock & Key) ── */}
              <div className="px-8 py-6 bg-surface border-t border-border">
                <button 
                  onClick={handleSimulateChallenge}
                  className="w-full py-4 rounded-xl font-bold text-sm tracking-widest uppercase transition-all duration-300
                    bg-gold-gradient text-black hover:shadow-gold-lg hover:scale-[1.01] active:scale-[0.99]
                    flex items-center justify-center gap-3"
                >
                  <Crosshair size={18} />
                  Simulate Challenge — Enter the War Room
                </button>
                <p className="text-xs text-text-dim text-center mt-3 font-mono">
                  Apply this lesson in a live market replay with AI mentorship
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
