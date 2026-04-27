import { useState, useEffect, useRef } from 'react'

export default function SettingsPanel({ open, onClose, user, signInWithEmail, signInWithGoogle, signOut }) {
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
              You're in guest mode. Sign in to sync across devices and keep your data permanently.
            </p>

            {/* Google Sign-In */}
            <button
              onClick={signInWithGoogle}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text-1)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginBottom: 14,
                fontFamily: 'inherit',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              Continue with Google
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: 11, color: 'var(--text-2)' }}>or</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

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

        <a
          href="https://planyourweek.featurebase.app"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block',
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
            textAlign: 'center',
            textDecoration: 'none',
            boxSizing: 'border-box',
          }}
        >
          Send feedback
        </a>

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
            marginTop: 6,
          }}
        >
          Close
        </button>
      </div>

    </>
  )
}
