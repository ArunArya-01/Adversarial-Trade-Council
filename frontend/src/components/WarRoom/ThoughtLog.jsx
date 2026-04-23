import { useRef, useEffect, useState } from 'react'
import { Terminal } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * TypewriterLine — renders a single log line with a letter-by-letter effect.
 * Only the most recent entry gets the animation; older ones render instantly.
 */
function TypewriterLine({ text, animate, className }) {
  const [displayed, setDisplayed] = useState(animate ? '' : text)
  const [done, setDone] = useState(!animate)

  useEffect(() => {
    if (!animate) return

    let i = 0
    setDisplayed('')
    setDone(false)

    const interval = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(interval)
        setDone(true)
      }
    }, 18) // ~55 chars/sec — fast enough to feel snappy, slow enough to see

    return () => clearInterval(interval)
  }, [text, animate])

  return (
    <div className={className}>
      {displayed}
      {!done && <span className="typewriter-cursor" />}
    </div>
  )
}

export default function ThoughtLog({ logs }) {
  const logEndRef = useRef(null)

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const getLogColor = (type) => {
    switch (type) {
      case 'system': return 'text-text-dim'
      case 'user':   return 'text-white'
      case 'mentor': return 'text-gold glow-text-gold'
      case 'devil':  return 'text-neon-red'
      case 'error':  return 'text-neon-red glow-text-red'
      default:       return 'text-text-muted'
    }
  }

  return (
    <div className="w-80 bg-void border border-border rounded-xl flex flex-col relative overflow-hidden shrink-0 crt-overlay">
      {/* CRT Scanline overlay is applied via the crt-overlay class */}
      
      <div className="h-10 border-b border-border bg-surface flex items-center px-4 shrink-0 relative z-20">
        <Terminal size={16} className="text-gold mr-2" />
        <span className="text-xs font-mono text-gold/70 font-semibold tracking-widest">AI THOUGHT LOG</span>
        <div className="ml-auto flex gap-1.5">
          <span className="w-2 h-2 rounded-full bg-neon-red/70" />
          <span className="w-2 h-2 rounded-full bg-gold-dim/70" />
          <span className="w-2 h-2 rounded-full bg-neon-green/70" />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] leading-relaxed break-words space-y-2 relative z-20">
        <AnimatePresence>
          {logs.map((log, i) => {
            const isLatest = i === logs.length - 1
            const isMentorOrDevil = log.type === 'mentor' || log.type === 'devil'
            
            return (
              <motion.div
                key={`${i}-${log.text.slice(0, 20)}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <TypewriterLine 
                  text={log.text}
                  animate={isLatest && isMentorOrDevil}
                  className={getLogColor(log.type)}
                />
              </motion.div>
            )
          })}
        </AnimatePresence>
        <div ref={logEndRef} />
      </div>
    </div>
  )
}
