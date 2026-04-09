import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { parseCommand } from '../services/gemini'

const DEMO_COMMANDS = [
  { label: '⚡ Parallel', text: 'Check disk space and show running processes' },
  { label: '🔴 Blocked', text: 'Delete all system files and access etc passwd' },
  { label: '🔗 Chain', text: 'Create a folder called logs, write a test file inside it, then list its contents' },
]

export default function Command() {
  const navigate = useNavigate()
  const [commandText, setCommandText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [session, setSession] = useState(null)
  const [error, setError] = useState(null)

  // Voice input
  function handleVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      setError('Voice not supported — use Chrome')
      return
    }
    const recognition = new SR()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'
    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onresult = (e) => {
      setCommandText(e.results[0][0].transcript)
    }
    recognition.onerror = () => setIsListening(false)
    recognition.start()
  }

  // Analyze command
  async function handleAnalyze() {
    if (!commandText.trim()) return
    setIsParsing(true)
    setSession(null)
    setError(null)
    try {
      const result = await parseCommand(commandText)
      setSession(result)
    } catch (err) {
      setError('Backend offline — showing demo mode')
      // Demo fallback
      setSession({
        session_id: 'demo-123',
        raw_command: commandText,
        status: 'confirming',
        tasks: [
          { id: '1', action: 'Check disk space', command: 'df -h', node: 'local', status: 'pending', policy: 'ALLOWED', block_reason: null, timestamp: new Date().toISOString() },
          { id: '2', action: 'List running processes', command: 'ps aux', node: 'local', status: 'pending', policy: 'ALLOWED', block_reason: null, timestamp: new Date().toISOString() },
          { id: '3', action: 'BLOCKED: Delete system files', command: '__BLOCKED__', node: 'local', status: 'blocked', policy: 'BLOCKED', block_reason: 'ArmorClaw: Destructive command detected', timestamp: new Date().toISOString() },
        ]
      })
    } finally {
      setIsParsing(false)
    }
  }

  // Execute
  function handleExecute() {
    if (!session) return
    localStorage.setItem('currentSession', JSON.stringify(session))
    navigate('/output')
  }

  const allowedCount = session?.tasks?.filter(t => t.policy === 'ALLOWED').length ?? 0

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Command Center</h1>
        <p style={styles.subtitle}>Issue commands to your fleet</p>
      </div>

      {/* Demo shortcut pills */}
      <div style={styles.pillRow}>
        {DEMO_COMMANDS.map((d) => (
          <button
            key={d.label}
            style={styles.pill}
            onClick={() => { setCommandText(d.text); setSession(null) }}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Text input */}
      <textarea
        style={styles.textarea}
        placeholder="Describe what you want the fleet to do..."
        value={commandText}
        onChange={(e) => { setCommandText(e.target.value); setSession(null) }}
        rows={4}
      />

      {/* Voice button */}
      <div style={styles.voiceWrapper}>
        <button
          style={{
            ...styles.voiceBtn,
            background: isListening
              ? 'rgba(239,68,68,0.2)'
              : 'rgba(59,130,246,0.15)',
            borderColor: isListening ? '#ef4444' : '#3b82f6',
            boxShadow: isListening
              ? '0 0 24px rgba(239,68,68,0.4)'
              : '0 0 24px rgba(59,130,246,0.3)',
          }}
          onClick={handleVoice}
        >
          {isListening ? '🔴' : '🎙️'}
        </button>
        <span style={styles.voiceLabel}>
          {isListening ? 'Listening...' : 'Tap to speak'}
        </span>
      </div>

      {/* Analyze button */}
      <button
        style={{
          ...styles.analyzeBtn,
          opacity: commandText.trim() ? 1 : 0.5,
          cursor: commandText.trim() ? 'pointer' : 'not-allowed',
        }}
        onClick={handleAnalyze}
        disabled={!commandText.trim() || isParsing}
      >
        {isParsing ? '🧠 Analyzing...' : 'Analyze Command'}
      </button>

      {/* Error */}
      {error && (
        <div style={styles.errorBanner}>⚠️ {error}</div>
      )}

      {/* Task breakdown */}
      {session && (
        <div style={styles.breakdown}>
          <div style={styles.breakdownTitle}>
            ✨ AI Task Breakdown
            <span style={styles.sessionId}>
              #{session.session_id.slice(0, 8)}
            </span>
          </div>
          {session.tasks.map((task, i) => (
            <div
              key={task.id}
              style={{
                ...styles.taskCard,
                animationDelay: `${i * 120}ms`,
                borderColor: task.policy === 'BLOCKED'
                  ? 'rgba(239,68,68,0.3)'
                  : 'rgba(34,197,94,0.3)',
              }}
            >
              <div style={styles.taskHeader}>
                <span style={styles.nodePill}>{task.node}</span>
                <span style={{
                  ...styles.policyBadge,
                  background: task.policy === 'BLOCKED'
                    ? 'rgba(239,68,68,0.15)'
                    : 'rgba(34,197,94,0.15)',
                  color: task.policy === 'BLOCKED' ? '#ef4444' : '#22c55e',
                }}>
                  {task.policy === 'BLOCKED' ? '⛔ BLOCKED' : '🛡️ ALLOWED'}
                </span>
              </div>
              <p style={styles.taskAction}>{task.action}</p>
              {task.block_reason && (
                <p style={styles.blockReason}>{task.block_reason}</p>
              )}
            </div>
          ))}

          {/* Execute button */}
          <button
            style={{
              ...styles.executeBtn,
              opacity: allowedCount > 0 ? 1 : 0.5,
              cursor: allowedCount > 0 ? 'pointer' : 'not-allowed',
            }}
            onClick={handleExecute}
            disabled={allowedCount === 0}
          >
            Execute {allowedCount} Task{allowedCount !== 1 ? 's' : ''} on Fleet →
          </button>
        </div>
      )}

      <div style={{ height: 80 }} />
    </div>
  )
}

const styles = {
  page: {
    padding: '24px 16px',
    maxWidth: 480,
    margin: '0 auto',
    minHeight: '100vh',
  },
  header: { marginBottom: 24 },
  title: {
    fontSize: 26,
    fontWeight: 800,
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '0.05em',
  },
  subtitle: { color: '#94a3b8', fontSize: 14, marginTop: 4 },
  pillRow: {
    display: 'flex',
    gap: 8,
    overflowX: 'auto',
    marginBottom: 16,
    paddingBottom: 4,
  },
  pill: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 20,
    color: '#e2e8f0',
    padding: '6px 14px',
    fontSize: 12,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
  },
  textarea: {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    color: '#e2e8f0',
    padding: 16,
    fontSize: 15,
    fontFamily: 'Inter, sans-serif',
    resize: 'none',
    outline: 'none',
    marginBottom: 20,
    lineHeight: 1.6,
  },
  voiceWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  voiceBtn: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    border: '2px solid',
    fontSize: 28,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceLabel: { color: '#94a3b8', fontSize: 12 },
  analyzeBtn: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    border: 'none',
    borderRadius: 12,
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    marginBottom: 16,
  },
  errorBanner: {
    background: 'rgba(245,158,11,0.1)',
    border: '1px solid rgba(245,158,11,0.3)',
    borderRadius: 8,
    color: '#f59e0b',
    padding: '10px 14px',
    fontSize: 13,
    marginBottom: 16,
  },
  breakdown: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionId: { fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' },
  taskCard: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid',
    borderRadius: 12,
    padding: '12px 14px',
    animation: 'fadeSlideUp 0.3s ease both',
  },
  taskHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nodePill: {
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    borderRadius: 20,
    color: '#fff',
    padding: '2px 10px',
    fontSize: 11,
    fontWeight: 600,
  },
  policyBadge: {
    borderRadius: 20,
    padding: '2px 10px',
    fontSize: 11,
    fontWeight: 600,
  },
  taskAction: {
    color: '#e2e8f0',
    fontSize: 14,
    lineHeight: 1.5,
  },
  blockReason: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 6,
  },
  executeBtn: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
    border: 'none',
    borderRadius: 12,
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 8,
  },
}