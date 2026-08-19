import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, CheckCircle, ArrowRight } from 'lucide-react'
import useStore from '../../store/useStore'
import useApi from '../../hooks/useApi'

export default function LessonModal({ lesson, onClose }) {
  const [phase, setPhase] = useState('reading')
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const completeLesson = useStore(s => s.completeLesson)
  const completedLessons = useStore(s => s.completedLessons)
  const { submitQuiz } = useApi()
  const alreadyDone = completedLessons.includes(lesson?.id)

  const handleSubmitQuiz = async () => {
    if (!lesson?.quiz?.length) {
      completeLesson(lesson.id, 100)
      setResult({ score: 100, feedback: 'Lesson complete! Core concepts absorbed.', passed: true })
      setPhase('result')
      return
    }
    setLoading(true)
    const res = await submitQuiz(lesson.id, answers)
    setLoading(false)
    if (res) {
      completeLesson(lesson.id, res.score)
      setResult(res)
    } else {
      const score = calculateLocalScore()
      completeLesson(lesson.id, score)
      setResult({ score, feedback: score >= 60 ? 'Great work, you demonstrated institutional understanding!' : 'Good attempt! Review the material to master it.', passed: score >= 60 })
    }
    setPhase('result')
  }

  const calculateLocalScore = () => {
    if (!lesson?.quiz?.length) return 100
    let correct = 0
    lesson.quiz.forEach((q, i) => { if (answers[i] === q.correct) correct++ })
    return Math.round((correct / lesson.quiz.length) * 100)
  }

  const renderMarkdown = (text) => {
    if (!text) return <p className="text-text-muted">Loading lesson content...</p>
    return text.split('\n').map((line, i) => {
      if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-extrabold mt-6 mb-3 text-white border-b border-border pb-2">{line.slice(3)}</h2>
      if (line.startsWith('### ')) return <h3 key={i} className="text-base font-bold mt-4 mb-2 text-red-400">{line.slice(4)}</h3>
      if (line.startsWith('> ')) return <blockquote key={i} className="border-l-4 border-red-500 pl-4 py-2 my-3 text-text-secondary italic bg-red-500/10 rounded-r">{line.slice(2)}</blockquote>
      if (line.startsWith('- ')) return <li key={i} className="ml-5 mb-1 list-disc text-text-secondary">{line.slice(2)}</li>
      if (line.trim() === '') return <div key={i} className="h-2" />
      const formatted = line
        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
        .replace(/`(.*?)`/g, '<code class="bg-void border border-border text-red-300 px-1.5 py-0.5 rounded font-mono text-xs">$1</code>')
      return <p key={i} className="mb-3 text-text-muted leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />
    })
  }

  if (!lesson) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-void/95 backdrop-blur-md flex items-start justify-center p-4 md:p-8 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-2xl card rounded-2xl overflow-hidden my-8 border border-border shadow-2xl"
      >
        <div className="sticky top-0 bg-surface border-b border-border px-6 py-4 flex justify-between items-center z-10">
          <div>
            <p className="text-xs text-red-500 font-mono uppercase tracking-widest font-bold mb-1">Module Lesson</p>
            <h2 className="text-lg font-extrabold text-white">{lesson.title}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-border flex items-center justify-center text-text-muted hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {phase === 'reading' && (
          <div className="px-6 py-6 max-h-[75vh] overflow-y-auto">
            <div className="prose-sm max-w-none text-text-secondary leading-relaxed">{renderMarkdown(lesson.content)}</div>
            <div className="mt-8 pt-6 border-t border-border sticky bottom-0 bg-surface/95 backdrop-blur py-2">
              {alreadyDone ? (
                <div className="flex gap-3">
                  <button onClick={() => setPhase('quiz')} className="flex-1 py-3.5 rounded-xl bg-red-gradient text-white font-extrabold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-red-500/20">
                    Retake Quiz <ArrowRight size={16} />
                  </button>
                  <button onClick={onClose} className="px-6 py-3.5 rounded-xl bg-surface border border-border text-text-muted hover:text-white font-bold">
                    Close
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => lesson.quiz?.length ? setPhase('quiz') : handleSubmitQuiz()}
                  className="w-full py-4 rounded-xl bg-red-gradient text-white font-extrabold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-red-500/25 uppercase tracking-wider text-sm"
                >
                  {lesson.quiz?.length ? 'Start Knowledge Evaluation' : 'Mark as Completed'} <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {phase === 'quiz' && lesson.quiz && (
          <div className="px-6 py-6 space-y-6 max-h-[75vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-extrabold text-lg text-white">Evaluation Quiz</h3>
              <span className="text-xs text-red-400 font-mono font-bold">{Object.keys(answers).length}/{lesson.quiz.length} Answered</span>
            </div>
            {lesson.quiz.map((q, qi) => (
              <div key={qi} className="space-y-3 bg-void/60 p-4 rounded-xl border border-border">
                <p className="font-bold text-sm text-white">{qi + 1}. {q.question}</p>
                <div className="space-y-2">
                  {q.options.map((opt, oi) => (
                    <button
                      key={oi}
                      onClick={() => setAnswers(prev => ({ ...prev, [qi]: oi }))}
                      className={`w-full text-left p-3.5 rounded-lg border text-sm transition-all ${
                        answers[qi] === oi
                          ? 'border-red-500 bg-red-500/20 text-white font-bold'
                          : 'border-border hover:border-red-500/30 text-text-muted hover:bg-white/5'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div className="pt-4 flex gap-3">
              <button
                onClick={() => setPhase('reading')}
                className="px-5 py-3.5 rounded-xl border border-border text-text-muted hover:text-white transition-colors font-bold"
              >
                Review
              </button>
              <button
                onClick={handleSubmitQuiz}
                disabled={loading || Object.keys(answers).length < lesson.quiz.length}
                className="flex-1 py-3.5 rounded-xl bg-red-gradient text-white font-extrabold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity uppercase tracking-wider text-sm shadow-lg shadow-red-500/25"
              >
                {loading ? 'Evaluating...' : 'Submit Answers'}
              </button>
            </div>
          </div>
        )}

        {phase === 'result' && result && (
          <div className="px-6 py-10 text-center space-y-4">
            <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center border-2 ${
              result.score >= 80 ? 'bg-red-500/20 border-red-500 text-white' : result.score >= 60 ? 'bg-white/10 border-white text-white' : 'bg-red-950 border-red-800 text-red-400'
            }`}>
              <span className="text-3xl font-black font-mono">{result.score}%</span>
            </div>
            <h3 className="text-2xl font-black text-white">
              {result.score >= 80 ? '🏆 Mastery Confirmed!' : result.score >= 60 ? '✅ Evaluation Passed!' : '📚 Review Recommended'}
            </h3>
            <p className="text-text-secondary max-w-md mx-auto leading-relaxed">{result.feedback || 'Lesson completed successfully.'}</p>
            <p className="text-xs text-red-400 font-mono font-bold">
              {result.score >= 80 ? '+100 XP awarded · Tier progress updated' : result.score >= 60 ? '+60 XP awarded' : '+30 XP awarded'}
            </p>
            <div className="pt-4">
              <button onClick={onClose} className="px-8 py-3.5 rounded-xl bg-red-gradient text-white font-extrabold hover:opacity-90 transition-opacity shadow-lg shadow-red-500/30 uppercase tracking-wider text-sm">
                Continue Curriculum
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
