import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/shared/Navbar'
import api from '../services/api'
import './SoloMode.css'

export default function SoloMode() {
  const [topics, setTopics] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [rounds, setRounds] = useState(3)
  const [stance, setStance] = useState('for')
  const navigate = useNavigate()

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const { data } = await api.get('/topics')
        setTopics(data.topics || [])
      } catch (err) {
        console.error('Failed to fetch topics:', err.message)
      }
    }
    fetchTopics()
  }, [])

  const filteredTopics = topics.filter((t) =>
    t.toLowerCase().includes(search.toLowerCase())
  )

  const handleChallenge = async (topic) => {
    setSelectedTopic(topic)
  }

  const startChallenge = async () => {
    if (!selectedTopic) return
    setLoading(true)
    try {
      const { data } = await api.post('/rooms/create', {
        topic: selectedTopic,
        isSoloMode: true,
        maxTurns: rounds,
        soloSide: stance,
      })
      setSelectedTopic(null)
      navigate(`/arena/${data.room._id}`)
    } catch (err) {
      console.error('Failed to create solo room:', err.message)
      setSelectedTopic(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="solo-page">
      <Navbar />
      <div className="solo-content">
        <div className="solo-header">
          <span className="solo-icon">🤖</span>
          <h1 className="solo-title gradient-text">CHALLENGE GEMINI</h1>
          <p className="solo-subtitle">
            Test your debate skills against an AI opponent powered by LLaMA 3.3
          </p>
        </div>

        <div className="solo-search-wrap">
          <input
            id="solo-search"
            type="text"
            className="input solo-search"
            placeholder="🔍 Search topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="solo-grid">
          {filteredTopics.map((topic, i) => (
            <div key={i} className="solo-topic-card card">
              <div className="stc-header">
                <span className="badge badge-live">
                  <span className="live-dot" /> TRENDING
                </span>
              </div>
              <h3 className="stc-topic">{topic}</h3>
              <button
                className="btn btn-primary stc-btn"
                onClick={() => handleChallenge(topic)}
                disabled={loading}
              >
                ⚔ CHALLENGE
              </button>
            </div>
          ))}
        </div>

        {filteredTopics.length === 0 && (
          <div className="solo-empty">
            <p>No topics match your search. Try a different keyword!</p>
          </div>
        )}

        {/* Rounds Selection Modal */}
        {selectedTopic && (
          <div className="modal-overlay" onClick={() => setSelectedTopic(null)}>
            <div className="modal-content glass-elevated" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">
                  <span>⚔</span> CONFIGURE BATTLE
                </h2>
                <button className="modal-close" onClick={() => setSelectedTopic(null)}>✕</button>
              </div>

              <div className="modal-body">
                {/* Stance Selector */}
                <p className="modal-section-label">Choose your side</p>
                <div className="stance-selector">
                  <button
                    className={`stance-btn stance-for${stance === 'for' ? ' stance-active' : ''}`}
                    onClick={() => setStance('for')}
                  >
                    <span className="stance-icon">🔥</span>
                    <span className="stance-label">FOR</span>
                    <span className="stance-desc">Support the topic</span>
                  </button>
                  <button
                    className={`stance-btn stance-against${stance === 'against' ? ' stance-active' : ''}`}
                    onClick={() => setStance('against')}
                  >
                    <span className="stance-icon">❄️</span>
                    <span className="stance-label">AGAINST</span>
                    <span className="stance-desc">Oppose the topic</span>
                  </button>
                </div>

                {/* Rounds Selector */}
                <p className="modal-section-label">Number of rounds</p>
                <div className="rounds-selector">
                  {[1, 2, 3, 5].map(num => (
                    <button
                      key={num}
                      onClick={() => setRounds(num)}
                      className={`round-btn${rounds === num ? ' round-active' : ''}`}
                    >
                      {num} {num === 1 ? 'Round' : 'Rounds'}
                    </button>
                  ))}
                </div>

                <button
                  onClick={startChallenge}
                  disabled={loading}
                  className="btn btn-primary auth-submit"
                  style={{ width: '100%' }}
                >
                  {loading ? 'STARTING...' : '🤖 START CHALLENGE'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
