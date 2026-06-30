import { useRef, useEffect } from 'react'
import ArgumentCard from './ArgumentCard'
import ScoringLoader from './ScoringLoader'
import './ArgumentFeed.css'

export default function ArgumentFeed({ arguments: args, scoringInProgress, aiThinking, currentTurn, forName, againstName, mySide }) {
  const forArgs = args.filter((a) => a.side === 'for')
  const againstArgs = args.filter((a) => a.side === 'against')
  const forEndRef = useRef(null)
  const againstEndRef = useRef(null)

  useEffect(() => {
    forEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [forArgs.length])

  useEffect(() => {
    againstEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [againstArgs.length])

  return (
    <div className="argument-feed">
      <div className="feed-column feed-for">
        <div className="column-header for-header">
          <span className="column-icon">🔥</span> FOR
          {forName && (
            <span className={`debater-name${mySide === 'for' ? ' debater-you' : ''}`}>
              {mySide === 'for' ? `${forName} (You)` : forName}
            </span>
          )}
        </div>
        <div className="column-body">
          {forArgs.map((arg, i) => (
            <ArgumentCard key={arg._id || i} argument={arg} index={i} />
          ))}
          {scoringInProgress && currentTurn === 'for' && <ScoringLoader side="for" />}
          {aiThinking && currentTurn === 'for' && (
            <div className="ai-thinking-card arg-for">
              <span className="ai-thinking-text">🤖 GEMINI IS FORMULATING...</span>
              <div className="ai-dots">
                <span /><span /><span />
              </div>
            </div>
          )}
          <div ref={forEndRef} />
        </div>
      </div>

      <div className="feed-divider" />

      <div className="feed-column feed-against">
        <div className="column-header against-header">
          <span className="column-icon">❄️</span> AGAINST
          {againstName && (
            <span className={`debater-name${mySide === 'against' ? ' debater-you' : ''}`}>
              {mySide === 'against' ? `${againstName} (You)` : againstName}
            </span>
          )}
        </div>
        <div className="column-body">
          {againstArgs.map((arg, i) => (
            <ArgumentCard key={arg._id || i} argument={arg} index={i} />
          ))}
          {scoringInProgress && currentTurn === 'against' && <ScoringLoader side="against" />}
          {aiThinking && currentTurn === 'against' && (
            <div className="ai-thinking-card arg-against">
              <span className="ai-thinking-text">🤖 GEMINI IS FORMULATING...</span>
              <div className="ai-dots">
                <span /><span /><span />
              </div>
            </div>
          )}
          <div ref={againstEndRef} />
        </div>
      </div>
    </div>
  )
}
