import './ScoringLoader.css'

export default function ScoringLoader({ side = 'for' }) {
  return (
    <div className={`scoring-loader ${side === 'for' ? 'loader-for' : 'loader-against'}`}>
      <div className="loader-bar shimmer-bg" />
      <span className="loader-text">AI JUDGING...</span>
    </div>
  )
}
