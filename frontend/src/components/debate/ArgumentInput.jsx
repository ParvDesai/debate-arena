import './ArgumentInput.css'

const MAX_CHARS = 1500

export default function ArgumentInput({ onSubmit, disabled, onFocus, text, setText, isReading }) {
  const remaining = MAX_CHARS - text.length

  const handleSubmit = () => {
    if (!text.trim() || disabled) return
    onSubmit(text.trim())
    setText('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit()
    }
  }

  const placeholder = isReading
    ? '📖 Read the AI\'s argument — your turn starts soon...'
    : disabled
      ? 'Wait for your turn...'
      : 'Type your argument here... (Ctrl+Enter to submit)'

  return (
    <div className={`argument-input ${disabled ? 'input-disabled' : ''}`}>
      <textarea
        id="argument-textarea"
        className="arg-textarea"
        placeholder={placeholder}
        value={text}
        onChange={(e) => {
          if (e.target.value.length <= MAX_CHARS) setText(e.target.value)
        }}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        disabled={disabled}
        rows={3}
      />
      <div className="arg-input-footer">
        <span className={`char-count ${remaining < 100 ? 'char-warn' : ''}`}>
          {remaining} characters remaining
        </span>
        <button
          id="submit-argument-btn"
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={disabled || !text.trim()}
        >
          SUBMIT ARGUMENT
        </button>
      </div>
    </div>
  )
}
