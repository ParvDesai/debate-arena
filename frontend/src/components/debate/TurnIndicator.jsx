import { motion } from 'framer-motion'
import './TurnIndicator.css'

export default function TurnIndicator({ currentTurn, turnNumber, maxTurns, isMyTurn, mySide }) {
  const isFor = currentTurn === 'for'
  const icon = isFor ? '🔥' : '❄️'
  const sideText = isFor ? 'FOR' : 'AGAINST'

  return (
    <motion.div
      className={`turn-indicator ${isFor ? 'turn-for' : 'turn-against'} ${isMyTurn ? 'turn-mine' : ''}`}
      key={currentTurn + turnNumber}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <span className="turn-icon">{icon}</span>
      <span className="turn-text">
        {isMyTurn ? 'YOUR TURN — ' : ''}{sideText} — MAKE YOUR ARGUMENT
      </span>
      <span className="turn-round">
        ROUND {turnNumber}/{maxTurns}
      </span>
    </motion.div>
  )
}
