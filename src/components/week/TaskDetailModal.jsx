import { useState, useEffect } from 'react'
import { formatDuration } from './TaskCard'

const PRESETS = [5, 15, 25, 45, 60, 120]

export default function TaskDetailModal({ task, meta = {}, onClose, onUpdate, onStartTimer }) {
  const [title, setTitle] = useState(meta.textOverride || task?.text || '')
  const [notes, setNotes] = useState(meta.notes || '')
  const [duration, setDuration] = useState(meta.duration ?? 30)
  const [subtasks, setSubtasks] = useState(meta.subtasks || [])
  const [newSubtask, setNewSubtask] = useState('')

  useEffect(() => {
    const handleKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const save = () => {
    onUpdate?.({ textOverride: title, notes, duration, subtasks })
    onClose()
  }

  const addSubtask = () => {
    const trimmed = newSubtask.trim()
    if (!trimmed) return
    setSubtasks(prev => [...prev, { id: crypto.randomUUID(), text: trimmed, done: false }])
    setNewSubtask('')
  }

  const toggleSubtask = (id) => {
    setSubtasks(prev => prev.map(s => s.id === id ? { ...s, done: !s.done } : s))
  }

  const removeSubtask = (id) => setSubtasks(prev => prev.filter(s => s.id !== id))

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
          padding: '24px', width: 480, maxWidth: '95vw', maxHeight: '85vh',
          overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
          display: 'flex', flexDirection: 'column', gap: 16,
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

        {/* Duration */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
            Estimated time
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {PRESETS.map(p => (
              <button
                key={p}
                onClick={() => setDuration(p)}
                style={{
                  padding: '4px 10px', borderRadius: 7,
                  border: `1.5px solid ${duration === p ? 'var(--accent)' : 'var(--border)'}`,
                  background: duration === p ? 'var(--accent)' : 'var(--surface-2)',
                  color: duration === p ? '#fff' : 'var(--text-1)',
                  fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {formatDuration(p)}
              </button>
            ))}
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
            }}
          />
        </div>

        {/* Subtasks */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
            Subtasks
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 6 }}>
            {subtasks.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <input
                  type="checkbox"
                  checked={s.done}
                  onChange={() => toggleSubtask(s.id)}
                  style={{ cursor: 'pointer', accentColor: 'var(--success)' }}
                />
                <span style={{
                  flex: 1, fontSize: 13, color: 'var(--text-1)',
                  textDecoration: s.done ? 'line-through' : 'none',
                  opacity: s.done ? 0.55 : 1,
                }}>
                  {s.text}
                </span>
                <button
                  onClick={() => removeSubtask(s.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', fontSize: 14 }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={newSubtask}
              onChange={e => setNewSubtask(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addSubtask() }}
              placeholder="+ Add subtask"
              style={{
                flex: 1, padding: '6px 9px', borderRadius: 7, border: '1px solid var(--border)',
                background: 'var(--surface-2)', fontSize: 12, color: 'var(--text-1)',
                outline: 'none', fontFamily: 'inherit',
              }}
            />
            <button
              onClick={addSubtask}
              style={{
                background: 'var(--accent)', border: 'none', borderRadius: 7,
                padding: '6px 12px', color: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Add
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
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
