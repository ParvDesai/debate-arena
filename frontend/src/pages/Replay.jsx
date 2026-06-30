import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/shared/Navbar'
import ScoreHeader from '../components/debate/ScoreHeader'
import ArgumentCard from '../components/debate/ArgumentCard'
import api from '../services/api'
import './Replay.css'

export default function Replay() {
  const { id: roomId } = useParams()
  const navigate = useNavigate()
  const [room, setRoom] = useState(null)
  const [args, setArgs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReplay = async () => {
      try {
        const { data } = await api.get(`/rooms/replay/${roomId}`)
        setRoom(data.room)
        setArgs(data.arguments || [])
      } catch (err) {
        console.error('Replay fetch failed:', err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchReplay()
  }, [roomId])

  const { forScore, againstScore } = useMemo(() => {
    const forTotal = args.filter(a => a.side === 'for').reduce((s, a) => s + (a.aiScore?.total || 0), 0)
    const againstTotal = args.filter(a => a.side === 'against').reduce((s, a) => s + (a.aiScore?.total || 0), 0)
    return { forScore: forTotal, againstScore: againstTotal }
  }, [args])

  if (loading) {
    return (
      <div className="replay-page">
        <Navbar />
        <div className="loading-center">
          <div className="shimmer-bg" style={{ width: 60, height: 60, borderRadius: '50%' }} />
          <p>Loading replay...</p>
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="replay-page">
        <Navbar />
        <div className="loading-center">
          <p>Replay not found.</p>
          <button className="btn btn-primary" onClick={() => navigate('/lobby')}>
            RETURN TO LOBBY
          </button>
        </div>
      </div>
    )
  }

  const forArgs = args.filter(a => a.side === 'for')
  const againstArgs = args.filter(a => a.side === 'against')

  return (
    <div className="replay-page">
      <Navbar />
      <div className="replay-content">
        {/* Winner Banner */}
        {room.winnerId ? (
          <div className="replay-winner-banner glass">
            <span className="rw-icon">👑</span>
            <span className="rw-text">
              <strong>{room.winnerId.username}</strong> won this debate
            </span>
          </div>
        ) : room.status === 'finished' ? (
          <div className="replay-winner-banner glass">
            <span className="rw-icon">⚖️</span>
            <span className="rw-text">This debate ended in a <strong>draw</strong></span>
          </div>
        ) : null}

        <ScoreHeader
          topic={room.topic}
          forScore={forScore}
          againstScore={againstScore}
        />

        <div className="replay-players">
          <span className="rp-for">🔥 {room.debaterFor?.username || 'AI'}</span>
          <span className="rp-vs">VS</span>
          <span className="rp-against">❄️ {room.debaterAgainst?.username || 'AI'}</span>
        </div>

        <div className="replay-feed">
          <div className="replay-column">
            <div className="column-header for-header">
              <span className="column-icon">🔥</span> FOR
            </div>
            {forArgs.map((arg, i) => (
              <ArgumentCard key={arg._id || i} argument={arg} index={i} />
            ))}
          </div>

          <div className="feed-divider" />

          <div className="replay-column">
            <div className="column-header against-header">
              <span className="column-icon">❄️</span> AGAINST
            </div>
            {againstArgs.map((arg, i) => (
              <ArgumentCard key={arg._id || i} argument={arg} index={i} />
            ))}
          </div>
        </div>

        <div className="replay-actions">
          <button className="btn btn-primary" onClick={() => navigate('/lobby')}>
            RETURN TO ARENA
          </button>
        </div>
      </div>
    </div>
  )
}
