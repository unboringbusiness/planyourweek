import { useState, useEffect, useRef } from 'react'

export default function SettingsPanel({ open, onClose, user, signInWithEmail, signOut }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (open && !user) setTimeout(() => inputRef.current?.focus(), 280)
    if (!open) { setSent(false); setError(''); setEmail('') }
  }, [open, user])

  const handleSignIn = async () => {
    if (!email.trim()) return
    setLoading(true)
    setError('')
    const { error: err } = await signInWithEmail(email.trim())
    setLoading(false)
    if (err) { setError(err.message ?? 'Something went wrong'); return }
    setSent(true)
  }

  const handleSignOut = async () => {
    await signOut()
    onClose()
  }

  return (
    <>
      {open && <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'var(--overlay)' }} />}

      <div style={{
        position: 'fixed',
        bottom: 0,
        right: 0,
        width: 360,
        borderRadius: '16px 16px 0 0',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderBottom: 'none',
        boxShadow: '0 -4px 32px rgba(0,0,0,0.12)',
        zIndex: 301,
        padding: '20px 24px 28px',
        transform: open ? 'translateY(0)' : 'translateY(110%)',
        transition: 'transform 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
      }}>
        <div style={{
          width: 36,
          height: 4,
          background: 'var(--border)',
          borderRadius: 2,
          margin: '0 auto 20px',
        }} />

        {user ? (
          <>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', marginBottom: 6 }}>Account</div>
            <div style={{
              padding: '8px 12px',
              background: 'var(--surface-2)',
              borderRadius: 8,
              fontSize: 13,
              color: 'var(--text-2)',
              marginBottom: 16,
              wordBreak: 'break-all',
            }}>
              {user.email}
            </div>
            <button
              onClick={handleSignOut}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: 10,
                border: 'none',
                background: 'var(--accent)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', marginBottom: 6 }}>Save your data</div>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 18, lineHeight: 1.6 }}>
              You're in guest mode. Sign in with a magic link to sync across devices and keep your data permanently.
            </p>

            {!sent ? (
              <>
                <input
                  ref={inputRef}
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  onKeyDown={e => { if (e.key === 'Enter') handleSignIn() }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    fontSize: 14,
                    color: 'var(--text-1)',
                    outline: 'none',
                    fontFamily: 'inherit',
                    marginBottom: 10,
                  }}
                />
                <button
                  onClick={handleSignIn}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '11px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'var(--accent)',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? 'Sending…' : 'Send magic link'}
                </button>
                {error && (
                  <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 8, textAlign: 'center' }}>
                    {error}
                  </div>
                )}
              </>
            ) : (
              <div style={{
                padding: '12px',
                borderRadius: 10,
                background: 'color-mix(in srgb, var(--success) 12%, var(--surface))',
                border: '1px solid var(--success)',
                fontSize: 13,
                color: 'var(--text-1)',
                textAlign: 'center',
                lineHeight: 1.5,
              }}>
                Check your inbox — link sent to <strong>{email}</strong>
              </div>
            )}
          </>
        )}

        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'none',
            color: 'var(--text-2)',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            marginTop: 10,
          }}
        >
          Close
        </button>
      </div>

    </>
  )
}
