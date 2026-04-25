import { useState } from 'react'

const QUADRANTS = [
  { id: 'do',       label: 'DO',       sub: 'Urgent + Important',     color: 'var(--danger)',  bg: 'color-mix(in srgb, var(--danger) 8%, var(--surface))' },
  { id: 'schedule', label: 'SCHEDULE', sub: 'Not Urgent + Important',  color: 'var(--accent)',  bg: 'color-mix(in srgb, var(--accent) 8%, var(--surface))' },
  { id: 'delegate', label: 'DELEGATE', sub: 'Urgent + Not Important',  color: 'var(--sched)',   bg: 'color-mix(in srgb, var(--sched) 8%, var(--surface))' },
  { id: 'drop',     label: 'DROP',     sub: 'Not Urgent + Not Important', color: 'var(--text-2)', bg: 'var(--surface-2)' },
]

export default function EisenhowerMatrix({ items, onSchedule, onDrop, onClose }) {
  // Map item id → quadrant choice
  const [assignments, setAssignments] = useState({})

  const unassigned = items.filter(item => !assignments[item.id])
  const assigned = QUADRANTS.map(q => ({
    ...q,
    items: items.filter(item => assignments[item.id] === q.id),
  }))

  const handleAssign = (itemId, quadrantId) => {
    setAssignments(prev => ({ ...prev, [itemId]: quadrantId }))
  }

  const handleUnassign = (itemId) => {
    setAssignments(prev => {
      const next = { ...prev }
      delete next[itemId]
      return next
    })
  }

  const handleApply = () => {
    for (const item of items) {
      const q = assignments[item.id]
      if (q === 'do' || q === 'schedule') {
        onSchedule?.(item)
      } else if (q === 'drop' || q === 'delegate') {
        onDrop?.(item)
      }
    }
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'var(--overlay)',
        zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface)', borderRadius: 18,
          padding: '24px 28px', width: 640, maxWidth: '96vw', maxHeight: '90vh',
          overflowY: 'auto', boxShadow: '0 8px 48px rgba(0,0,0,0.22)',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>Eisenhower Triage</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
              Click a dump item, then assign it to a quadrant.
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--text-2)', cursor: 'pointer', lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* Unassigned items */}
        {unassigned.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              Unassigned ({unassigned.length})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {unassigned.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                    borderRadius: 8, padding: '4px 10px', fontSize: 12, color: 'var(--text-1)',
                  }}
                >
                  <span style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.text}
                  </span>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {QUADRANTS.map(q => (
                      <button
                        key={q.id}
                        onClick={() => handleAssign(item.id, q.id)}
                        title={q.label}
                        style={{
                          width: 18, height: 18, borderRadius: 4,
                          border: `1px solid ${q.color}`,
                          background: 'transparent', cursor: 'pointer',
                          fontSize: 7, fontWeight: 700, color: q.color,
                        }}
                      >
                        {q.label[0]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2×2 grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {assigned.map(q => (
            <div
              key={q.id}
              style={{
                background: q.bg, border: `1.5px solid ${q.color}`,
                borderRadius: 10, padding: '10px 12px', minHeight: 100,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: q.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {q.label}
                </span>
                <span style={{ fontSize: 9, color: 'var(--text-2)' }}>{q.sub}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {q.items.map(item => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      background: 'var(--surface)', borderRadius: 6,
                      padding: '4px 7px', fontSize: 11, color: 'var(--text-1)',
                    }}
                  >
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.text}
                    </span>
                    <button
                      onClick={() => handleUnassign(item.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', fontSize: 11, lineHeight: 1, padding: 0 }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                {q.items.length === 0 && (
                  <div style={{ fontSize: 10, color: 'var(--text-2)', fontStyle: 'italic' }}>Drop items here</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Apply */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'transparent', color: 'var(--text-2)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            style={{
              padding: '8px 20px', borderRadius: 8, border: 'none',
              background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Apply decisions
          </button>
        </div>
      </div>
    </div>
  )
}
