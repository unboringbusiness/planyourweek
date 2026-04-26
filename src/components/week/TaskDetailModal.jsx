import { useState, useEffect } from 'react'
import { formatDuration } from './TaskCard'

export default function TaskDetailModal({ task, meta = {}, onClose, onUpdate, onStartTimer }) {
  const [title, setTitle] = useState(meta.textOverride || task?.text || '')
  const [notes, setNotes] = useState(meta.notes || '')
  const [duration, setDuration] = useState(meta.duration ?? 30)

  useEffect(() => {
    const handleKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const save = () => {
    onUpdate?.({ textOverride: title, notes, duration })
    onClose()
  }

  const pct = Math.round((duration / 480) * 100)

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'var(--overlay)',
        zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)', borderRadius: 16,
          padding: '24px', width: 460, maxWidth: '95vw',
          boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
          display: 'flex', flexDirection: 'column', gap: 18,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') save() }}
            style={{
              flex: 1, fontSize: 16, fontWeight: 600, color: 'var(--text-1)',
              border: 'none', outline: 'none', background: 'transparent',
              fontFamily: 'inherit', borderBottom: '2px solid var(--border)',
              paddingBottom: 4,
            }}
            placeholder="Task title"
          />
          <button
            onClick={onClose}
            style={{
              background: 'none', border: '1px solid var(--border)', borderRadius: 7,
              width: 28, height: 28, display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: 'var(--text-2)', fontSize: 15, cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* Duration slider */}
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 10,
          }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Estimated time
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>
              {formatDuration(duration)}
            </span>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type="range"
              min={5}
              max={480}
              step={5}
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              style={{
                width: '100%',
                height: 4,
                appearance: 'none',
                WebkitAppearance: 'none',
                background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${pct}%, var(--border) ${pct}%, var(--border) 100%)`,
                borderRadius: 2,
                outline: 'none',
                cursor: 'pointer',
              }}
              className="duration-slider"
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 10, color: 'var(--text-2)' }}>5m</span>
            <span style={{ fontSize: 10, color: 'var(--text-2)' }}>8h</span>
          </div>
        </div>

        {/* Notes */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
            Notes
          </div>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add notes..."
            rows={3}
            style={{
              width: '100%', padding: '9px 11px', borderRadius: 8,
              border: '1px solid var(--border)', background: 'var(--surface)',
              fontSize: 13, color: 'var(--text-1)', outline: 'none',
              resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5,
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => { onStartTimer?.(task?.id, title || task?.text); onClose() }}
            style={{
              flex: 1, padding: '9px', borderRadius: 9, border: 'none',
              background: 'var(--success)', color: '#fff', fontSize: 13,
              fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            ▶ Start timer
          </button>
          <button
            onClick={save}
            style={{
              flex: 2, padding: '9px', borderRadius: 9, border: 'none',
              background: 'var(--accent)', color: '#fff', fontSize: 13,
              fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
