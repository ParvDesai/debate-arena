import { motion } from 'framer-motion'
import './ScoreBar.css'

export default function ScoreBar({ label, value, max = 10, color = 'var(--accent-purple)' }) {
  const pct = Math.min(100, (value / max) * 100)

  return (
    <div className="score-bar-row">
      <span className="score-bar-label">{label}</span>
      <div className="score-bar-track">
        <motion.div
          className="score-bar-fill"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ background: color }}
        />
      </div>
      <span className="score-bar-value">{value}</span>
    </div>
  )
}
