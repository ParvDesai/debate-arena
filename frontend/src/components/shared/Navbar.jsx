import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import { disconnectSocket } from '../../services/socket'
import './Navbar.css'

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    disconnectSocket()
    await logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav className="navbar glass">
      <div className="navbar-inner">
        <Link to="/lobby" className="navbar-brand">
          <span className="brand-icon">⚔</span>
          <span className="brand-text gradient-text">DEBATE<span style={{ fontWeight: 700 }}>ARENA</span></span>
        </Link>

        <div className="navbar-links">
          <Link
            to="/lobby"
            className={`nav-link ${isActive('/lobby') ? 'active' : ''}`}
          >
            LOBBY
          </Link>
          <Link
            to="/solo"
            className={`nav-link ${isActive('/solo') ? 'active' : ''}`}
          >
            SOLO MODE
          </Link>
          <Link
            to="/leaderboard"
            className={`nav-link ${isActive('/leaderboard') ? 'active' : ''}`}
          >
            LEADERBOARD
          </Link>
        </div>

        <div className="navbar-user">
          {user && (
            <>
              <Link
                to={`/profile/${user.username}`}
                className="user-avatar"
                title="View Profile"
              >
                {user.username?.charAt(0).toUpperCase()}
              </Link>
              <Link to={`/profile/${user.username}`} className="user-name">
                {user.username}
              </Link>
              <button onClick={handleLogout} className="btn-logout">
                EXIT
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
