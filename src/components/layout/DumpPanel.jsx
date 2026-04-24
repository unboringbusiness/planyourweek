import { useState, useRef } from 'react'
import { LIMITS } from '../../lib/limits'

const S = {
  panel: {
    width: 280,
    flexShrink: 0,
    background: '#F5EFE8',
    borderRight: '1px solid #E5E0D8',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    transition: 'width 0.2s ease',
  },
  panelCollapsed: {
    width: 0,
    borderRight: 'none',
  },
  header: {
    padding: '14px 16px 10px',
    borderBottom: '1px solid #E5E0D8',
    flexShrink: 0,
  },
  title: {
    fontSize: 11,
    fontWeight: 600,
    color: '#6B6B6B',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countBadge: {
    fontSize: 11,
    fontWeight: 500,
    color: '#6B6B6B',
    background: '#E5E0D8',
    borderRadius: 10,
    padding: '1px 6px',
  },
  countFull: {
    background: '#FEE2E2',
    color: '#DC2626',
  },
  addRow: {
    display: 'flex',
    gap: 6,
  },
  addInput: {
    flex: 1,
    padding: '7px 10px',
    borderRadius: 8,
    border: '1px solid #E5E0D8',
    background: '#FAF4ED',
    fontSize: 13,
    color: '#133950',
    outline: 'none',
  },
  addBtn: {
    background: '#3B82F6',
    border: 'none',
    borderRadius: 8,
    width: 30,
    height: 30,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: 18,
    lineHeight: 1,
    flexShrink: 0,
  },
  addBtnDisabled: {
    background: '#E5E0D8',
    color: '#9CA3AF',
    cursor: 'not-allowed',
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 8px',
    borderRadius: 8,
    background: '#FAF4ED',
    border: '1px solid #E5E0D8',
    fontSize: 13,
    color: '#133950',
    cursor: 'grab',
    userSelect: 'none',
  },
  itemDragging: {
    opacity: 0.5,
    border: '1px dashed #3B82F6',
  },
  dragHandle: {
    color: '#C5BCB2',
    fontSize: 11,
    cursor: 'grab',
    flexShrink: 0,
    lineHeight: 1,
  },
  itemText: {
    flex: 1,
    lineHeight: 1.35,
    wordBreak: 'break-word',
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: '#C5BCB2',
    fontSize: 14,
    lineHeight: 1,
    padding: '0 2px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
  },
  emptyState: {
    padding: '24px 16px',
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 13,
    lineHeight: 1.5,
  },
  warningBanner: {
    margin: '0 12px 8px',
    padding: '6px 10px',
    borderRadius: 8,
    background: '#FEF3C7',
    border: '1px solid #FCD34D',
    fontSize: 11,
    color: '#92400E',
    textAlign: 'center',
  },
}

export default function DumpPanel({ open, items, addItem, removeItem, reorderItems, isFull, count }) {
  const [inputVal, setInputVal] = useState('')
  const [error, setError] = useState('')
  const [draggingId, setDraggingId] = useState(null)
  const dragOverId = useRef(null)

  const handleAdd = async () => {
    if (!inputVal.trim()) return
    const { error: err } = await addItem(inputVal)
    if (err) { setError(err); return }
    setInputVal('')
    setError('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAdd()
  }

  // HTML5 drag-and-drop reordering
  const handleDragStart = (e, id) => {
    setDraggingId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, id) => {
    e.preventDefault()
    dragOverId.current = id
  }

  const handleDrop = () => {
    if (!draggingId || dragOverId.current === draggingId) {
      setDraggingId(null)
      return
    }
    const fromIdx = items.findIndex(i => i.id === draggingId)
    const toIdx = items.findIndex(i => i.id === dragOverId.current)
    if (fromIdx === -1 || toIdx === -1) { setDraggingId(null); return }
    const reordered = [...items]
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)
    reorderItems(reordered)
    setDraggingId(null)
    dragOverId.current = null
  }

  const atWarnThreshold = count >= LIMITS.DUMP_WARN && !isFull

  return (
    <aside style={{ ...S.panel, ...(open ? {} : S.panelCollapsed) }}>
      {open && (
        <>
          <div style={S.header}>
            <div style={S.title}>
              <span>Brain Dump</span>
              <span style={{ ...S.countBadge, ...(isFull ? S.countFull : {}) }}>
                {count}/{LIMITS.DUMP_MAX}
              </span>
            </div>
            <div style={S.addRow}>
              <input
                style={S.addInput}
                placeholder="Capture a thought..."
                value={inputVal}
                onChange={e => { setInputVal(e.target.value); setError('') }}
                onKeyDown={handleKeyDown}
                disabled={isFull}
                maxLength={200}
              />
              <button
                style={{ ...S.addBtn, ...(isFull ? S.addBtnDisabled : {}) }}
                onClick={handleAdd}
                disabled={isFull}
                title="Add item"
              >
                +
              </button>
            </div>
            {error && <div style={{ fontSize: 11, color: '#DC2626', marginTop: 6 }}>{error}</div>}
          </div>

          {atWarnThreshold && (
            <div style={S.warningBanner}>
              Getting full — process some items before adding more.
            </div>
          )}

          <div style={S.list} onDrop={handleDrop} onDragOver={e => e.preventDefault()}>
            {items.length === 0 ? (
              <div style={S.emptyState}>
                Capture anything on your mind.<br />You'll process it into your week.
              </div>
            ) : (
              items.map(item => (
                <div
                  key={item.id}
                  style={{ ...S.item, ...(draggingId === item.id ? S.itemDragging : {}) }}
                  draggable
                  onDragStart={e => handleDragStart(e, item.id)}
                  onDragOver={e => handleDragOver(e, item.id)}
                >
                  <span style={S.dragHandle}>⠿</span>
                  <span style={S.itemText}>{item.text}</span>
                  <button
                    style={S.removeBtn}
                    onClick={() => removeItem(item.id)}
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </aside>
  )
}
