import { useNavigate } from 'react-router-dom'
import AvatarVS from '../shared/AvatarVS'
import './RoomCard.css'
import api from '../../services/api'
import useAuthStore from '../../store/authStore'

export default function RoomCard({ room, onJoined }) {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  
  const isLive = room.status === 'active'
  const isWaiting = room.status === 'waiting'
  
  // Safely extract IDs whether room is populated or not
  const debaterForId = room.debaterFor?._id || room.debaterFor
  const debaterAgainstId = room.debaterAgainst?._id || room.debaterAgainst
  
  const isParticipant = user && (debaterForId === user._id || debaterAgainstId === user._id)
  const canJoin = isWaiting && !debaterAgainstId && !isParticipant

  const handleJoin = async () => {
    if (isParticipant) {
      navigate(`/arena/${room._id}`)
      return
    }
    
    try {
      await api.post(`/rooms/join/${room._id}`)
      if (onJoined) onJoined()
      navigate(`/arena/${room._id}`)
    } catch (err) {
      if (err.response?.data?.message === 'Already in this room') {
        navigate(`/arena/${room._id}`)
      } else {
        console.error('Join failed:', err.response?.data?.message)
      }
    }
  }

  const handleWatch = () => {
    navigate(`/arena/${room._id}`)
  }

  return (
    <div className={`room-card card ${isLive ? 'room-card-live' : ''}`}>
      <div className="room-card-header">
        <div className={`badge ${isLive ? 'badge-live' : 'badge-waiting'}`}>
          {isLive && <span className="live-dot" />}
          {isLive ? 'LIVE' : 'WAITING'}
        </div>
        {room.isSoloMode && <span className="badge badge-finished">SOLO</span>}
      </div>

      <h3 className="room-card-topic">{room.topic}</h3>

      <div className="room-card-players">
        <AvatarVS
          forUser={room.debaterFor}
          againstUser={room.debaterAgainst}
          isSolo={room.isSoloMode}
        />
        <div className="room-card-names">
          <span className="player-name for-name">
            {room.debaterFor?.username || 'Open'}
          </span>
          <span className="vs-text">vs</span>
          <span className="player-name against-name">
            {room.isSoloMode ? 'AI' : (room.debaterAgainst?.username || 'Open')}
          </span>
        </div>
      </div>

      <div className="room-card-footer">
        {isParticipant ? (
          <button className="btn btn-primary room-card-btn" onClick={handleWatch}>
            ENTER ARENA
          </button>
        ) : canJoin ? (
          <button className="btn btn-primary room-card-btn" onClick={handleJoin}>
            JOIN BATTLE
          </button>
        ) : isLive ? (
          <button className="btn btn-secondary room-card-btn" onClick={handleWatch}>
            👁 WATCH
          </button>
        ) : (
          <button className="btn btn-secondary room-card-btn" onClick={handleWatch}>
            VIEW
          </button>
        )}
      </div>
    </div>
  )
}
