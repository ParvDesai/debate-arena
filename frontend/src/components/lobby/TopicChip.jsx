import './TopicChip.css'

export default function TopicChip({ topic, onClick }) {
  return (
    <button className="topic-chip" onClick={onClick}>
      <span className="topic-chip-icon">🔥</span>
      <span className="topic-chip-text">{topic}</span>
    </button>
  )
}
