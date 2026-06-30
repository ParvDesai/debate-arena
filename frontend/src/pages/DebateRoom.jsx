import { useParams } from 'react-router-dom'
import { useMemo, useState, useEffect } from 'react'
import useDebateRoom from '../hooks/useDebateRoom'
import Navbar from '../components/shared/Navbar'
import ScoreHeader from '../components/debate/ScoreHeader'
import TurnIndicator from '../components/debate/TurnIndicator'
import CountdownTimer from '../components/debate/CountdownTimer'
import ArgumentFeed from '../components/debate/ArgumentFeed'
import ArgumentInput from '../components/debate/ArgumentInput'
import AudienceVoteBar from '../components/debate/AudienceVoteBar'
import SpectatorBadge from '../components/debate/SpectatorBadge'
import VictoryOverlay from '../components/debate/VictoryOverlay'
import './DebateRoom.css'

export default function DebateRoom() {
  const { id: roomId } = useParams()
  const {
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
  } = useDebateRoom(roomId)

  // Calculate live scores
  const { forScore, againstScore } = useMemo(() => {
    const forTotal = args.filter(a => a.side === 'for').reduce((s, a) => s + (a.aiScore?.total || 0), 0)
    const againstTotal = args.filter(a => a.side === 'against').reduce((s, a) => s + (a.aiScore?.total || 0), 0)
    return { forScore: forTotal, againstScore: againstTotal }
  }, [args])

  const [inputText, setInputText] = useState('')

  // Auto-submit when timer expires
  useEffect(() => {
    if (timerSeconds === 0 && isMyTurn && inputText.trim()) {
      submitArgument(inputText.trim())
      setInputText('')
    }
  }, [timerSeconds, isMyTurn, inputText, submitArgument])

  if (!room) {
    return (
      <div className="debate-loading">
        <Navbar />
        <div className="loading-center">
          <div className="shimmer-bg" style={{ width: 60, height: 60, borderRadius: '50%' }} />
          <p>Entering the arena...</p>
        </div>
      </div>
    )
  }

  const isActive = room.status === 'active'
  const isFinished = room.status === 'finished'

  const showPaused = isActive && !room.isSoloMode && !debaterPresence?.bothPresent
  const missingDebater = !debaterPresence?.forPresent
    ? (room.debaterFor?.username || 'Opponent 1')
    : !debaterPresence?.againstPresent
      ? (room.debaterAgainst?.username || 'Opponent 2')
      : ''

  return (
    <div className="debate-page">
      <Navbar />

      <div className="debate-content">
        {/* Zone 1 — Top Bar */}
        <div className="debate-top-bar">
          <div className="top-bar-main">
            <ScoreHeader
              topic={room.topic}
              forScore={forScore}
              againstScore={againstScore}
            />

            {isActive && (
              <TurnIndicator
                currentTurn={room.currentTurn}
                turnNumber={room.turnNumber}
                maxTurns={room.maxTurns}
                isMyTurn={isMyTurn}
                mySide={mySide}
              />
            )}
          </div>

          <div className="top-bar-side">
            {isActive && !showPaused && aiCooldown === 0 && <CountdownTimer seconds={timerSeconds} />}
            <SpectatorBadge count={spectatorCount} />
            {isActive && !isSpectator && (
              <button className="btn btn-danger btn-sm" onClick={forfeit}>
                FORFEIT
              </button>
            )}
          </div>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="debate-error">{errorMsg}</div>
        )}

        {showPaused && (
          <div className="debate-paused-overlay">
            <div className="paused-icon">⏳</div>
            <h2 className="paused-title">ARENA PAUSED</h2>
            <p className="paused-text">
              Waiting for <strong>{missingDebater}</strong> to enter the arena...
            </p>
          </div>
        )}

        {/* Zone 2 — Argument Feed */}
        <div className="debate-feed-wrapper">
          <ArgumentFeed
            arguments={args}
            scoringInProgress={scoringInProgress}
            aiThinking={aiThinking}
            currentTurn={room.currentTurn}
            forName={room.debaterFor?.username || (room.isSoloMode ? '🤖 AI Opponent' : null)}
            againstName={room.debaterAgainst?.username || (room.isSoloMode ? '🤖 AI Opponent' : null)}
            mySide={mySide}
          />
        </div>

        {/* AI Cooldown Banner (Solo Mode) */}
        {aiCooldown > 0 && (
          <div className="ai-cooldown-banner">
            <div className="cooldown-icon">📖</div>
            <div className="cooldown-text">
              <strong>Read the AI's argument</strong>
              <span>Your turn starts in <span className="cooldown-seconds">{aiCooldown}s</span></span>
            </div>
            <div className="cooldown-progress">
              <div
                className="cooldown-bar"
                style={{ width: `${(aiCooldown / 15) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Zone 3 — Bottom Input */}
        <div className="debate-bottom">
          {isActive && !isSpectator ? (
            <ArgumentInput
              onSubmit={submitArgument}
              disabled={!isMyTurn || scoringInProgress || showPaused || aiCooldown > 0}
              isReading={aiCooldown > 0}
              onFocus={startTimer}
              text={inputText}
              setText={setInputText}
            />
          ) : isActive && isSpectator ? (
            <AudienceVoteBar
              forVotes={forVotes}
              againstVotes={againstVotes}
              onVote={castVote}
            />
          ) : isFinished && !debateFinished ? (
            <div className="debate-ended-banner">
              <span>This debate has concluded.</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Victory Overlay */}
      {debateFinished && (
        <VictoryOverlay
          data={debateFinished}
          forVotes={forVotes}
          againstVotes={againstVotes}
        />
      )}
    </div>
  )
}
