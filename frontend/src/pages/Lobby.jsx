import { useState, useEffect } from 'react'
import useRooms from '../hooks/useRooms'
import RoomCard from '../components/lobby/RoomCard'
import CreateRoomModal from '../components/lobby/CreateRoomModal'
import Navbar from '../components/shared/Navbar'
import api from '../services/api'
import './Lobby.css'

export default function Lobby() {
  const { rooms, loading, refetch } = useRooms()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [leaderboard, setLeaderboard] = useState([])
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data } = await api.get('/leaderboard')
        setLeaderboard(data.leaderboard || [])
      } catch (err) {
        console.error('Leaderboard fetch failed:', err.message)
      }
    }
    fetchLeaderboard()
  }, [])

  // Show refresh indicator on background updates
  useEffect(() => {
    let timeout
    setIsRefreshing(true)
    timeout = setTimeout(() => setIsRefreshing(false), 300)
    return () => clearTimeout(timeout)
  }, [rooms.length]) // Trigger when rooms list changes

  const liveCount = rooms.filter(r => r.status === 'active').length

  return (
    <div className="lobby-page">
      <Navbar />

      {/* Hero Banner */}
      <div className="lobby-hero">
        <div className="hero-content page-enter">
          <h1 className="hero-title">
            <span className="hero-icon">⚔</span>
            <span className="gradient-text">ENTER THE ARENA</span>
          </h1>
          <p className="hero-tagline">Where words become weapons and logic decides the victor</p>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-value">{rooms.length}</span>
              <span className="hero-stat-label">ROOMS</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value hero-live">{liveCount}</span>
              <span className="hero-stat-label">
                {liveCount > 0 && <span className="live-dot" />}
                LIVE NOW
              </span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">{leaderboard.length}</span>
              <span className="hero-stat-label">GLADIATORS</span>
            </div>
          </div>
          <button
            id="new-battle-btn"
            className="btn btn-primary hero-cta"
            onClick={() => setShowCreateModal(true)}
          >
            <span>⚔</span> CREATE BATTLE
          </button>
        </div>
      </div>

      <div className="lobby-content page-enter">
        <div className="lobby-main">
          <div className="lobby-header">
            <div>
              <h2 className="lobby-title">Active Battles</h2>
              <p className="lobby-subtitle">
                {rooms.length} rooms available
                {isRefreshing && <span className="refresh-indicator">⟳</span>}
              </p>
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => setShowCreateModal(true)}
            >
              <span>+</span> NEW BATTLE
            </button>
          </div>

          {loading ? (
            <div className="lobby-grid stagger-in">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card shimmer-bg" style={{ height: 220 }} />
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <div className="lobby-empty">
              <span className="empty-icon">🏟</span>
              <h3>The arena is quiet...</h3>
              <p>Be the first to create a battle!</p>
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                CREATE BATTLE
              </button>
            </div>
          ) : (
            <div className="lobby-grid stagger-in">
              {rooms.map((room) => (
                <RoomCard key={room._id} room={room} onJoined={refetch} />
              ))}
            </div>
          )}
        </div>

        <aside className="lobby-sidebar">
          <div className="sidebar-section card">
            <h2 className="sidebar-title">
              <span>🏆</span> TOP GLADIATORS
            </h2>
            <div className="leaderboard-mini">
              {leaderboard.slice(0, 10).map((user, i) => (
                <div key={user._id} className="lb-row">
                  <span className={`lb-rank ${i < 3 ? `lb-rank-${i + 1}` : ''}`}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </span>
                  <span className="lb-name">{user.username}</span>
                  <span className="lb-wins">{user.wins}W</span>
                </div>
              ))}
              {leaderboard.length === 0 && (
                <p className="lb-empty">No warriors yet</p>
              )}
            </div>
          </div>
        </aside>
      </div>

      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  )
}
