import { motion } from 'framer-motion'
import ScoreBar from '../shared/ScoreBar'
import './ArgumentCard.css'

export default function ArgumentCard({ argument, index }) {
  const isFor = argument.side === 'for'
  const username = argument.userId?.username || 'AI Opponent'
  const hasScore = argument.aiScore && argument.aiScore.total > 0

  return (
    <motion.div
      className={`argument-card ${isFor ? 'arg-for' : 'arg-against'}`}
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      layout
    >
      <div className="arg-header">
        <div className="arg-user">
          <div className={`arg-avatar ${isFor ? 'avatar-for' : 'avatar-against'}`}>
            {username.charAt(0).toUpperCase()}
          </div>
          <div className="arg-meta">
            <span className="arg-username">{username}</span>
            <span className="arg-turn">Turn {argument.turnNumber}</span>
          </div>
        </div>
        {hasScore && (
          <div className="arg-total-badge" style={{
            background: isFor ? 'var(--for-bg)' : 'var(--against-bg)',
            color: isFor ? 'var(--for-primary)' : 'var(--against-primary)',
            border: `1px solid ${isFor ? 'var(--for-border)' : 'var(--against-border)'}`,
          }}>
            {argument.aiScore.total}/30
          </div>
        )}
      </div>

      <p className="arg-text">{argument.text}</p>

      {hasScore && (
        <div className="arg-scores">
          <ScoreBar
            label="C"
            value={argument.aiScore.coherence}
            color={isFor ? 'var(--for-primary)' : 'var(--against-primary)'}
          />
          <ScoreBar
            label="E"
            value={argument.aiScore.evidence}
            color={isFor ? 'var(--for-primary)' : 'var(--against-primary)'}
          />
          <ScoreBar
            label="L"
            value={argument.aiScore.logic}
            color={isFor ? 'var(--for-primary)' : 'var(--against-primary)'}
          />
        </div>
      )}

      {argument.aiFeedback && (
        <p className="arg-feedback">{argument.aiFeedback}</p>
      )}
    </motion.div>
  )
}
