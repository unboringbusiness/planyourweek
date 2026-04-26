import { useState, useEffect, useRef } from 'react'
import { LIMITS } from '../../lib/limits'

export default function DumpPanel({ open, onClose, dump }) {
  const [inputVal, setInputVal] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setError('')
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [open])

  const handleAdd = async () => {
    const trimmed = inputVal.trim()
    if (!trimmed) return
    const { error: err } = await dump.addItem(trimmed)
    if (err) { setError(err); return }
    setInputVal('')
    setError('')
  }

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', zIndex: 200 }}
        />
      )}

      <div style={{
        position: 'fixed', top: 0, right: 0, height: '100%', width: 360,
        background: 'var(--bg)', borderLeft: '1px solid var(--border)',
        zIndex: 201, display: 'flex', flexDirection: 'column',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
        boxShadow: open ? '-8px 0 32px rgba(0,0,0,0.12)' : 'none',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 18px 14px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)' }}>
              Brain Dump
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 1 }}>
              Your someday/maybe list · {dump.count} items
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: '1px solid var(--border)', borderRadius: 7,
              width: 30, height: 30, display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: 'var(--text-2)', fontSize: 16, cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        {/* Add input */}
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 7 }}>
            <input
              ref={inputRef}
              style={{
                flex: 1, padding: '8px 11px', borderRadius: 9,
                border: '1px solid var(--border)', background: 'var(--surface)',
                fontSize: 13, color: 'var(--text-1)', outline: 'none', fontFamily: 'inherit',
              }}
              placeholder="Capture a thought…"
              value={inputVal}
              onChange={e => { setInputVal(e.target.value); setError('') }}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAdd()
                if (e.key === 'Escape') onClose()
              }}
              disabled={dump.isFull}
              maxLength={300}
            />
            <button
              onClick={handleAdd}
              disabled={dump.isFull}
              style={{
                background: dump.isFull ? 'var(--border)' : 'var(--accent)',
                border: 'none', borderRadius: 9, width: 34, height: 34,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 20, flexShrink: 0,
                cursor: dump.isFull ? 'not-allowed' : 'pointer',
              }}
            >
              +
            </button>
          </div>
          {error && <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 5 }}>{error}</div>}
          {dump.isFull && (
            <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 5 }}>
              Dump full ({LIMITS.DUMP_MAX} items). Process some items before adding more.
            </div>
          )}
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
          {dump.items.length === 0 ? (
            <div style={{
              padding: '32px 16px', textAlign: 'center',
              color: 'var(--text-2)', fontSize: 13, lineHeight: 1.6,
            }}>
              Empty dump. Capture anything on your mind — no filter, no judgment.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {dump.items.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                    borderRadius: 9, background: 'var(--surface)', border: '1px solid var(--border)',
                  }}
                >
                  <span style={{
                    flex: 1, fontSize: 13, color: 'var(--text-1)',
                    lineHeight: 1.4, wordBreak: 'break-word',
                  }}>
                    {item.text}
                  </span>
                  <button
                    onClick={() => dump.removeItem(item.id)}
                    style={{
                      background: 'none', border: 'none', color: 'var(--text-2)',
                      fontSize: 15, padding: '0 3px', cursor: 'pointer',
                      flexShrink: 0, lineHeight: 1,
                    }}
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
