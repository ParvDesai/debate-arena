import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../services/api'
import './CreateRoomModal.css'

export default function CreateRoomModal({ isOpen, onClose }) {
  const [topic, setTopic] = useState('')
  const [isSoloMode, setIsSoloMode] = useState(false)
  const [soloSide, setSoloSide] = useState('for')
  const [maxTurns, setMaxTurns] = useState(3)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!topic.trim()) return
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/rooms/create', {
        topic: topic.trim(),
        isSoloMode,
        maxTurns,
        ...(isSoloMode && { soloSide }),
      })
      onClose()
      navigate(`/arena/${data.room._id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create room')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="modal-content glass-elevated"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">
                <span>⚔</span> NEW BATTLE
              </h2>
              <button className="modal-close" onClick={onClose}>✕</button>
            </div>

            <form onSubmit={handleCreate}>
              {error && <div className="auth-error">{error}</div>}

              <div className="auth-field">
                <label className="auth-label">DEBATE TOPIC</label>
                <input
                  id="create-room-topic"
                  type="text"
                  className="input"
                  placeholder="e.g. AI should be regulated by governments"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="auth-field">
                <label className="auth-label">NUMBER OF ROUNDS</label>
                <select
                  id="create-room-rounds"
                  className="input"
                  value={maxTurns}
                  onChange={(e) => setMaxTurns(Number(e.target.value))}
                >
                  <option value={1}>1 Round</option>
                  <option value={2}>2 Rounds</option>
                  <option value={3}>3 Rounds</option>
                  <option value={5}>5 Rounds</option>
                </select>
              </div>

              <div className="solo-toggle">
                <label className="toggle-label">
                  <input
                    id="create-room-solo"
                    type="checkbox"
                    checked={isSoloMode}
                    onChange={(e) => setIsSoloMode(e.target.checked)}
                  />
                  <span className="toggle-switch" />
                  <span className="toggle-text">
                    SOLO MODE
                    <span className="toggle-desc">Challenge AI Opponent</span>
                  </span>
                </label>
              </div>

              {isSoloMode && (
                <div className="auth-field">
                  <label className="auth-label">YOUR SIDE</label>
                  <div className="stance-selector">
                    <button
                      type="button"
                      className={`stance-btn stance-for${soloSide === 'for' ? ' stance-active' : ''}`}
                      onClick={() => setSoloSide('for')}
                    >
                      <span className="stance-icon">🔥</span>
                      <span className="stance-label">FOR</span>
                      <span className="stance-desc">Support the topic</span>
                    </button>
                    <button
                      type="button"
                      className={`stance-btn stance-against${soloSide === 'against' ? ' stance-active' : ''}`}
                      onClick={() => setSoloSide('against')}
                    >
                      <span className="stance-icon">❄️</span>
                      <span className="stance-label">AGAINST</span>
                      <span className="stance-desc">Oppose the topic</span>
                    </button>
                  </div>
                </div>
              )}

              <button
                id="create-room-submit"
                type="submit"
                className="btn btn-primary auth-submit"
                disabled={loading || !topic.trim()}
              >
                {loading ? 'CREATING...' : isSoloMode ? '🤖 CHALLENGE AI' : '⚔ CREATE BATTLE'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
