import './ScoreHeader.css'

export default function ScoreHeader({ topic, forScore, againstScore }) {
  return (
    <div className="score-header glass">
      <div className="score-side score-for">
        <span className="score-label">FOR</span>
        <span className="score-value for-value">{forScore}</span>
      </div>

      <div className="score-topic">
        <span className="topic-label">TOPIC</span>
        <h2 className="topic-text">{topic}</h2>
      </div>

      <div className="score-side score-against">
        <span className="score-value against-value">{againstScore}</span>
        <span className="score-label">AGAINST</span>
      </div>
    </div>
  )
}
