import { useMemo } from 'react'
import './CountdownTimer.css'

export default function CountdownTimer({ seconds, maxSeconds = 60 }) {
  const radius = 38
  const circumference = 2 * Math.PI * radius
  const progress = seconds / maxSeconds
  const dashOffset = circumference * (1 - progress)

  const color = useMemo(() => {
    if (seconds > 30) return 'var(--accent-cyan)'
    if (seconds > 15) return 'var(--score-gold)'
    return 'var(--live-red)'
  }, [seconds])

  return (
    <div className="countdown-timer">
      <svg className="countdown-svg" viewBox="0 0 84 84">
        {/* Track */}
        <circle
          cx="42" cy="42" r={radius}
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth="4"
        />
        {/* Progress */}
        <circle
          cx="42" cy="42" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 42 42)"
          style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.5s ease' }}
        />
      </svg>
      <span className="countdown-text" style={{ color }}>
        {seconds}
      </span>
    </div>
  )
}
