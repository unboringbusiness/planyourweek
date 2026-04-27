import { useState } from 'react'

export default function DumpScreen({ onDone, dump }) {
  const [text, setText] = useState('')
  const [items, setItems] = useState(dump.items)
  const [adding, setAdding] = useState(false)
  const [newItem, setNewItem] = useState('')

  const handleDone = async () => {
    // Parse textarea: one item per non-empty line
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    for (const line of lines) {
      await dump.addItem(line)
    }
    onDone()
  }

  const handleAddItem = async () => {
    const trimmed = newItem.trim()
    if (!trimmed) return
    const { data } = await dump.addItem(trimmed)
    if (data) setItems(prev => [...prev, data])
    setNewItem('')
    setAdding(false)
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '60px 24px 40px',
      background: 'var(--bg)',
      overflowY: 'auto',
    }}>
      <div style={{ width: '100%', maxWidth: 640 }}>
        <div style={{
          marginBottom: 8,
          fontSize: 28,
          fontWeight: 600,
          color: 'var(--text-1)',
          lineHeight: 1.2,
        }}>
          What's on your mind?
        </div>
        <p style={{
          fontSize: 15,
          color: 'var(--text-2)',
          marginBottom: 28,
          lineHeight: 1.6,
        }}>
          Type anything. One thought per line. No filter. This is your brain dump — everything lives here until you decide what to do with it.
        </p>

        {/* Rapid capture textarea */}
        <textarea
          autoFocus
          style={{
            width: '100%',
            minHeight: 220,
            padding: '14px 16px',
            borderRadius: 14,
            border: '1.5px solid var(--border)',
            background: 'var(--surface)',
            fontSize: 15,
            color: 'var(--text-1)',
            lineHeight: 1.7,
            outline: 'none',
            resize: 'vertical',
            fontFamily: 'inherit',
            marginBottom: 16,
          }}
          placeholder="Fix the landing page copy&#10;Research competitor pricing&#10;Call accountant about Q1&#10;Learn about YNAB&#10;…"
          value={text}
          onChange={e => setText(e.target.value)}
        />

        {/* Existing items */}
        {dump.items.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-2)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 8,
            }}>
              Already in your dump ({dump.items.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {dump.items.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '7px 10px',
                    borderRadius: 8,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    fontSize: 13,
                    color: 'var(--text-1)',
                  }}
                >
                  <span style={{ flex: 1 }}>{item.text}</span>
                  <button
                    onClick={() => dump.removeItem(item.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-2)',
                      fontSize: 14,
                      padding: '0 2px',
                      cursor: 'pointer',
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Done button */}
        <button
          onClick={handleDone}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: 12,
            border: 'none',
            background: 'var(--text-1)',
            color: 'var(--bg)',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'opacity 0.15s',
            marginTop: 4,
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          Done dumping. Plan my week. →
        </button>

        <p style={{
          marginTop: 16,
          fontSize: 12,
          color: 'var(--text-2)',
          textAlign: 'center',
          lineHeight: 1.5,
        }}>
          Based on <em>Four Thousand Weeks</em> by Oliver Burkeman. You can't do everything.
          <br />The dump is your someday list — plan your week from there.
        </p>
      </div>
    </div>
  )
}
