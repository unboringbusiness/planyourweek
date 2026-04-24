import { useState, useEffect, useRef } from 'react'

const S = {
  trigger: {
    position: 'fixed',
    bottom: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: '#133950',
    border: 'none',
    color: '#FAF4ED',
    fontSize: 17,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    boxShadow: '0 2px 12px rgba(19,57,80,0.18)',
    cursor: 'pointer',
    transition: 'transform 0.15s',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 150,
    background: 'rgba(19,57,80,0.18)',
  },
  panel: (open) => ({
    position: 'fixed',
    bottom: 0,
    right: 0,
    width: 360,
    borderRadius: '16px 16px 0 0',
    background: '#FAF4ED',
    boxShadow: '0 -4px 32px rgba(19,57,80,0.14)',
    zIndex: 201,
    padding: 24,
    transform: open ? 'translateY(0)' : 'translateY(110%)',
    transition: 'transform 0.25s cubic-bezier(0.32,0.72,0,1)',
  }),
  handle: {
    width: 36,
    height: 4,
    background: '#D1C8BF',
    borderRadius: 2,
    margin: '0 auto 20px',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#133950',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B6B6B',
    marginBottom: 20,
    lineHeight: 1.5,
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 12,
    border: '1px solid #E5E0D8',
    background: '#fff',
    fontSize: 14,
    color: '#133950',
    outline: 'none',
    fontFamily: 'inherit',
    marginBottom: 10,
  },
  primaryBtn: {
    width: '100%',
    padding: '11px',
    borderRadius: 12,
    border: 'none',
    background: '#3B82F6',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.15s',
  },
  secondaryBtn: {
    width: '100%',
    padding: '11px',
    borderRadius: 12,
    border: '1px solid #E5E0D8',
    background: 'none',
    color: '#133950',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    marginTop: 8,
  },
  successMsg: {
    padding: '10px 12px',
    borderRadius: 10,
    background: '#D1FAE5',
    color: '#065F46',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
  },
  errorMsg: {
    padding: '10px 12px',
    borderRadius: 10,
    background: '#FEE2E2',
    color: '#991B1B',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
  },
  userInfo: {
    fontSize: 13,
    color: '#6B6B6B',
    marginBottom: 16,
    padding: '8px 12px',
    background: '#F5EFE8',
    borderRadius: 10,
    wordBreak: 'break-all',
  },
  divider: {
    height: 1,
    background: '#E5E0D8',
    margin: '20px 0',
  },
}

export default function SettingsPanel({ open, onClose, user, signInWithEmail, signOut }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (open && !user && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
    if (!open) { setSent(false); setError(''); setEmail('') }
  }, [open, user])

  const handleSignIn = async () => {
    if (!email.trim()) return
    setLoading(true)
    setError('')
    const { error: err } = await signInWithEmail(email.trim())
    setLoading(false)
    if (err) { setError(err.message ?? 'Failed to send link'); return }
    setSent(true)
  }

  const handleSignOut = async () => {
    await signOut()
    onClose()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSignIn()
    if (e.key === 'Escape') onClose()
  }

  return (
    <>
      {open && <div style={S.overlay} onClick={onClose} />}

      <div style={S.panel(open)}>
        <div style={S.handle} />

        {user ? (
          <>
            <div style={S.sectionTitle}>Account</div>
            <div style={S.userInfo}>Signed in as {user.email}</div>
            <button style={S.primaryBtn} onClick={handleSignOut}>Sign out</button>
          </>
        ) : (
          <>
            <div style={S.sectionTitle}>Save your data</div>
            <p style={S.subtitle}>
              You're currently in guest mode. Sign in with a magic link to sync your plan across devices.
            </p>

            {!sent ? (
              <>
                <input
                  ref={inputRef}
                  style={S.input}
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  onKeyDown={handleKeyDown}
                />
                <button
                  style={{ ...S.primaryBtn, opacity: loading ? 0.7 : 1 }}
                  onClick={handleSignIn}
                  disabled={loading}
                >
                  {loading ? 'Sending…' : 'Send magic link'}
                </button>
                {error && <div style={S.errorMsg}>{error}</div>}
              </>
            ) : (
              <div style={S.successMsg}>
                Check your inbox — we sent a magic link to {email}
              </div>
            )}
          </>
        )}

        <div style={S.divider} />
        <button style={S.secondaryBtn} onClick={onClose}>Close</button>
      </div>
    </>
  )
}
