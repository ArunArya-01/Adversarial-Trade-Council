export default function ProgressBar({ progress = 0, color = 'red', className = '' }) {
  const colors = {
    red: 'bg-red-gradient',
    white: 'bg-white',
    green: 'bg-green-500',
    blue: 'bg-red-gradient',
  }
  return (
    <div className={`w-full bg-border rounded-full h-1.5 overflow-hidden ${className}`}>
      <div
        className={`${colors[color] || colors.red} h-1.5 rounded-full transition-all duration-700`}
        style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
      />
    </div>
  )
}
