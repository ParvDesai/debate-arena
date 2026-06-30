import { useState, useEffect, useCallback } from 'react'
import useSocket from './useSocket'
import useAuthStore from '../store/authStore'
import useRoomStore from '../store/roomStore'

export default function useDebateRoom(roomId) {
  const socket = useSocket()
  const user = useAuthStore((s) => s.user)
  const {
    room, arguments: args, forVotes, againstVotes, spectatorCount,
    setRoom, setArguments, addArgument, updateVotes, setSpectatorCount, reset,
  } = useRoomStore()

  const [timerSeconds, setTimerSeconds] = useState(60)
  const [scoringInProgress, setScoringInProgress] = useState(false)
  const [debateFinished, setDebateFinished] = useState(null)
  const [aiThinking, setAiThinking] = useState(false)
  const [aiCooldown, setAiCooldown] = useState(0)
  const [errorMsg, setErrorMsg] = useState(null)
  const [debaterPresence, setDebaterPresence] = useState({ forPresent: true, againstPresent: true, bothPresent: true })

  // Derived state
  const mySide = room
    ? room.debaterFor?._id === user?._id
      ? 'for'
      : room.debaterAgainst?._id === user?._id
        ? 'against'
        : null
    : null

  const isMyTurn = room?.status === 'active' && room?.currentTurn === mySide
  const isSpectator = !mySide

  useEffect(() => {
    if (!socket || !roomId) return

    // Join the room
    socket.emit('join-room', roomId)

    // --- Listeners ---
    const onRoomState = ({ room: r, arguments: a, spectators }) => {
      setRoom(r)
      setArguments(a || [])
      setSpectatorCount(spectators || 0)
      updateVotes({ forVotes: r.forVotes || 0, againstVotes: r.againstVotes || 0 })
      if (r.status === 'finished') {
        // Calculate totals for finished state
        const forTotal = (a || []).filter(x => x.side === 'for').reduce((s, x) => s + (x.aiScore?.total || 0), 0)
        const againstTotal = (a || []).filter(x => x.side === 'against').reduce((s, x) => s + (x.aiScore?.total || 0), 0)
        setDebateFinished({ room: r, forTotal, againstTotal, winner: r.winnerId })
      }
    }

    const onTimerTick = (remaining) => {
      setTimerSeconds(remaining)
    }

    const onTimerExpired = () => {
      setTimerSeconds(0)
    }

    const onScoringInProgress = () => {
      setScoringInProgress(true)
    }

    const onArgumentScored = (argument) => {
      setScoringInProgress(false)
      setAiThinking(false)
      addArgument(argument)
    }

    const onTurnChanged = ({ currentTurn, turnNumber }) => {
      setRoom((prev) => prev ? { ...prev, currentTurn, turnNumber } : prev)
      setTimerSeconds(60)
    }

    const onDebateFinished = (data) => {
      setDebateFinished(data)
      setRoom((prev) => prev ? { ...prev, status: 'finished' } : prev)
    }

    const onVoteUpdated = ({ forVotes, againstVotes }) => {
      updateVotes({ forVotes, againstVotes })
    }

    const onSpectatorCount = (count) => {
      setSpectatorCount(count)
    }

    const onAiThinking = () => {
      setAiThinking(true)
    }

    const onErrorMsg = (message) => {
      setErrorMsg(message)
      setTimeout(() => setErrorMsg(null), 5000)
    }

    const onDebaterPresence = (presenceData) => {
      setDebaterPresence(presenceData)
    }

    const onAiCooldownTick = (remaining) => {
      setAiCooldown(remaining)
    }

    const onAiCooldownEnded = () => {
      setAiCooldown(0)
    }

    socket.on('room-state', onRoomState)
    socket.on('timer-tick', onTimerTick)
    socket.on('timer-expired', onTimerExpired)
    socket.on('scoring-in-progress', onScoringInProgress)
    socket.on('argument-scored', onArgumentScored)
    socket.on('turn-changed', onTurnChanged)
    socket.on('debate-finished', onDebateFinished)
    socket.on('vote-updated', onVoteUpdated)
    socket.on('spectator-count', onSpectatorCount)
    socket.on('ai-thinking', onAiThinking)
    socket.on('error-msg', onErrorMsg)
    socket.on('debater-presence', onDebaterPresence)
    socket.on('ai-cooldown-tick', onAiCooldownTick)
    socket.on('ai-cooldown-ended', onAiCooldownEnded)

    return () => {
      socket.emit('leave-room', roomId)
      socket.off('room-state', onRoomState)
      socket.off('timer-tick', onTimerTick)
      socket.off('timer-expired', onTimerExpired)
      socket.off('scoring-in-progress', onScoringInProgress)
      socket.off('argument-scored', onArgumentScored)
      socket.off('turn-changed', onTurnChanged)
      socket.off('debate-finished', onDebateFinished)
      socket.off('vote-updated', onVoteUpdated)
      socket.off('spectator-count', onSpectatorCount)
      socket.off('ai-thinking', onAiThinking)
      socket.off('error-msg', onErrorMsg)
      socket.off('debater-presence', onDebaterPresence)
      socket.off('ai-cooldown-tick', onAiCooldownTick)
      socket.off('ai-cooldown-ended', onAiCooldownEnded)
      reset()
    }
  }, [socket, roomId]) // eslint-disable-line react-hooks/exhaustive-deps

  // --- Actions ---
  const submitArgument = useCallback((text) => {
    if (socket) socket.emit('submit-argument', { roomId, text })
  }, [socket, roomId])

  const startTimer = useCallback(() => {
    if (socket) socket.emit('start-timer', roomId)
  }, [socket, roomId])

  const castVote = useCallback((side) => {
    if (socket) socket.emit('audience-vote', { roomId, side })
  }, [socket, roomId])

  const forfeit = useCallback(() => {
    if (socket) socket.emit('forfeit-debate', { roomId })
  }, [socket, roomId])

  return {
    room,
    arguments: args,
    isMyTurn,
    mySide,
    isSpectator,
    timerSeconds,
    scoringInProgress,
    debateFinished,
    aiThinking,
    forVotes,
    againstVotes,
    spectatorCount,
    errorMsg,
    debaterPresence,
    aiCooldown,
    submitArgument,
    startTimer,
    castVote,
    forfeit,
  }
}
