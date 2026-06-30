import './SpectatorBadge.css'

export default function SpectatorBadge({ count }) {
  return (
    <div className="spectator-badge">
      <span className="spectator-icon">👁</span>
      <span className="spectator-count">{count}</span>
      <span className="spectator-label">viewers</span>
    </div>
  )
}
