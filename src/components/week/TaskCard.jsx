import { useState, useRef } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export function formatDuration(min) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

const DURATION_PRESETS = [
  { label: '5m', value: 5 },
  { label: '15m', value: 15 },
  { label: '25m', value: 25 },
  { label: '45m', value: 45 },
  { label: '1h', value: 60 },
  { label: '2h', value: 120 },
]

// Timer chip with popover — used only in day column cards
function TimerChip({ duration, onDurationChange, onStartTimer }) {
  const [open, setOpen] = useState(false)
  const [custom, setCustom] = useState(false)
  const [customVal, setCustomVal] = useState('')
  const ref = useRef(null)

  const handlePreset = (val) => {
    onDurationChange?.(val)
    setOpen(false)
    setCustom(false)
  }

  const handleCustomSave = () => {
    const val = parseInt(customVal, 10)
    if (val > 0) { onDurationChange?.(val); setOpen(false); setCustom(false); setCustomVal('') }
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v) }}
        style={{
          fontSize: 10,
          color: 'var(--text-2)',
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 4,
          padding: '1px 5px',
          cursor: 'pointer',
          fontFamily: 'inherit',
          whiteSpace: 'nowrap',
        }}
      >
        {formatDuration(duration)}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            marginBottom: 4,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            boxShadow: '0 4px 20px rgba(0,0,0,0.14)',
            zIndex: 100,
            minWidth: 160,
            padding: '8px',
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
            {DURATION_PRESETS.map(p => (
              <button
                key={p.value}
                onClick={() => handlePreset(p.value)}
                style={{
                  padding: '3px 8px',
                  borderRadius: 6,
                  border: `1px solid ${duration === p.value ? 'var(--accent)' : 'var(--border)'}`,
                  background: duration === p.value ? 'var(--accent)' : 'var(--surface-2)',
                  color: duration === p.value ? '#fff' : 'var(--text-1)',
                  fontSize: 11,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={() => setCustom(v => !v)}
              style={{
                padding: '3px 8px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: custom ? 'var(--surface-2)' : 'transparent',
                color: 'var(--text-2)',
                fontSize: 11,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Custom
            </button>
          </div>

          {custom && (
            <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
              <input
                autoFocus
                type="number"
                min={1}
                max={480}
                value={customVal}
                onChange={e => setCustomVal(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCustomSave() }}
                placeholder="min"
                style={{
                  flex: 1,
                  padding: '3px 6px',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  fontSize: 12,
                  color: 'var(--text-1)',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
              <button
                onClick={handleCustomSave}
                style={{
                  padding: '3px 8px',
                  borderRadius: 6,
                  border: 'none',
                  background: 'var(--accent)',
                  color: '#fff',
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                Set
              </button>
            </div>
          )}

          <button
            onClick={() => { onStartTimer?.(); setOpen(false) }}
            style={{
              width: '100%',
              padding: '5px',
              borderRadius: 6,
              border: 'none',
              background: 'var(--success)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              fontFamily: 'inherit',
            }}
          >
            ▶ Start timer
          </button>
        </div>
      )}
    </div>
  )
}

// Compact day-column card
export function DayTaskCard({
  taskId,
  text,
  meta = {},
  onTextChange,
  onDurationChange,
  onMITToggle,
  onDoneToggle,
  onRemove,
  onMoveToSomeday,
  onMoveToTomorrow,
  onOpenDetail,
  onStartTimer,
  mitCount = 0,
  dragHandleProps = {},
  isDragOverlay = false,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const { duration = 30, is_mit = false, done = false } = meta
  const canToggleMIT = mitCount < 3 || is_mit

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMenuOpen(false) }}
      style={{
        background: done ? 'var(--surface-2)' : 'var(--surface)',
        border: `1px solid ${is_mit ? 'var(--mit)' : 'var(--border)'}`,
        borderRadius: 8,
        padding: '5px 6px',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        opacity: done ? 0.5 : 1,
        boxShadow: isDragOverlay ? '0 8px 32px rgba(0,0,0,0.18)' : 'none',
        position: 'relative',
        userSelect: 'none',
        cursor: 'default',
      }}
    >
      {/* Drag handle */}
      <div
        {...dragHandleProps}
        style={{
          color: hovered ? 'var(--text-2)' : 'transparent',
          fontSize: 10,
          cursor: isDragOverlay ? 'grabbing' : 'grab',
          flexShrink: 0,
          lineHeight: 1,
          touchAction: 'none',
          transition: 'color 0.1s',
          width: 10,
        }}
      >
        ⠿
      </div>

      {/* Checkbox */}
      <input
        type="checkbox"
        checked={done}
        onChange={() => onDoneToggle?.()}
        onClick={e => e.stopPropagation()}
        style={{ flexShrink: 0, cursor: 'pointer', accentColor: 'var(--success)', width: 13, height: 13 }}
      />

      {/* Task text — click opens detail modal */}
      <div
        onClick={() => !isDragOverlay && onOpenDetail?.()}
        style={{
          flex: 1,
          fontSize: 12,
          color: done ? 'var(--text-2)' : 'var(--text-1)',
          textDecoration: done ? 'line-through' : 'none',
          cursor: isDragOverlay ? 'grabbing' : 'pointer',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          lineHeight: 1.35,
        }}
        title={text}
      >
        {meta.textOverride || text}
      </div>

      {/* Duration chip with timer popover */}
      {!isDragOverlay && (
        <TimerChip
          duration={duration}
          onDurationChange={onDurationChange}
          onStartTimer={() => onStartTimer?.(taskId, meta.textOverride || text)}
        />
      )}
      {isDragOverlay && (
        <span style={{ fontSize: 10, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
          {formatDuration(duration)}
        </span>
      )}

      {/* MIT star — hover only */}
      {(hovered || is_mit) && !isDragOverlay && (
        <button
          onClick={e => { e.stopPropagation(); canToggleMIT && onMITToggle?.() }}
          title={is_mit ? 'Remove MIT' : canToggleMIT ? 'Mark as MIT' : '3 MITs set'}
          style={{
            background: 'none', border: 'none', padding: '1px',
            fontSize: 12, color: is_mit ? 'var(--mit)' : 'var(--border)',
            cursor: canToggleMIT ? 'pointer' : 'not-allowed',
            flexShrink: 0, lineHeight: 1,
          }}
        >
          ★
        </button>
      )}

      {/* Three-dot menu — hover only */}
      {hovered && !isDragOverlay && (
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(v => !v) }}
            style={{
              background: 'none', border: 'none', padding: '0 2px',
              fontSize: 11, color: 'var(--text-2)', cursor: 'pointer',
              lineHeight: 1, letterSpacing: '1px',
            }}
          >
            •••
          </button>
          {menuOpen && (
            <div style={{
              position: 'absolute', right: 0, top: '100%', marginTop: 2,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              zIndex: 60, minWidth: 160, overflow: 'hidden',
            }}>
              {[
                onMoveToTomorrow && { label: 'Move to Tomorrow', fn: onMoveToTomorrow },
                onMoveToSomeday && { label: 'Move to Someday', fn: onMoveToSomeday },
                { label: 'Delete', fn: onRemove, danger: true },
              ].filter(Boolean).map(item => (
                <button
                  key={item.label}
                  onClick={() => { setMenuOpen(false); item.fn?.() }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '8px 12px', background: 'none', border: 'none',
                    fontSize: 12, color: item.danger ? 'var(--danger)' : 'var(--text-1)',
                    cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Compact panel card for This Week sidebar — no duration, no timer
export function PanelTaskCard({
  taskId,
  text,
  meta = {},
  onMITToggle,
  onDoneToggle,
  onRemove,
  onMoveToSomeday,
  mitCount = 0,
  dragHandleProps = {},
  isDragOverlay = false,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const { is_mit = false, done = false } = meta
  const canToggleMIT = mitCount < 3 || is_mit

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMenuOpen(false) }}
      style={{
        background: done ? 'var(--surface-2)' : 'var(--surface)',
        border: `1px solid ${is_mit ? 'var(--mit)' : 'var(--border)'}`,
        borderRadius: 7,
        padding: '5px 6px',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        opacity: done ? 0.5 : 1,
        boxShadow: isDragOverlay ? '0 8px 32px rgba(0,0,0,0.18)' : 'none',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      <div
        {...dragHandleProps}
        style={{
          color: hovered ? 'var(--text-2)' : 'transparent',
          fontSize: 10, cursor: isDragOverlay ? 'grabbing' : 'grab',
          flexShrink: 0, lineHeight: 1, touchAction: 'none',
          width: 10, transition: 'color 0.1s',
        }}
      >
        ⠿
      </div>

      <input
        type="checkbox"
        checked={done}
        onChange={() => onDoneToggle?.()}
        onClick={e => e.stopPropagation()}
        style={{ flexShrink: 0, cursor: 'pointer', accentColor: 'var(--success)', width: 13, height: 13 }}
      />

      <span style={{
        flex: 1, fontSize: 12,
        color: done ? 'var(--text-2)' : 'var(--text-1)',
        textDecoration: done ? 'line-through' : 'none',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {text}
      </span>

      {(hovered || is_mit) && !isDragOverlay && (
        <button
          onClick={e => { e.stopPropagation(); canToggleMIT && onMITToggle?.() }}
          style={{
            background: 'none', border: 'none', padding: '1px',
            fontSize: 11, color: is_mit ? 'var(--mit)' : 'var(--border)',
            cursor: canToggleMIT ? 'pointer' : 'not-allowed', flexShrink: 0,
          }}
        >
          ★
        </button>
      )}

      {hovered && !isDragOverlay && (
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(v => !v) }}
            style={{
              background: 'none', border: 'none', padding: '0 2px',
              fontSize: 11, color: 'var(--text-2)', cursor: 'pointer',
              lineHeight: 1, letterSpacing: '1px',
            }}
          >
            •••
          </button>
          {menuOpen && (
            <div style={{
              position: 'absolute', right: 0, top: '100%', marginTop: 2,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              zIndex: 60, minWidth: 150, overflow: 'hidden',
            }}>
              {onMoveToSomeday && (
                <button
                  onClick={() => { setMenuOpen(false); onMoveToSomeday() }}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 12px', background: 'none', border: 'none', fontSize: 12, color: 'var(--text-1)', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Move to Someday
                </button>
              )}
              <button
                onClick={() => { setMenuOpen(false); onRemove?.() }}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 12px', background: 'none', border: 'none', fontSize: 12, color: 'var(--danger)', cursor: 'pointer', fontFamily: 'inherit' }}
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

// Drag overlay — generic visual ghost
export function TaskCardBase({ text, meta = {}, isDragOverlay = true, dragHandleProps = {} }) {
  const { duration = 30, is_mit = false, done = false } = meta
  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${is_mit ? 'var(--mit)' : 'var(--accent)'}`,
      borderRadius: 8, padding: '5px 8px',
      display: 'flex', alignItems: 'center', gap: 6,
      opacity: 0.92, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      userSelect: 'none', cursor: 'grabbing', minWidth: 120,
    }}>
      <span style={{ fontSize: 10, color: 'var(--text-2)' }}>⠿</span>
      <span style={{ fontSize: 12, color: 'var(--text-1)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {text}
      </span>
      <span style={{ fontSize: 10, color: 'var(--text-2)' }}>{formatDuration(duration)}</span>
    </div>
  )
}

// Sortable wrapper for day columns
export default function TaskCard({ containerData, compact = false, ...props }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.taskId,
    data: containerData,
  })

  const CardComponent = compact ? DayTaskCard : PanelTaskCard

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0 : 1 }}
    >
      <CardComponent {...props} dragHandleProps={listeners} />
    </div>
  )
}
