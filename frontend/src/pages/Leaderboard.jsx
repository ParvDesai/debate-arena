import { useState, useEffect } from 'react'
import Navbar from '../components/shared/Navbar'
import api from '../services/api'
import './Leaderboard.css'

export default function Leaderboard() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/leaderboard')
        setUsers(data.leaderboard || [])
      } catch (err) {
        console.error('Leaderboard error:', err.message)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const getRankDisplay = (i) => {
    if (i === 0) return '🥇'
    if (i === 1) return '🥈'
    if (i === 2) return '🥉'
    return `#${i + 1}`
  }

  const getWinRate = (u) => {
    const total = (u.wins || 0) + (u.losses || 0)
    if (total === 0) return '—'
    return `${Math.round((u.wins / total) * 100)}%`
  }

  return (
    <div className="lb-page">
      <Navbar />
      <div className="lb-content">
        <div className="lb-page-header">
          <span className="lb-icon">🏆</span>
          <h1 className="lb-page-title gradient-text">LEADERBOARD</h1>
          <p className="lb-page-subtitle">Top gladiators in the arena</p>
        </div>

        <div className="lb-table-wrap card">
          {loading ? (
            <div className="lb-loading">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="shimmer-bg" style={{ height: 48, borderRadius: 8, marginBottom: 8 }} />
              ))}
            </div>
          ) : (
            <table className="lb-table">
              <thead>
                <tr>
                  <th>RANK</th>
                  <th>GLADIATOR</th>
                  <th>WINS</th>
                  <th>DRAWS</th>
                  <th>LOSSES</th>
                  <th>WIN RATE</th>
                  <th>GAMES</th>
                  <th>SCORE</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => (
                  <tr key={user._id} className={`lb-row-table ${i < 3 ? `lb-top-${i + 1}` : ''}`}>
                    <td className="lb-rank-cell">{getRankDisplay(i)}</td>
                    <td>
                      <div className="lb-user-cell">
                        <div className="lb-avatar" style={{
                          background: i === 0 ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
                            : i === 1 ? 'linear-gradient(135deg, #94a3b8, #64748b)'
                            : i === 2 ? 'linear-gradient(135deg, #b45309, #92400e)'
                            : 'var(--gradient-cta)',
                        }}>
                          {user.username?.charAt(0).toUpperCase()}
                        </div>
                        <span className="lb-username">{user.username}</span>
                      </div>
                    </td>
                    <td className="lb-wins-cell">{user.wins || 0}</td>
                    <td className="lb-draws-cell">{Math.max(0, (user.gamesPlayed || 0) - (user.wins || 0) - (user.losses || 0))}</td>
                    <td className="lb-losses-cell">{user.losses || 0}</td>
                    <td className="lb-rate-cell">{getWinRate(user)}</td>
                    <td className="lb-games-cell">{user.gamesPlayed || 0}</td>
                    <td className="lb-score-cell">{user.totalScore || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && users.length === 0 && (
            <div className="lb-empty-state">
              <p>No warriors have entered the arena yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
