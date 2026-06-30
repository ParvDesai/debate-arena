import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import './VictoryOverlay.css'

export default function VictoryOverlay({ data, forVotes, againstVotes }) {
  const navigate = useNavigate()
  if (!data) return null

  const { winner, forTotal, againstTotal, forfeit, forfeitedBy, room } = data
  const winnerName = winner?.username || (winner ? 'AI Opponent' : 'TIE')
  const isTie = !winner

  return (
    <AnimatePresence>
      <motion.div
        className="victory-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="victory-card glass-elevated"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          {forfeit ? (
            <div className="victory-header">
              <span className="victory-icon">🏳️</span>
              <h2 className="victory-title">FORFEIT</h2>
              <p className="victory-subtitle">
                {forfeitedBy?.toUpperCase()} side conceded the debate
              </p>
            </div>
          ) : isTie ? (
            <div className="victory-header">
              <span className="victory-icon">⚖️</span>
              <h2 className="victory-title gradient-text">DRAW</h2>
              <p className="victory-subtitle">An evenly matched battle!</p>
            </div>
          ) : (
            <div className="victory-header">
              <span className="victory-icon">👑</span>
              <h2 className="victory-title gradient-text">{winnerName.toUpperCase()}</h2>
              <p className="victory-subtitle">CLAIMS THE TITLE</p>
            </div>
          )}

          <div className="victory-scores">
            <div className="victory-score for-score">
              <span className="vs-label">FOR</span>
              <span className="vs-value">{forTotal || 0}</span>
            </div>
            <span className="vs-divider">—</span>
            <div className="victory-score against-score">
              <span className="vs-value">{againstTotal || 0}</span>
              <span className="vs-label">AGAINST</span>
            </div>
          </div>

          <div className="victory-audience">
            <span className="audience-label">AUDIENCE SENTIMENT</span>
            <div className="audience-counts">
              <span className="aud-for">🔥 {forVotes || 0}</span>
              <span className="aud-sep">/</span>
              <span className="aud-against">❄️ {againstVotes || 0}</span>
            </div>
          </div>

          <div className="victory-actions">
            <button
              className="btn btn-primary"
              onClick={() => navigate('/lobby')}
            >
              RETURN TO ARENA
            </button>
            {room?._id && (
              <button
                className="btn btn-secondary"
                onClick={() => navigate(`/replay/${room._id}`)}
              >
                VIEW REPLAY
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
