import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function formatDuration(min) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

const menuItemStyle = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  padding: '8px 12px',
  background: 'none',
  border: 'none',
  fontSize: 13,
  color: 'var(--text-1)',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

// Pure visual component — used directly in DragOverlay
export function TaskCardBase({
  taskId,
  text,
  meta = {},
  onTextChange,
  onDurationChange,
  onMITToggle,
  onDoneToggle,
  onRemove,
  onMoveToSomeday,
  mitCount = 0,
  dragHandleProps = {},
  isDragOverlay = false,
}) {
  const [editingText, setEditingText] = useState(false)
  const [textVal, setTextVal] = useState(text)
  const [editingDur, setEditingDur] = useState(false)
  const [durVal, setDurVal] = useState(meta.duration ?? 30)
  const [menuOpen, setMenuOpen] = useState(false)

  const { duration = 30, is_mit = false, done = false } = meta
  const canToggleMIT = mitCount < 3 || is_mit

  const saveText = () => {
    setEditingText(false)
    const trimmed = textVal.trim()
    if (trimmed && trimmed !== text) onTextChange?.(trimmed)
    else setTextVal(text)
  }

  const saveDuration = () => {
    setEditingDur(false)
    const val = parseInt(durVal, 10)
    if (!isNaN(val) && val > 0) onDurationChange?.(val)
    else setDurVal(duration)
  }

  return (
    <div
      style={{
        background: done ? 'var(--surface-2)' : 'var(--surface)',
        border: `1.5px solid ${is_mit ? 'var(--mit)' : 'var(--border)'}`,
        borderRadius: 10,
        padding: '7px 8px 6px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 5,
        opacity: done ? 0.55 : 1,
        boxShadow: isDragOverlay ? '0 8px 32px rgba(0,0,0,0.18)' : 'none',
        position: 'relative',
        userSelect: 'none',
      }}
      onMouseLeave={() => setMenuOpen(false)}
    >
      {/* Drag handle */}
      <div
        {...dragHandleProps}
        style={{
          color: 'var(--border)',
          fontSize: 11,
          cursor: isDragOverlay ? 'grabbing' : 'grab',
          paddingTop: 3,
          flexShrink: 0,
          lineHeight: 1,
          touchAction: 'none',
        }}
      >
        ⠿
      </div>

      {/* Done checkbox */}
      <input
        type="checkbox"
        checked={done}
        onChange={() => onDoneToggle?.()}
        onClick={e => e.stopPropagation()}
        style={{ marginTop: 3, flexShrink: 0, cursor: 'pointer', accentColor: 'var(--accent)' }}
      />

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {editingText && !isDragOverlay ? (
          <input
            autoFocus
            value={textVal}
            onChange={e => setTextVal(e.target.value)}
            onBlur={saveText}
            onKeyDown={e => {
              if (e.key === 'Enter') saveText()
              if (e.key === 'Escape') { setEditingText(false); setTextVal(text) }
            }}
            style={{
              width: '100%',
              border: '1px solid var(--accent)',
              borderRadius: 6,
              padding: '2px 4px',
              fontSize: 13,
              color: 'var(--text-1)',
              background: 'var(--surface)',
              fontFamily: 'inherit',
              outline: 'none',
            }}
          />
        ) : (
          <div
            onClick={() => !isDragOverlay && setEditingText(true)}
            style={{
              fontSize: 13,
              color: 'var(--text-1)',
              textDecoration: done ? 'line-through' : 'none',
              cursor: isDragOverlay ? 'grabbing' : 'text',
              wordBreak: 'break-word',
              lineHeight: 1.4,
            }}
          >
            {text}
          </div>
        )}

        {/* Duration chip */}
        <div style={{ marginTop: 4 }}>
          {editingDur && !isDragOverlay ? (
            <input
              autoFocus
              type="number"
              min={5}
              max={480}
              value={durVal}
              onChange={e => setDurVal(e.target.value)}
              onBlur={saveDuration}
              onKeyDown={e => { if (e.key === 'Enter') saveDuration() }}
              style={{
                width: 56,
                border: '1px solid var(--accent)',
                borderRadius: 4,
                padding: '1px 4px',
                fontSize: 11,
                color: 'var(--text-2)',
                background: 'var(--surface)',
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />
          ) : (
            <span
              onClick={() => !isDragOverlay && setEditingDur(true)}
              style={{
                fontSize: 11,
                color: 'var(--text-2)',
                background: 'var(--surface-2)',
                borderRadius: 4,
                padding: '1px 6px',
                cursor: isDragOverlay ? 'grabbing' : 'pointer',
                display: 'inline-block',
              }}
            >
              {formatDuration(duration)}
            </span>
          )}
        </div>
      </div>

      {/* MIT star */}
      <button
        onClick={e => { e.stopPropagation(); canToggleMIT && onMITToggle?.() }}
        title={is_mit ? 'Remove MIT flag' : canToggleMIT ? 'Mark as weekly MIT' : '3 MITs already set'}
        style={{
          background: 'none',
          border: 'none',
          padding: '2px',
          fontSize: 14,
          color: is_mit ? 'var(--mit)' : 'var(--border)',
          cursor: canToggleMIT ? 'pointer' : 'not-allowed',
          flexShrink: 0,
          lineHeight: 1,
          opacity: !is_mit && !canToggleMIT ? 0.4 : 1,
        }}
      >
        ★
      </button>

      {/* Three-dot menu */}
      {!isDragOverlay && (
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(v => !v) }}
            style={{
              background: 'none',
              border: 'none',
              padding: '2px 3px',
              fontSize: 12,
              color: 'var(--text-2)',
              cursor: 'pointer',
              lineHeight: 1,
              letterSpacing: '1px',
            }}
          >
            •••
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '100%',
              marginTop: 2,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              zIndex: 50,
              minWidth: 170,
              overflow: 'hidden',
            }}>
              {onMoveToSomeday && (
                <button
                  onClick={() => { setMenuOpen(false); onMoveToSomeday() }}
                  style={menuItemStyle}
                >
                  Move to Someday/Maybe
                </button>
              )}
              <button
                onClick={() => { setMenuOpen(false); onRemove?.() }}
                style={{ ...menuItemStyle, color: 'var(--danger)' }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Sortable wrapper — used in actual lists
export default function TaskCard({ containerData, ...props }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props.taskId,
    data: containerData,
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0 : 1,
      }}
    >
      <TaskCardBase {...props} dragHandleProps={listeners} />
    </div>
  )
}
