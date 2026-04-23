import { motion } from 'framer-motion'

export default function ProgressBar({ progress, className = '', color = 'bg-gold glow-border-gold' }) {
  const clamped = Math.max(0, Math.min(100, progress))
  
  return (
    <div className={`h-2 bg-void border border-border rounded-full overflow-hidden ${className}`}>
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
        className={`h-full ${color}`}
      />
    </div>
  )
}
