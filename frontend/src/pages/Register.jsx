import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import './Auth.css'

export default function Register() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register, user } = useAuth()
  const navigate = useNavigate()

  if (user) {
    navigate('/lobby', { replace: true })
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(username, email, password)
      navigate('/lobby')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-particles">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      <form className="auth-card glass-elevated" onSubmit={handleSubmit}>
        <div className="auth-header">
          <span className="auth-icon">🏛</span>
          <h1 className="auth-title gradient-text">CLAIM YOUR SEAT</h1>
          <p className="auth-subtitle">Join the arena. Prove your worth.</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <div className="auth-field">
          <label className="auth-label">GLADIATOR NAME</label>
          <input
            id="register-username"
            type="text"
            className="input"
            placeholder="DebateLord99"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
          />
        </div>

        <div className="auth-field">
          <label className="auth-label">EMAIL ADDRESS</label>
          <input
            id="register-email"
            type="email"
            className="input"
            placeholder="gladiator@arena.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="auth-field">
          <label className="auth-label">SECRET KEY</label>
          <input
            id="register-password"
            type="password"
            className="input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        <button
          id="register-submit"
          type="submit"
          className="btn btn-primary auth-submit"
          disabled={loading}
        >
          {loading ? 'FORGING...' : 'CLAIM YOUR GLORY'}
        </button>

        <p className="auth-footer">
          Already a Legend?{' '}
          <Link to="/login" className="auth-link">SIGN IN</Link>
        </p>
      </form>
    </div>
  )
}
