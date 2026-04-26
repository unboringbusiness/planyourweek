import { useState, useEffect, useRef } from 'react'
import { LIMITS } from '../../lib/limits'

export default function DumpPanel({ open, onClose, dump, onMoveToWeek }) {
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
        position: 'fixed', top: 0, right: 0, height: '100%', width: 400,
        background: 'var(--bg)', borderLeft: '1px solid var(--border)',
        zIndex: 201, display: 'flex', flexDirection: 'column',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
        boxShadow: open ? '-8px 0 32px rgba(0,0,0,0.12)' : 'none',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px 14px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
          background: 'var(--bg)',
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)' }}>
              Dump
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 1 }}>
              Everything that's not this week · {dump.count} items
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

        {/* Capture input */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{
            display: 'flex', gap: 8, alignItems: 'center',
            background: 'var(--surface)', borderRadius: 10,
            border: '1px solid var(--border)',
            padding: '8px 12px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          }}>
            <input
              ref={inputRef}
              style={{
                flex: 1, background: 'none', border: 'none',
                fontSize: 14, color: 'var(--text-1)', outline: 'none', fontFamily: 'inherit',
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
                border: 'none', borderRadius: 7, width: 28, height: 28,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 18, flexShrink: 0,
                cursor: dump.isFull ? 'not-allowed' : 'pointer',
              }}
            >
              +
            </button>
          </div>
          {error && <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 5 }}>{error}</div>}
          {dump.isFull && (
            <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 5 }}>
              Dump is full ({LIMITS.DUMP_MAX} items max). Move or delete some to add more.
            </div>
          )}
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 16px' }}>
          {dump.items.length === 0 ? (
            <div style={{
              padding: '60px 16px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 16, color: '#9CA3AF', marginBottom: 8 }}>Your mind is clear.</div>
              <div style={{ fontSize: 14, color: '#9CA3AF', lineHeight: 1.5 }}>
                Add anything here. Process it into your week when ready.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {dump.items.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                >
                  {/* Drag handle */}
                  <span style={{ color: '#D1D5DB', fontSize: 14, cursor: 'grab', flexShrink: 0, lineHeight: 1 }}>
                    ⠿
                  </span>
                  <span style={{
                    flex: 1, fontSize: 14, color: 'var(--text-1)',
                    lineHeight: 1.4, wordBreak: 'break-word',
                  }}>
                    {item.text}
                  </span>
                  <button
                    onClick={() => onMoveToWeek?.(item)}
                    title="Move to This Week"
                    style={{
                      background: 'none', border: 'none',
                      fontSize: 12, color: '#3B82F6', fontWeight: 500,
                      cursor: 'pointer', padding: '2px 4px', flexShrink: 0,
                      fontFamily: 'inherit', whiteSpace: 'nowrap',
                    }}
                  >
                    → This Week
                  </button>
                  <button
                    onClick={() => dump.removeItem(item.id)}
                    style={{
                      background: 'none', border: 'none', color: '#D1D5DB',
                      fontSize: 16, padding: '0 2px', cursor: 'pointer',
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
