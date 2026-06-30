import './AudienceVoteBar.css'

export default function AudienceVoteBar({ forVotes, againstVotes, onVote, disabled }) {
  const total = forVotes + againstVotes
  const forPct = total > 0 ? Math.round((forVotes / total) * 100) : 50
  const againstPct = 100 - forPct

  return (
    <div className="audience-vote-bar">
      <div className="vote-header">
        <span className="vote-title">AUDIENCE SENTIMENT</span>
        <span className="vote-total">{total} votes</span>
      </div>

      <div className="vote-bar-track">
        <div
          className="vote-bar-for"
          style={{ width: `${forPct}%` }}
        />
        <div
          className="vote-bar-against"
          style={{ width: `${againstPct}%` }}
        />
      </div>

      <div className="vote-labels">
        <span className="vote-label-for">FOR {forPct}%</span>
        <span className="vote-label-against">{againstPct}% AGAINST</span>
      </div>

      {!disabled && (
        <div className="vote-actions">
          <button className="btn btn-for" onClick={() => onVote('for')}>
            🔥 VOTE FOR
          </button>
          <button className="btn btn-against" onClick={() => onVote('against')}>
            ❄️ VOTE AGAINST
          </button>
        </div>
      )}
    </div>
  )
}
