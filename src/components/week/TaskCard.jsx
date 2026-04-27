import { useState, useRef } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export function formatDuration(min) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${h}:${String(m).padStart(2, '0')}`
}


// Left border — MIT gold only, no slot-type coloring (accent lives on section line)
const MIT_BORDER = '#FFD156'

// Timer chip + duration popover
function TimerChip({ duration, onDurationChange, onStartTimer, done }) {
  const [open, setOpen] = useState(false)
  const [customVal, setCustomVal] = useState(String(duration))

  const handleCustomChange = (val) => {
    setCustomVal(val)
    const n = parseInt(val, 10)
    if (!isNaN(n) && n > 0 && n <= 600) onDurationChange?.(n)
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <button
        onClick={e => { e.stopPropagation(); setCustomVal(String(duration)); setOpen(v => !v) }}
        style={{
          fontSize: 12, color: done ? '#D1D5DB' : 'var(--chip-text)',
          background: done ? 'transparent' : 'var(--chip-bg)',
          border: 'none', borderRadius: 6,
          padding: '3px 8px', cursor: 'pointer',
          fontFamily: 'inherit', whiteSpace: 'nowrap',
          display: 'inline-flex', alignItems: 'center', gap: 3,
        }}
      >
        {formatDuration(duration)}
        {!done && <span style={{ fontSize: 8, opacity: 0.45, lineHeight: 1 }}>▾</span>}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute', bottom: '100%', right: 0, marginBottom: 4,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            zIndex: 100, width: 160, padding: '12px',
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 6 }}>Duration (minutes)</div>
          <input
            type="number"
            min={1}
            max={600}
            value={customVal}
            onChange={e => handleCustomChange(e.target.value)}
            style={{
              width: '100%', padding: '6px 8px', borderRadius: 8,
              border: '1.5px solid var(--accent)', background: 'var(--surface-2)',
              fontSize: 18, fontWeight: 600, color: 'var(--text-1)',
              outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
              marginBottom: 10, textAlign: 'center',
            }}
          />
          <button
            onClick={() => { onStartTimer?.(); setOpen(false) }}
            style={{
              width: '100%', padding: '8px', borderRadius: 8, border: 'none',
              background: 'var(--success)', color: '#fff',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
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

// Day column card — two-row layout: text top, actions bottom on hover
export function DayTaskCard({
  taskId, text, meta = {},
  onDurationChange, onMITToggle, onDoneToggle, onRemove,
  onMoveToSomeday, onMoveToTomorrow, onOpenDetail, onStartTimer,
  mitCount = 0, dragHandleProps = {}, isDragOverlay = false, slotType,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const { duration = 30, is_mit = false, done = false } = meta
  const canMIT = slotType !== 'admin' // only deep_work + scheduled can be milestones
  const canToggleMIT = canMIT && (mitCount < 3 || is_mit)
  const leftBorder = is_mit ? MIT_BORDER : 'transparent'
  const displayText = meta.textOverride || text

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMenuOpen(false) }}
      style={{
        background: 'var(--surface)',
        borderLeft: `3px solid ${done ? leftBorder + '4D' : leftBorder}`,
        borderRadius: 8,
        padding: '10px 12px 8px',
        boxShadow: isDragOverlay ? '0 8px 32px rgba(0,0,0,0.18)' : done ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
        position: 'relative',
        userSelect: 'none',
        cursor: 'default',
      }}
    >
      {/* Row 1: checkbox + text + duration chip */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {/* Checkbox */}
        <div
          onClick={e => { e.stopPropagation(); onDoneToggle?.() }}
          style={{
            width: 18, height: 18, borderRadius: '50%', marginTop: 2,
            border: done ? 'none' : '1.5px solid #D1D5DB',
            background: done ? 'var(--success)' : 'transparent',
            flexShrink: 0, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s, border 0.15s',
          }}
        >
          {done && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>

        {/* Text — takes all remaining space */}
        <div
          onClick={() => !isDragOverlay && onOpenDetail?.()}
          style={{
            flex: 1, minWidth: 0, fontSize: 14,
            color: done ? '#9CA3AF' : 'var(--text-1)',
            textDecoration: done ? 'line-through' : 'none',
            cursor: isDragOverlay ? 'grabbing' : 'pointer',
            lineHeight: 1.45, fontWeight: 400, wordBreak: 'break-word',
          }}
          title={displayText}
        >
          {displayText}
        </div>

        {/* Duration chip — always top-right */}
        {!isDragOverlay ? (
          <TimerChip
            duration={duration}
            onDurationChange={onDurationChange}
            onStartTimer={() => onStartTimer?.(taskId, displayText)}
            done={done}
          />
        ) : (
          <span style={{
            fontSize: 12, color: 'var(--chip-text)',
            background: 'var(--chip-bg)', borderRadius: 6, padding: '3px 8px', flexShrink: 0,
          }}>
            {formatDuration(duration)}
          </span>
        )}
      </div>

      {/* Row 2: action bar — fades in on hover, no overflow:hidden so dropdown is never clipped */}
      {!isDragOverlay && (
        <div style={{
          paddingLeft: 28,
          marginTop: 5,
          opacity: hovered ? 1 : 0,
          pointerEvents: hovered ? 'auto' : 'none',
          transition: 'opacity 0.15s ease',
          position: 'relative',
        }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
              onClick={e => { e.stopPropagation(); setMenuOpen(v => !v) }}
              style={{
                background: 'none', border: '1px solid var(--border)',
                borderRadius: 6, padding: '2px 8px',
                fontSize: 11, color: 'var(--text-2)', cursor: 'pointer',
                fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 3,
              }}
            >
              Actions <span style={{ fontSize: 8, opacity: 0.6 }}>▾</span>
            </button>

            {menuOpen && (
              <div
                onClick={e => e.stopPropagation()}
                style={{
                  position: 'absolute', left: 0, top: 'calc(100% + 4px)',
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.13)',
                  zIndex: 200, minWidth: 190, overflow: 'hidden',
                }}
              >
                {[
                  canMIT && { label: is_mit ? '★ Remove Milestone' : '★ Mark as Milestone', fn: () => canToggleMIT && onMITToggle?.(), disabled: !canToggleMIT && !is_mit, accent: is_mit ? '#FFD156' : undefined },
                  onMoveToTomorrow && { label: '→ Move to Tomorrow', fn: onMoveToTomorrow },
                  onMoveToSomeday && { label: '☁ Save for Later', fn: onMoveToSomeday },
                  { label: '🗑 Delete task', fn: onRemove, danger: true },
                ].filter(Boolean).map(item => (
                  <button
                    key={item.label}
                    onClick={() => { setMenuOpen(false); item.fn?.() }}
                    disabled={item.disabled}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '9px 14px', background: 'none', border: 'none',
                      fontSize: 13,
                      color: item.danger ? 'var(--danger)' : item.accent ?? 'var(--text-1)',
                      cursor: item.disabled ? 'not-allowed' : 'pointer',
                      opacity: item.disabled ? 0.4 : 1,
                      whiteSpace: 'nowrap', fontFamily: 'inherit',
                    }}
                    onMouseEnter={e => { if (!item.disabled) e.currentTarget.style.background = 'var(--surface-2)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Panel card for This Week sidebar — compact, no timer
export function PanelTaskCard({
  taskId, text, meta = {},
  onMITToggle, onDoneToggle, onRemove, onMoveToSomeday,
  mitCount = 0, dragHandleProps = {}, isDragOverlay = false,
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
        background: 'var(--surface)',
        border: 'none',
        borderLeft: `3px solid ${is_mit ? '#FFD156' : 'transparent'}`,
        borderRadius: 7,
        padding: '7px 10px',
        minHeight: 34,
        display: 'flex', alignItems: 'center', gap: 8,
        boxShadow: isDragOverlay ? '0 8px 32px rgba(0,0,0,0.18)' : '0 1px 2px rgba(0,0,0,0.04)',
        userSelect: 'none',
        opacity: done ? 0.55 : 1,
      }}
    >
      <div
        onClick={e => { e.stopPropagation(); onDoneToggle?.() }}
        style={{
          width: 14, height: 14, borderRadius: '50%',
          border: done ? 'none' : '1.5px solid #D0CEC9',
          background: done ? 'var(--success)' : 'transparent',
          flexShrink: 0, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {done && (
          <svg width="8" height="7" viewBox="0 0 8 7" fill="none">
            <path d="M1 3.5l2 2.5 4-5" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>

      <span style={{
        flex: 1, fontSize: 13,
        color: done ? '#B0AEA9' : 'var(--text-1)',
        textDecoration: done ? 'line-through' : 'none',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {text}
      </span>

      {(hovered || is_mit) && !isDragOverlay && (
        <button
          onClick={e => { e.stopPropagation(); canToggleMIT && onMITToggle?.() }}
          style={{
            background: 'none', border: 'none', padding: '0 2px',
            fontSize: 12, color: is_mit ? '#FFD156' : '#D0CEC9',
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
              borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              zIndex: 60, minWidth: 150, overflow: 'hidden',
            }}>
              {onMoveToSomeday && (
                <button
                  onClick={() => { setMenuOpen(false); onMoveToSomeday() }}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 14px', background: 'none', border: 'none', fontSize: 13, color: 'var(--text-1)', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Save to Backlog
                </button>
              )}
              <button
                onClick={() => { setMenuOpen(false); onRemove?.() }}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 14px', background: 'none', border: 'none', fontSize: 13, color: 'var(--danger)', cursor: 'pointer', fontFamily: 'inherit' }}
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

// Drag overlay ghost
export function TaskCardBase({ text, meta = {}, isDragOverlay = true }) {
  const { duration = 30, is_mit = false } = meta
  const leftBorder = is_mit ? MIT_BORDER : 'transparent'
  return (
    <div style={{
      background: 'var(--surface)',
      border: 'none',
      borderLeft: `3px solid ${leftBorder}`,
      borderRadius: 8, padding: '11px 14px',
      display: 'flex', alignItems: 'flex-start', gap: 10,
      opacity: 0.92, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      userSelect: 'none', cursor: 'grabbing', minWidth: 140,
    }}>
      <div style={{ width: 20, height: 20, borderRadius: '50%', border: '1.5px solid #D1D5DB', flexShrink: 0, marginTop: 1 }} />
      <span style={{ fontSize: 14, color: 'var(--text-1)', flex: 1, lineHeight: 1.4, wordBreak: 'break-word' }}>
        {text}
      </span>
      <span style={{ fontSize: 12, color: 'var(--chip-text)', background: 'var(--chip-bg)', borderRadius: 6, padding: '3px 8px' }}>
        {formatDuration(duration)}
      </span>
    </div>
  )
}

// Sortable wrapper
export default function TaskCard({ containerData, compact = false, slotType, ...props }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.taskId,
    data: containerData,
  })

  const CardComponent = compact ? DayTaskCard : PanelTaskCard

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0 : 1 }}
    >
      <CardComponent {...props} slotType={slotType} />
    </div>
  )
}
