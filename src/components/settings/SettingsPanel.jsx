import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'

const PLATFORMS = [
  { id: 'web', label: 'claude.ai', icon: '🌐' },
  { id: 'desktop', label: 'Desktop App', icon: '🖥' },
  { id: 'code', label: 'Claude Code', icon: '>' },
]

function StepBadge({ n, done }) {
  return (
    <div style={{
      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
      background: done ? '#10B981' : 'var(--accent)',
      color: '#fff', fontSize: 11, fontWeight: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {done ? '✓' : n}
    </div>
  )
}

function CopyBlock({ text, onCopy, copied, label }) {
  return (
    <div style={{ marginBottom: 8 }}>
      {label && <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 4 }}>{label}</div>}
      <div
        onClick={onCopy}
        style={{
          padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 8,
          fontSize: 11, fontFamily: 'monospace', color: 'var(--text-1)',
          wordBreak: 'break-all', cursor: 'pointer', lineHeight: 1.5,
          border: copied ? '1px solid #10B981' : '1px solid transparent',
          position: 'relative',
        }}
      >
        {text}
        <span style={{
          position: 'absolute', top: 6, right: 8,
          fontSize: 10, color: copied ? '#10B981' : 'var(--text-2)',
          fontFamily: 'inherit',
        }}>
          {copied ? 'copied' : 'click to copy'}
        </span>
      </div>
    </div>
  )
}

function ClaudeSetup({ apiKey, apiKeyCopied, apiKeyLoading, onGenerate, onCopy }) {
  const [platform, setPlatform] = useState('web')
  const [urlCopied, setUrlCopied] = useState(false)
  const [configCopied, setConfigCopied] = useState(false)

  const keyDisplay = apiKey || 'YOUR_API_KEY'

  const configJson = JSON.stringify({
    mcpServers: {
      planyourweek: {
        command: 'npx',
        args: ['planyourweek-mcp'],
        env: { PYW_API_KEY: keyDisplay },
      },
    },
  }, null, 2)

  return (
    <div style={{ marginTop: 20, marginBottom: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>Connect to Claude</div>
      <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 16, lineHeight: 1.5 }}>
        3 steps. Takes 2 minutes. Then just tell Claude what to plan.
      </p>

      {/* Step 1 */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <StepBadge n={1} done={!!apiKey} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 6 }}>Generate your secret key</div>
          {apiKey ? (
            <>
              <div style={{
                padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 8,
                fontSize: 11, fontFamily: 'monospace', color: 'var(--text-1)',
                wordBreak: 'break-all', marginBottom: 6, lineHeight: 1.5,
              }}>
                {apiKey}
              </div>
              <button
                onClick={onCopy}
                style={{
                  width: '100%', padding: '8px', borderRadius: 8,
                  border: apiKeyCopied ? '1px solid #10B981' : '1px solid var(--border)',
                  background: apiKeyCopied ? 'color-mix(in srgb, #10B981 10%, var(--surface))' : 'var(--surface)',
                  color: apiKeyCopied ? '#10B981' : 'var(--text-1)',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {apiKeyCopied ? '✓ Copied — save it somewhere safe' : 'Copy key'}
              </button>
              <p style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4, lineHeight: 1.4 }}>
                This key is shown once. If you lose it, generate a new one.
              </p>
            </>
          ) : (
            <>
              <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 8, lineHeight: 1.4 }}>
                This creates a private key that lets Claude access your planyourweek data. Only you can see it.
              </p>
              <button
                onClick={onGenerate}
                disabled={apiKeyLoading}
                style={{
                  width: '100%', padding: '10px', borderRadius: 8, border: 'none',
                  background: 'var(--accent)', color: '#fff',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  opacity: apiKeyLoading ? 0.6 : 1,
                }}
              >
                {apiKeyLoading ? 'Generating...' : 'Generate key'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Step 2 — pick platform */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <StepBadge n={2} done={false} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>Which Claude do you use?</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {PLATFORMS.map(p => (
              <button
                key={p.id}
                onClick={() => { setPlatform(p.id); setUrlCopied(false); setConfigCopied(false) }}
                style={{
                  flex: 1, padding: '8px 4px', borderRadius: 8,
                  border: platform === p.id ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                  background: platform === p.id ? 'color-mix(in srgb, var(--accent) 8%, var(--surface))' : 'var(--surface)',
                  color: platform === p.id ? 'var(--accent)' : 'var(--text-2)',
                  fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                }}
              >
                <span style={{ fontSize: 16 }}>{p.icon}</span>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Step 3 — platform-specific instructions */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
        <StepBadge n={3} done={false} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>Follow these steps</div>

          {platform === 'web' && (
            <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.7 }}>
              <div style={{ marginBottom: 10 }}>
                <strong style={{ color: 'var(--text-1)' }}>1.</strong> Open <strong>claude.ai</strong> and log in
              </div>
              <div style={{ marginBottom: 10 }}>
                <strong style={{ color: 'var(--text-1)' }}>2.</strong> Click your <strong>profile icon</strong> (bottom-left) → <strong>Settings</strong>
              </div>
              <div style={{ marginBottom: 10 }}>
                <strong style={{ color: 'var(--text-1)' }}>3.</strong> Go to <strong>Integrations</strong> tab
              </div>
              <div style={{ marginBottom: 10 }}>
                <strong style={{ color: 'var(--text-1)' }}>4.</strong> Click <strong>"Add Integration"</strong> → choose <strong>"MCP Server"</strong>
              </div>
              <div style={{ marginBottom: 10 }}>
                <strong style={{ color: 'var(--text-1)' }}>5.</strong> Paste this URL:
              </div>
              <CopyBlock
                text="https://app.planyourweek.co/api/mcp"
                onCopy={() => { navigator.clipboard.writeText('https://app.planyourweek.co/api/mcp'); setUrlCopied(true) }}
                copied={urlCopied}
              />
              <div style={{ marginBottom: 10 }}>
                <strong style={{ color: 'var(--text-1)' }}>6.</strong> In <strong>"Headers"</strong>, add:
              </div>
              <CopyBlock
                label="Name"
                text="Authorization"
                onCopy={() => navigator.clipboard.writeText('Authorization')}
                copied={false}
              />
              <CopyBlock
                label="Value"
                text={`Bearer ${keyDisplay}`}
                onCopy={() => { navigator.clipboard.writeText(`Bearer ${keyDisplay}`); setConfigCopied(true) }}
                copied={configCopied}
              />
              <div style={{ marginBottom: 6 }}>
                <strong style={{ color: 'var(--text-1)' }}>7.</strong> Click <strong>Save</strong>. Done!
              </div>
            </div>
          )}

          {platform === 'desktop' && (
            <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.7 }}>
              <div style={{ marginBottom: 10 }}>
                <strong style={{ color: 'var(--text-1)' }}>1.</strong> Open the <strong>Claude Desktop</strong> app
              </div>
              <div style={{ marginBottom: 10 }}>
                <strong style={{ color: 'var(--text-1)' }}>2.</strong> Go to <strong>Settings</strong> → <strong>Developer</strong>
              </div>
              <div style={{ marginBottom: 10 }}>
                <strong style={{ color: 'var(--text-1)' }}>3.</strong> Click <strong>"Edit Config"</strong>
              </div>
              <div style={{ marginBottom: 10 }}>
                <strong style={{ color: 'var(--text-1)' }}>4.</strong> Replace the file contents with this:
              </div>
              <CopyBlock
                text={configJson}
                onCopy={() => { navigator.clipboard.writeText(configJson); setConfigCopied(true) }}
                copied={configCopied}
              />
              <div style={{ marginBottom: 6 }}>
                <strong style={{ color: 'var(--text-1)' }}>5.</strong> Save the file and <strong>restart Claude</strong>. Done!
              </div>
            </div>
          )}

          {platform === 'code' && (
            <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.7 }}>
              <div style={{ marginBottom: 10 }}>
                <strong style={{ color: 'var(--text-1)' }}>1.</strong> Open your terminal
              </div>
              <div style={{ marginBottom: 10 }}>
                <strong style={{ color: 'var(--text-1)' }}>2.</strong> Create or edit the file <code style={{ fontSize: 11, background: 'var(--surface-2)', padding: '1px 4px', borderRadius: 4 }}>~/.mcp.json</code>
              </div>
              <div style={{ marginBottom: 10 }}>
                <strong style={{ color: 'var(--text-1)' }}>3.</strong> Paste this:
              </div>
              <CopyBlock
                text={configJson}
                onCopy={() => { navigator.clipboard.writeText(configJson); setConfigCopied(true) }}
                copied={configCopied}
              />
              <div style={{ marginBottom: 6 }}>
                <strong style={{ color: 'var(--text-1)' }}>4.</strong> Restart Claude Code. Done!
              </div>
            </div>
          )}

          {/* Try it prompt */}
          <div style={{
            marginTop: 12, padding: '10px 12px', borderRadius: 8,
            background: 'color-mix(in srgb, var(--accent) 8%, var(--surface))',
            border: '1px solid color-mix(in srgb, var(--accent) 20%, var(--border))',
            fontSize: 12, color: 'var(--text-1)', lineHeight: 1.5,
          }}>
            <strong>Try it:</strong> Tell Claude <em>"What's on my week?"</em> or <em>"Add 'Buy groceries' to Wednesday"</em>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPanel({ open, onClose, user, signInWithEmail, signInWithGoogle, signOut }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)
  const [apiKey, setApiKey] = useState(null)
  const [apiKeyLoading, setApiKeyLoading] = useState(false)
  const [apiKeyCopied, setApiKeyCopied] = useState(false)

  useEffect(() => {
    if (open && !user) setTimeout(() => inputRef.current?.focus(), 280)
    if (!open) { setSent(false); setError(''); setEmail(''); setApiKey(null); setApiKeyCopied(false) }
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
            {/* Claude Integration — step-by-step wizard */}
            <ClaudeSetup
              apiKey={apiKey}
              apiKeyCopied={apiKeyCopied}
              apiKeyLoading={apiKeyLoading}
              onGenerate={async () => {
                setApiKeyLoading(true)
                try {
                  const { data: { session } } = await supabase.auth.getSession()
                  const res = await fetch('/api/auth/generate-key', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
                  })
                  const data = await res.json()
                  if (data.api_key) setApiKey(data.api_key)
                } catch (e) { console.error('Failed to generate key:', e) }
                setApiKeyLoading(false)
              }}
              onCopy={() => { navigator.clipboard.writeText(apiKey); setApiKeyCopied(true) }}
            />

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
