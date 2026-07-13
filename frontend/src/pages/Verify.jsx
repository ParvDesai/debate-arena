import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import api from '../services/api'
import './Auth.css'

export default function Verify() {
  const location = useLocation()
  const navigate = useNavigate()
  const { setUser, setToken, user } = useAuthStore()

  const [email, setEmail] = useState(location.state?.email || '')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  // Redirect if already logged in and verified
  useEffect(() => {
    if (user && user.isVerified !== false) {
      navigate('/lobby', { replace: true })
    }
  }, [user, navigate])

  // Cooldown countdown timer for resending OTP
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const cleanEmail = email.trim()
    const cleanCode = code.trim()

    if (!cleanEmail || !cleanCode) {
      setError('Please provide both email and verification code.')
      return
    }

    if (cleanCode.length !== 6 || isNaN(Number(cleanCode))) {
      setError('Verification code must be a 6-digit number.')
      return
    }

    setLoading(true)
    try {
      const { data } = await api.post('/auth/verify', { email: cleanEmail, code: cleanCode })
      setSuccess(data.message || 'Verified successfully!')
      
      // Save credentials in store & authenticate user
      if (data.token) {
        setToken(data.token)
      }
      if (data.user) {
        setUser(data.user)
      }

      // Small delay before redirect for feedback clarity
      setTimeout(() => {
        navigate('/lobby')
      }, 1500)
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please check the code.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setSuccess('')
    
    const cleanEmail = email.trim()
    if (!cleanEmail) {
      setError('Please specify your email address first.')
      return
    }

    try {
      await api.post('/auth/resend-code', { email: cleanEmail })
      setSuccess('Verification code resent successfully!')
      setResendCooldown(60) // 60s cooldown
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code.')
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

      <form className="auth-card glass-elevated" onSubmit={handleVerify}>
        <div className="auth-header">
          <span className="auth-icon">🔒</span>
          <h1 className="auth-title gradient-text">VERIFY YOUR EMAIL</h1>
          <p className="auth-subtitle">Verify your identity to claim your glory.</p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        <div className="auth-field">
          <label className="auth-label">EMAIL ADDRESS</label>
          <input
            id="verify-email"
            type="email"
            className="input"
            placeholder="gladiator@arena.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!!location.state?.email}
            required
          />
          {!location.state?.email && (
            <span className="field-hint">Enter the email you registered with.</span>
          )}
        </div>

        <div className="auth-field">
          <label className="auth-label">6-DIGIT VERIFICATION CODE</label>
          <input
            id="verify-code"
            type="text"
            className="input code-input"
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '')
              if (val.length <= 6) setCode(val)
            }}
            required
            autoFocus
          />
          <span className="field-hint">Check your email client or spam folder.</span>
        </div>

        <button
          id="verify-submit"
          type="submit"
          className="btn btn-primary auth-submit"
          disabled={loading}
        >
          {loading ? 'CONFIRMING...' : 'VERIFY & ASCEND'}
        </button>

        <div className="verify-resend-container">
          {resendCooldown > 0 ? (
            <span className="resend-text">Resend code in {resendCooldown}s</span>
          ) : (
            <button
              type="button"
              className="btn-link verify-resend-btn"
              onClick={handleResend}
            >
              Resend verification code
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
