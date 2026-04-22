import { useEffect, useState } from 'react'
import { GraduationCap, PlayCircle, CheckCircle2 } from 'lucide-react'
import useStore from '../store/useStore'
import useApi from '../hooks/useApi'

export default function Academy() {
  const { fetchLessons } = useApi()
  const lessons = useStore((state) => state.lessons.list)
  const [selectedLesson, setSelectedLesson] = useState(null)

  useEffect(() => {
    fetchLessons()
  }, [fetchLessons])

  // Simple custom Markdown parser
  const renderMarkdown = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold mt-6 mb-3 text-teal-400">{line.slice(3)}</h2>
      if (line.startsWith('### ')) return <h3 key={i} className="text-xl font-semibold mt-5 mb-2 text-slate-200">{line.slice(4)}</h3>
      if (line.startsWith('> ')) return <blockquote key={i} className="border-l-4 border-neon-gold pl-4 py-1 my-4 text-neon-gold bg-amber-950/20 italic rounded-r">{line.slice(2)}</blockquote>
      if (line.startsWith('- ')) return <li key={i} className="ml-4 mb-1 list-disc text-slate-300">{line.slice(2)}</li>
      if (line.trim() === '') return <div key={i} className="h-2"></div>
      
      // Inline styling (very basic)
      let formattedLine = line
        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-neon-green">$1</strong>')
        .replace(/`(.*?)`/g, '<code class="bg-void border border-border text-teal-300 px-1.5 py-0.5 rounded font-mono text-sm">$1</code>')
      
      return <p key={i} className="mb-4 text-slate-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: formattedLine }} />
    });
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <GraduationCap className="text-neon-green glow-text-green" size={32} />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">TradeMind Academy</h1>
          <p className="text-sm text-text-muted mt-1">Master the markets. Learn the fundamentals.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lessons.map((lesson) => (
          <div key={lesson.id} className="bg-surface border border-border rounded-xl p-5 hover:border-teal-900 transition-colors flex flex-col h-full group cursor-pointer" onClick={() => {
            // Fetch lesson detail
            fetch('/api/lessons/' + lesson.id)
              .then(r => r.json())
              .then(data => setSelectedLesson(data))
          }}>
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-mono font-bold text-neon-green bg-teal-950/50 px-2 py-1 rounded border border-teal-900">Mod {lesson.module}</span>
              <span className="text-xs font-mono text-text-muted border border-border px-2 py-1 rounded flex items-center gap-1">
                {lesson.xp_reward} XP
              </span>
            </div>
            
            <h3 className="text-lg font-bold mb-2 group-hover:text-neon-green transition-colors">{lesson.title}</h3>
            <div className="flex gap-2 mb-4 flex-wrap">
               {lesson.tags.map(tag => <span key={tag} className="text-[10px] uppercase font-mono text-text-dim border border-border px-1.5 py-0.5 rounded">#{tag}</span>)}
            </div>

            <div className="mt-auto pt-4 border-t border-border flex items-center justify-between text-sm font-medium text-text-muted">
              <span className="flex items-center gap-1"><PlayCircle size={16}/> {lesson.duration_min} min</span>
              <span className="text-neon-cyan flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">Start <span className="text-lg leading-none">→</span></span>
            </div>
          </div>
        ))}
      </div>

      {selectedLesson && (
        <div className="fixed inset-0 z-50 bg-void/90 backdrop-blur flex justify-center items-start overflow-y-auto p-4 md:p-8">
          <div className="w-full max-w-3xl bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden relative my-8">
            {/* Header */}
            <div className="sticky top-0 bg-surface/95 backdrop-blur border-b border-border px-8 py-4 flex justify-between items-center z-10">
              <div>
                <div className="text-xs font-mono text-neon-green mb-1">{selectedLesson.module_name}</div>
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

            {/* Quiz */}
            <div className="px-8 py-8 bg-void border-t border-border">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 border-b border-border/50 pb-2">
                <CheckCircle2 className="text-neon-green"/> Knowledge Check
              </h3>
              <div className="p-6 border border-border rounded-xl bg-surface">
                <p className="font-medium mb-4 text-slate-200">{selectedLesson.quiz.question}</p>
                <div className="space-y-3">
                  {selectedLesson.quiz.options.map((opt, idx) => (
                    <button key={idx} className="w-full text-left p-3 rounded-lg border border-border hover:border-neon-green hover:bg-teal-950/20 text-slate-300 transition-colors">
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
