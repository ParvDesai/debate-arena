import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/shared/Navbar'
import api from '../services/api'
import useAuthStore from '../store/authStore'
import './Profile.css'

export default function Profile() {
  const { username } = useParams()
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const isOwnProfile = currentUser?.username === username

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const { data } = await api.get(`/users/${username}`)
        setProfile(data)
      } catch (err) {
        setError(err.response?.data?.message || 'User not found')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [username])

  if (loading) {
    return (
      <div className="profile-page">
        <Navbar />
        <div className="profile-loading">
          <div className="shimmer-bg profile-avatar-skeleton" />
          <div className="shimmer-bg" style={{ width: 180, height: 24, borderRadius: 8, marginTop: 16 }} />
          <div className="shimmer-bg" style={{ width: 120, height: 16, borderRadius: 8, marginTop: 8 }} />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="profile-page">
        <Navbar />
        <div className="profile-loading">
          <span style={{ fontSize: '3rem' }}>🔍</span>
          <h2 style={{ marginTop: 12 }}>{error}</h2>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/lobby')}>
            BACK TO LOBBY
          </button>
        </div>
      </div>
    )
  }

  const { user, recentDebates, winRate } = profile
  const draws = Math.max(0, (user.gamesPlayed || 0) - (user.wins || 0) - (user.losses || 0))
  const total = user.gamesPlayed || 1 // avoid divide by zero
  const winPct = Math.round((user.wins / total) * 100)
  const drawPct = Math.round((draws / total) * 100)
  const lossPct = 100 - winPct - drawPct

  const getInitial = (name) => name?.charAt(0).toUpperCase() || '?'

  const getDebateResult = (debate) => {
    if (!debate.winnerId) return { label: 'DRAW', cls: 'result-draw' }
    if (debate.winnerId.username === username) return { label: 'WIN', cls: 'result-win' }
    return { label: 'LOSS', cls: 'result-loss' }
  }

  const getUserSide = (debate) => {
    if (debate.debaterFor?.username === username) return '🔥 FOR'
    if (debate.debaterAgainst?.username === username) return '❄️ AGAINST'
    return '—'
  }

  return (
    <div className="profile-page">
      <Navbar />
      <div className="profile-content page-enter">

        {/* Hero Card */}
        <div className="profile-hero card">
          <div className="profile-avatar">
            {getInitial(user.username)}
          </div>
          <div className="profile-identity">
            <h1 className="profile-username">{user.username}</h1>
            {isOwnProfile && <span className="profile-you-badge">YOU</span>}
            <p className="profile-joined">
              Gladiator since {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="profile-stats">
          <div className="stat-card card">
            <span className="stat-value" style={{ color: 'var(--for-primary)' }}>{user.wins || 0}</span>
            <span className="stat-label">WINS</span>
          </div>
          <div className="stat-card card">
            <span className="stat-value" style={{ color: 'var(--score-gold)' }}>{draws}</span>
            <span className="stat-label">DRAWS</span>
          </div>
          <div className="stat-card card">
            <span className="stat-value" style={{ color: 'var(--against-primary)' }}>{user.losses || 0}</span>
            <span className="stat-label">LOSSES</span>
          </div>
          <div className="stat-card card">
            <span className="stat-value gradient-text">{winRate}%</span>
            <span className="stat-label">WIN RATE</span>
          </div>
          <div className="stat-card card">
            <span className="stat-value" style={{ color: 'var(--score-gold)' }}>{user.totalScore || 0}</span>
            <span className="stat-label">SCORE</span>
          </div>
          <div className="stat-card card">
            <span className="stat-value">{user.gamesPlayed || 0}</span>
            <span className="stat-label">DEBATES</span>
          </div>
        </div>

        {/* Win/Draw/Loss Bar */}
        <div className="profile-bar-wrap card">
          <div className="profile-bar-labels">
            <span style={{ color: 'var(--for-primary)' }}>🔥 Wins — {user.wins || 0}</span>
            <span style={{ color: 'var(--score-gold)' }}>⚖️ Draws — {draws}</span>
            <span style={{ color: 'var(--against-primary)' }}>Losses — {user.losses || 0} ❄️</span>
          </div>
          <div className="profile-bar">
            <div className="profile-bar-win" style={{ width: `${winPct}%` }} />
            <div className="profile-bar-draw" style={{ width: `${drawPct}%` }} />
            <div className="profile-bar-loss" style={{ width: `${lossPct}%` }} />
          </div>
        </div>

        {/* Recent Debates */}
        <div className="profile-debates">
          <h2 className="profile-section-title">
            <span>⚔️</span> Recent Battles
          </h2>

          {recentDebates.length === 0 ? (
            <div className="card profile-empty">
              <span>No battles yet</span>
              {isOwnProfile && (
                <button className="btn btn-primary" onClick={() => navigate('/lobby')}>
                  START A BATTLE
                </button>
              )}
            </div>
          ) : (
            <div className="debates-list">
              {recentDebates.map((debate) => {
                const result = getDebateResult(debate)
                const side = getUserSide(debate)
                const opponent = debate.isSoloMode
                  ? '🤖 AI Opponent'
                  : debate.debaterFor?.username === username
                    ? debate.debaterAgainst?.username
                    : debate.debaterFor?.username

                return (
                  <Link
                    key={debate._id}
                    to={`/replay/${debate._id}`}
                    className="debate-history-card card"
                  >
                    <div className={`debate-result-badge ${result.cls}`}>
                      {result.label}
                    </div>
                    <div className="debate-history-info">
                      <p className="debate-history-topic">{debate.topic}</p>
                      <p className="debate-history-meta">
                        {side} &nbsp;·&nbsp; vs {opponent}
                        {debate.isSoloMode && <span className="solo-tag">SOLO</span>}
                      </p>
                    </div>
                    <span className="debate-history-date">
                      {new Date(debate.updatedAt).toLocaleDateString()}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
