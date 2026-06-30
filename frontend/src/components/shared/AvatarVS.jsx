import './AvatarVS.css'

export default function AvatarVS({ forUser, againstUser, isSolo = false }) {
  const forInitial = forUser?.username?.charAt(0).toUpperCase() || '?'
  const againstInitial = isSolo ? 'AI' : (againstUser?.username?.charAt(0).toUpperCase() || '?')

  return (
    <div className="avatar-vs">
      <div className="avatar avatar-for" title={forUser?.username || 'Waiting...'}>
        {forInitial}
      </div>
      <span className="vs-badge">VS</span>
      <div className="avatar avatar-against" title={isSolo ? 'AI Opponent' : (againstUser?.username || 'Waiting...')}>
        {againstInitial}
      </div>
    </div>
  )
}
