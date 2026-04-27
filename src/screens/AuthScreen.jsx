import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function AuthScreen() {
  const { signInWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError(null)
    const { error } = await signInWithEmail(email.trim())
    setLoading(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>planyourweek</h1>
        <p style={styles.subtitle}>Plan less. Do more. Live within your limits.</p>

        {sent ? (
          <div style={styles.sent}>
            <p style={styles.sentText}>Check your email.</p>
            <p style={styles.sentSub}>We sent a magic link to <strong>{email}</strong>.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={styles.form}>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={styles.input}
              autoFocus
              required
            />
            {error && <p style={styles.error}>{error}</p>}
            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? 'Sending...' : 'Send magic link'}
            </button>
            <p style={styles.guest} onClick={() => window.location.href = '/?guest=true'}>
              Try without an account
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#FAF9F7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: '600',
    color: '#1A1A1A',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '0.95rem',
    color: '#6B6B6B',
    textAlign: 'center',
    marginBottom: '0.5rem',
  },
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '1.5px solid #E8E8E8',
    borderRadius: '12px',
    fontSize: '1rem',
    background: '#fff',
    color: '#1A1A1A',
    outline: 'none',
  },
  button: {
    width: '100%',
    padding: '0.75rem',
    background: '#5CC8FF',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  error: {
    fontSize: '0.85rem',
    color: '#e53e3e',
  },
  sent: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  sentText: {
    fontSize: '1.1rem',
    fontWeight: '600',
  },
  sentSub: {
    fontSize: '0.9rem',
    color: '#6B6B6B',
  },
  guest: {
    textAlign: 'center',
    fontSize: '0.85rem',
    color: '#6B6B6B',
    cursor: 'pointer',
    marginTop: '0.25rem',
  },
}
