import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'

function CopyBtn({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 3000) }}
      style={{
        padding: '6px 14px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 600,
        background: copied ? '#10B981' : 'var(--accent)', color: '#fff',
        cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
      }}
    >
      {copied ? 'Copied' : label}
    </button>
  )
}

function Accordion({ title, defaultOpen, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10, marginBottom: 8, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', padding: '12px 14px', background: 'var(--surface)', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: 13, fontWeight: 600, color: 'var(--text-1)', cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        {title}
        <span style={{ fontSize: 11, color: 'var(--text-2)', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>&#9654;</span>
      </button>
      {open && <div style={{ padding: '0 14px 14px', fontSize: 12, color: 'var(--text-2)', lineHeight: 1.7 }}>{children}</div>}
    </div>
  )
}

function ConnectToClaude({ user }) {
  const [connectionUrl, setConnectionUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null) // { connected, last_used_at }
  const [urlCopied, setUrlCopied] = useState(false)
  const [testResult, setTestResult] = useState(null) // null | 'loading' | 'ok' | 'error'

  // Check existing connection status on mount
  useEffect(() => {
    if (!user) return
    ;(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return
        const res = await fetch('/api/auth/status', {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        })
        const data = await res.json()
        setStatus(data)
      } catch {}
    })()
  }, [user])

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/auth/generate-key', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (data.api_key) {
        const url = `https://app.planyourweek.co/api/mcp?key=${data.api_key}`
        setConnectionUrl(url)
        setStatus({ has_key: true, connected: false })
      }
    } catch (e) { console.error('Key generation failed:', e) }
    setLoading(false)
  }

  const handleTest = async () => {
    if (!connectionUrl) return
    setTestResult('loading')
    try {
      const res = await fetch(connectionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'test', version: '1.0' } } }),
      })
      const data = await res.json()
      setTestResult(data?.result?.serverInfo ? 'ok' : 'error')
    } catch { setTestResult('error') }
  }

  const cliCmd = connectionUrl
    ? `claude mcp add planyourweek ${connectionUrl}`
    : null

  const desktopJson = connectionUrl
    ? `"planyourweek": {\n  "url": "${connectionUrl}"\n}`
    : null

  return (
    <div style={{ marginTop: 20, marginBottom: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>Connect to Claude</div>
      <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 14, lineHeight: 1.5 }}>
        Let Claude manage your week. Say "add a task for Tuesday" or "what's on my plate this week?"
      </p>

      {/* Generate / show URL */}
      {connectionUrl ? (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', marginBottom: 6 }}>Your connection URL</div>
          <div style={{
            padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 8,
            fontSize: 10, fontFamily: 'monospace', color: 'var(--text-1)',
            wordBreak: 'break-all', lineHeight: 1.5, marginBottom: 6,
            border: urlCopied ? '1px solid #10B981' : '1px solid transparent',
          }}>
            {connectionUrl}
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <button
              onClick={() => { navigator.clipboard.writeText(connectionUrl); setUrlCopied(true) }}
              style={{
                flex: 1, padding: '9px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600,
                background: urlCopied ? '#10B981' : 'var(--accent)', color: '#fff',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {urlCopied ? 'Copied' : 'Copy URL'}
            </button>
            <button
              onClick={handleTest}
              disabled={testResult === 'loading'}
              style={{
                flex: 1, padding: '9px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                border: '1px solid var(--border)', background: 'var(--surface)',
                color: testResult === 'ok' ? '#10B981' : testResult === 'error' ? '#EF4444' : 'var(--text-1)',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {testResult === 'loading' ? 'Testing...'
                : testResult === 'ok' ? 'Server is reachable'
                : testResult === 'error' ? 'Something went wrong'
                : 'Test connection'}
            </button>
          </div>
          <button
            onClick={handleGenerate}
            style={{ background: 'none', border: 'none', fontSize: 11, color: 'var(--text-2)', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontFamily: 'inherit' }}
          >
            Regenerate key (old one stops working)
          </button>
        </div>
      ) : (
        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{
            width: '100%', padding: '14px', borderRadius: 10, border: 'none',
            background: 'var(--accent)', color: '#fff',
            fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            marginBottom: 16, opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Generating...' : 'Generate my connection'}
        </button>
      )}

      {/* Platform instructions */}
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>
        Now paste it into Claude
      </div>

      <Accordion title="claude.ai (web)" defaultOpen={true}>
        <div style={{ marginTop: 8 }}>
          <div style={{
            padding: '8px 10px', borderRadius: 6, marginBottom: 12,
            background: 'color-mix(in srgb, #F59E0B 10%, var(--surface))',
            border: '1px solid color-mix(in srgb, #F59E0B 30%, var(--border))',
            fontSize: 11, color: '#92400E', lineHeight: 1.5,
          }}>
            Custom connectors require a paid Claude plan (Pro, Max, Team, or Enterprise). Free plans cannot add custom connectors.
          </div>
          <p><strong style={{ color: 'var(--text-1)' }}>1.</strong> Go to <strong>claude.ai</strong> and sign in (requires Pro, Max, Team, or Enterprise plan)</p>
          <p><strong style={{ color: 'var(--text-1)' }}>2.</strong> Click your <strong>profile icon</strong> (bottom-left)</p>
          <p><strong style={{ color: 'var(--text-1)' }}>3.</strong> Click <strong>Settings</strong></p>
          <p><strong style={{ color: 'var(--text-1)' }}>4.</strong> Click <strong>Connectors</strong> in the sidebar</p>
          <p><strong style={{ color: 'var(--text-1)' }}>5.</strong> Scroll to "Custom connectors" and click <strong>Add custom connector</strong></p>
          <p><strong style={{ color: 'var(--text-1)' }}>6.</strong> Paste the connection URL from above into the <strong>URL field</strong></p>
          <p><strong style={{ color: 'var(--text-1)' }}>7.</strong> Give it a name like <strong>"Plan Your Week"</strong></p>
          <p><strong style={{ color: 'var(--text-1)' }}>8.</strong> Click <strong>Add</strong></p>
          <p style={{ marginTop: 8, color: 'var(--text-1)', fontSize: 12 }}>
            Done. Open a <strong>new chat</strong> and try: <em>"What's on my week?"</em>
          </p>
        </div>
      </Accordion>

      <Accordion title="Claude Desktop App" defaultOpen={false}>
        <div style={{ marginTop: 8 }}>
          <p><strong style={{ color: 'var(--text-1)' }}>1.</strong> Open <strong>Claude Desktop</strong></p>
          <p><strong style={{ color: 'var(--text-1)' }}>2.</strong> Click <strong>Settings</strong> (gear icon)</p>
          <p><strong style={{ color: 'var(--text-1)' }}>3.</strong> Click <strong>Developer</strong></p>
          <p><strong style={{ color: 'var(--text-1)' }}>4.</strong> Click <strong>Edit Config</strong></p>
          <p style={{ marginBottom: 6 }}><strong style={{ color: 'var(--text-1)' }}>5.</strong> Add this inside the <code style={{ fontSize: 11, background: 'var(--surface-2)', padding: '1px 4px', borderRadius: 3 }}>mcpServers</code> section:</p>
          {desktopJson && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 8 }}>
              <pre style={{
                flex: 1, margin: 0, padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 8,
                fontSize: 10, fontFamily: 'monospace', color: 'var(--text-1)',
                whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: 1.5,
              }}>{desktopJson}</pre>
              <CopyBtn text={desktopJson} />
            </div>
          )}
          <p><strong style={{ color: 'var(--text-1)' }}>6.</strong> Save the file and <strong>restart Claude Desktop</strong></p>
        </div>
      </Accordion>

      <Accordion title="Claude Code (terminal)" defaultOpen={false}>
        <div style={{ marginTop: 8 }}>
          <p><strong style={{ color: 'var(--text-1)' }}>1.</strong> Open your terminal</p>
          <p style={{ marginBottom: 6 }}><strong style={{ color: 'var(--text-1)' }}>2.</strong> Run this command:</p>
          {cliCmd && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 8 }}>
              <code style={{
                flex: 1, padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 8,
                fontSize: 10, fontFamily: 'monospace', color: 'var(--text-1)',
                wordBreak: 'break-all', lineHeight: 1.5, display: 'block',
              }}>{cliCmd}</code>
              <CopyBtn text={cliCmd} />
            </div>
          )}
          <p><strong style={{ color: 'var(--text-1)' }}>3.</strong> <strong>Restart Claude Code</strong>. Done.</p>
        </div>
      </Accordion>

      {/* Connection status */}
      <div style={{
        marginTop: 12, padding: '10px 14px', borderRadius: 8,
        background: status?.connected
          ? 'color-mix(in srgb, #10B981 10%, var(--surface))'
          : 'var(--surface-2)',
        border: status?.connected ? '1px solid #10B981' : '1px solid var(--border)',
        fontSize: 12, color: status?.connected ? '#10B981' : 'var(--text-2)',
        fontWeight: 500,
      }}>
        {status?.connected
          ? `Connected — last used ${new Date(status.last_used_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`
          : status?.has_key
            ? 'Key generated — waiting for first connection...'
            : 'Not connected yet'
        }
      </div>

      {/* Troubleshooting */}
      <Accordion title="Troubleshooting" defaultOpen={false}>
        <div style={{ marginTop: 8 }}>
          <p style={{ marginBottom: 12 }}>
            <strong style={{ color: 'var(--text-1)' }}>I don't see Connectors in claude.ai Settings</strong><br/>
            You're on the Free plan. Custom connectors require Claude Pro, Max, Team, or Enterprise. Upgrade your plan at claude.ai.
          </p>
          <p style={{ marginBottom: 12 }}>
            <strong style={{ color: 'var(--text-1)' }}>It says connector added but Claude doesn't use it</strong><br/>
            Start a new chat. Existing chats don't auto-load new connectors. You need to open a fresh conversation.
          </p>
          <p>
            <strong style={{ color: 'var(--text-1)' }}>Claude says it can't find my tasks</strong><br/>
            Click "Regenerate key" above and reconnect with the new URL. The old key may be stale.
          </p>
        </div>
      </Accordion>
    </div>
  )
}

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
        maxHeight: '85vh',
        overflowY: 'auto',
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

            <ConnectToClaude user={user} />

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
                  {loading ? 'Sending...' : 'Send magic link'}
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

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 8 }}>
          <a href="/privacy" style={{ fontSize: 11, color: 'var(--text-2)', textDecoration: 'none' }}>Privacy Policy</a>
          <span style={{ fontSize: 11, color: 'var(--border)' }}>|</span>
          <a href="/terms" style={{ fontSize: 11, color: 'var(--text-2)', textDecoration: 'none' }}>Terms of Service</a>
        </div>

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
