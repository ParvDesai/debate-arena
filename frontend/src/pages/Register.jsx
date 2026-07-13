import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import './Auth.css'

export default function Register() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { register, user } = useAuth()
  const navigate = useNavigate()

  if (user) {
    navigate('/lobby', { replace: true })
    return null
  }

  // Password strength logic
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: 'NONE', color: '#64748b', checks: {} }
    
    const checks = {
      length: pwd.length >= 8,
      hasUpper: /[A-Z]/.test(pwd),
      hasLower: /[a-z]/.test(pwd),
      hasDigit: /\d/.test(pwd),
      hasSpecial: /[@$!%*?&#]/.test(pwd)
    }
    
    let score = 0
    if (checks.length) score++
    if (checks.hasUpper) score++
    if (checks.hasLower) score++
    if (checks.hasDigit) score++
    if (checks.hasSpecial) score++
    
    let label = 'WEAK'
    let color = '#ef4444' // Red
    
    if (score === 5) {
      label = 'STRONG'
      color = '#10b981' // Green
    } else if (score >= 3) {
      label = 'MEDIUM'
      color = '#fbbf24' // Yellow
    }
    
    return { score, label, color, checks }
  }

  const strength = getPasswordStrength(password)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // Trim inputs
    const cleanUsername = username.trim()
    const cleanEmail = email.trim()

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address.')
      return
    }

    // Username validation
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    if (!usernameRegex.test(cleanUsername)) {
      setError('Username must be 3-20 characters and contain only letters, numbers, and underscores.')
      return
    }

    // Password strength check
    if (strength.score < 5) {
      setError('Password is too weak. Please fulfill all requirements below.')
      return
    }

    // Password matching check
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await register(cleanUsername, cleanEmail, password)
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
          />
          <span className="field-hint">3-20 characters. Alphanumeric & underscores.</span>
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
          <div className="password-input-wrapper">
            <input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              className="input input-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          
          {password && (
            <div className="strength-meter-container">
              <div className="strength-label-row">
                <span>STRENGTH:</span>
                <span style={{ color: strength.color, fontWeight: 'bold' }}>{strength.label}</span>
              </div>
              <div className="strength-bar-track">
                <div 
                  className="strength-bar-fill" 
                  style={{ 
                    width: `${(strength.score / 5) * 100}%`,
                    backgroundColor: strength.color 
                  }} 
                />
              </div>
              <ul className="strength-requirements">
                <li className={strength.checks.length ? 'checked' : ''}>
                  {strength.checks.length ? '✓' : '✗'} 8+ characters
                </li>
                <li className={strength.checks.hasUpper ? 'checked' : ''}>
                  {strength.checks.hasUpper ? '✓' : '✗'} Upper case letter
                </li>
                <li className={strength.checks.hasLower ? 'checked' : ''}>
                  {strength.checks.hasLower ? '✓' : '✗'} Lower case letter
                </li>
                <li className={strength.checks.hasDigit ? 'checked' : ''}>
                  {strength.checks.hasDigit ? '✓' : '✗'} A number
                </li>
                <li className={strength.checks.hasSpecial ? 'checked' : ''}>
                  {strength.checks.hasSpecial ? '✓' : '✗'} Special symbol (@$!%*?&#)
                </li>
              </ul>
            </div>
          )}
        </div>

        <div className="auth-field">
          <label className="auth-label">CONFIRM SECRET KEY</label>
          <div className="password-input-wrapper">
            <input
              id="register-confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              className="input input-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
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
