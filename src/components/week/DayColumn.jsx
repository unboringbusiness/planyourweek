import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { LIMITS } from '../../lib/limits'
import { isToday } from '../../lib/dates'
import TaskCard from './TaskCard'
import { formatDuration } from './TaskCard'

// Line gradient: thin left accent cap for Deep Work / Focus, plain for Others
const SLOT_CONFIG = {
  deep_work: { label: 'Most Important', max: LIMITS.DAILY_DEEP_WORK, lineAccent: '#3B82F6', placeholder: 'Most important task' },
  scheduled: { label: 'Focus Tasks',   max: LIMITS.DAILY_SCHEDULED, lineAccent: '#F08F48', placeholder: 'Focus task' },
  admin:     { label: 'Other Tasks',   max: LIMITS.DAILY_ADMIN,     lineAccent: null,      placeholder: 'Other task' },
}

const DAYS_ORDER = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']

function getTomorrow(dayKey) {
  const idx = DAYS_ORDER.indexOf(dayKey)
  return idx < 6 ? DAYS_ORDER[idx + 1] : null
}

const DEFAULT_DURATION = { deep_work: 90, scheduled: 25, admin: 25 }

function Section({ day, slotType, tasks, getMeta, setTaskMeta, mitCount, onAddSlot, onRemoveSlot, onMoveToSomeday, onMoveToTomorrow, onOpenDetail, onStartTimer }) {
  const cfg = SLOT_CONFIG[slotType]
  const isFull = tasks.length >= cfg.max
  const [adding, setAdding] = useState(false)
  const [addVal, setAddVal] = useState('')

  const { setNodeRef, isOver } = useDroppable({
    id: `drop-${day}-${slotType}`,
    data: { type: 'section', day, slotType },
  })

  const isOverFull = isOver && isFull

  const handleAdd = async () => {
    const trimmed = addVal.trim()
    if (!trimmed) { setAdding(false); return }
    const { error, data } = await onAddSlot(day, slotType, trimmed)
    if (!error) {
      if (data?.id) setTaskMeta(data.id, { duration: DEFAULT_DURATION[slotType] })
      setAddVal(''); setAdding(false)
    }
  }

  return (
    <div ref={setNodeRef} style={{ marginBottom: 4 }}>
      {/* Section label — subtle, lowercase */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: 12, marginBottom: 6,
      }}>
        <span style={{
          fontSize: 10, fontWeight: 500, color: cfg.lineAccent ?? '#C0BDB8',
          letterSpacing: '0.04em',
        }}>
          {cfg.label}
        </span>
        <span style={{ fontSize: 10, color: tasks.length > cfg.max ? 'var(--danger)' : '#C0BDB8', fontWeight: 400 }}>
          {tasks.length}/{cfg.max}
        </span>
      </div>

      {/* Drop-zone flash when dragging over */}
      {isOver && (
        <div style={{
          height: 2, background: isOverFull ? 'var(--danger)' : 'var(--accent)',
          borderRadius: 1, marginBottom: 4, transition: 'background 0.12s',
        }} />
      )}

      {/* Tasks */}
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {tasks.map(task => {
            const meta = getMeta(task.id)
            const tomorrow = getTomorrow(day)
            return (
              <TaskCard
                key={task.id}
                taskId={task.id}
                text={task.text}
                meta={meta}
                compact={true}
                mitCount={mitCount}
                containerData={{ type: 'slot', task, day, slotType }}
                onDurationChange={dur => setTaskMeta(task.id, { duration: dur })}
                onMITToggle={() => setTaskMeta(task.id, { is_mit: !meta.is_mit })}
                onDoneToggle={() => setTaskMeta(task.id, { done: !meta.done })}
                onRemove={() => onRemoveSlot(day, task.id)}
                onMoveToSomeday={() => onMoveToSomeday?.(task, day)}
                onMoveToTomorrow={tomorrow ? () => onMoveToTomorrow?.(task, day, slotType, tomorrow, slotType) : null}
                onOpenDetail={() => onOpenDetail?.(task, day, slotType)}
                onStartTimer={onStartTimer}
              />
            )
          })}
        </div>
      </SortableContext>

      {/* Add task — hidden when full */}
      {!isFull && (
        <div style={{ marginTop: 2 }}>
          {adding ? (
            <input
              autoFocus
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 8,
                border: '1.5px solid var(--accent)', background: 'var(--surface)',
                fontSize: 14, color: 'var(--text-1)', outline: 'none',
                fontFamily: 'inherit', boxSizing: 'border-box',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}
              placeholder={`+ ${cfg.placeholder}`}
              value={addVal}
              onChange={e => setAddVal(e.target.value)}
              onBlur={() => { if (!addVal.trim()) setAdding(false) }}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAdd()
                if (e.key === 'Escape') { setAdding(false); setAddVal('') }
              }}
              maxLength={200}
            />
          ) : (
            <button
              onClick={() => setAdding(true)}
              style={{
                width: '100%', padding: '8px 14px',
                border: 'none', background: 'transparent',
                fontSize: 14, color: '#9CA3AF', textAlign: 'left',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#9CA3AF' }}
            >
              + {cfg.placeholder}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function DayColumn({
  dayKey, dayDate, slots, getMeta, setTaskMeta, mitCount,
  onAddSlot, onRemoveSlot, onMoveToSomeday, onMoveToTomorrow,
  onOpenDetail, onStartTimer,
  onFocusMode, onStartupRitual, onShutdownRitual,
  focusModeActive, isLast,
}) {
  const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const MON_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const jsDay = dayDate ? dayDate.getDay() : 0
  const dayName = DAY_NAMES[jsDay] ?? dayKey?.slice(0, 3)
  const dayNum = dayDate ? dayDate.getDate() : ''
  const monthName = dayDate ? MON_NAMES[dayDate.getMonth()] : ''
  const today = dayDate ? isToday(dayDate) : false

  const allTasks = [
    ...(slots?.deep_work ?? []),
    ...(slots?.scheduled ?? []),
    ...(slots?.admin ?? []),
  ]
  const totalMinutes = allTasks.reduce((sum, t) => sum + (getMeta(t.id).duration ?? 30), 0)
  const isOverLimit = totalMinutes > 480
  const isNearLimit = totalMinutes >= 360
  const totalColor = isOverLimit ? 'var(--danger)' : isNearLimit ? 'var(--sched)' : 'var(--text-2)'
  const overBy = totalMinutes - 480

  return (
    <div
      data-tour={today ? 'day-today' : undefined}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: today ? 'var(--col-today-bg)' : 'transparent',
        padding: '12px 14px 16px',
      }}
    >
      {/* Column header */}
      <div style={{ paddingBottom: 10, borderBottom: '1px solid #F0F0F0' }}>
        {/* Row 1: day name + date number (both prominent) */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{
            fontSize: 14, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.06em', color: today ? 'var(--accent)' : 'var(--text-2)',
          }}>
            {dayName}
          </span>
          <span style={{ fontSize: 36, fontWeight: 800, lineHeight: 1, color: today ? 'var(--accent)' : 'var(--text-1)' }}>
            {dayNum}
          </span>
        </div>
        {/* Row 2: month + Today badge (smaller) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
          <span style={{ fontSize: 11, fontWeight: 400, color: today ? 'var(--accent)' : 'var(--text-2)' }}>
            {monthName}
          </span>
          {today && (
            <span style={{
              fontSize: 10, fontWeight: 600, color: 'var(--accent)',
              background: 'color-mix(in srgb, var(--accent) 12%, var(--surface))',
              padding: '1px 6px', borderRadius: 4,
            }}>Today</span>
          )}
        </div>

        {today && (
          <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
            <button
              data-tour="startup-btn"
              onClick={onStartupRitual}
              style={{
                flex: 1, height: 24, fontSize: 11, fontWeight: 600,
                background: 'color-mix(in srgb, var(--success) 12%, var(--surface))',
                color: 'var(--success)', border: '1px solid var(--success)',
                borderRadius: 6, cursor: 'pointer',
              }}
            >
              ☀️ Plan Today
            </button>
            <button
              data-tour="shutdown-btn"
              onClick={onShutdownRitual}
              style={{
                flex: 1, height: 24, fontSize: 11, fontWeight: 600,
                background: 'var(--surface-2)', color: 'var(--text-2)',
                border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer',
              }}
            >
              🌙 Close
            </button>
            <button
              onClick={onFocusMode}
              style={{
                flex: 1, height: 24, fontSize: 11, fontWeight: 600,
                background: focusModeActive
                  ? 'color-mix(in srgb, var(--accent) 12%, var(--surface))'
                  : 'var(--surface-2)',
                color: focusModeActive ? 'var(--accent)' : 'var(--text-2)',
                border: `1px solid ${focusModeActive ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 6, cursor: 'pointer',
              }}
            >
              🎯 Focus
            </button>
          </div>
        )}
      </div>

      {/* Sections — no extra spacer, sections start right after header */}
      <Section day={dayKey} slotType="deep_work"  tasks={slots?.deep_work  ?? []} getMeta={getMeta} setTaskMeta={setTaskMeta} mitCount={mitCount} onAddSlot={onAddSlot} onRemoveSlot={onRemoveSlot} onMoveToSomeday={onMoveToSomeday} onMoveToTomorrow={onMoveToTomorrow} onOpenDetail={onOpenDetail} onStartTimer={onStartTimer} />
      <Section day={dayKey} slotType="scheduled"  tasks={slots?.scheduled  ?? []} getMeta={getMeta} setTaskMeta={setTaskMeta} mitCount={mitCount} onAddSlot={onAddSlot} onRemoveSlot={onRemoveSlot} onMoveToSomeday={onMoveToSomeday} onMoveToTomorrow={onMoveToTomorrow} onOpenDetail={onOpenDetail} onStartTimer={onStartTimer} />
      <Section day={dayKey} slotType="admin"      tasks={slots?.admin      ?? []} getMeta={getMeta} setTaskMeta={setTaskMeta} mitCount={mitCount} onAddSlot={onAddSlot} onRemoveSlot={onRemoveSlot} onMoveToSomeday={onMoveToSomeday} onMoveToTomorrow={onMoveToTomorrow} onOpenDetail={onOpenDetail} onStartTimer={onStartTimer} />

      {/* Time footer */}
      <div style={{ marginTop: 'auto', paddingTop: 12, textAlign: 'right', position: 'relative' }}>
        <span style={{ fontSize: 11, color: totalColor, fontWeight: 500 }}>
          {formatDuration(totalMinutes)} / 8:00
        </span>
        {isOverLimit && (
          <div style={{
            position: 'absolute', bottom: '100%', right: 0, marginBottom: 6,
            background: '#1F2937', color: '#fff', fontSize: 11, fontWeight: 500,
            borderRadius: 8, padding: '6px 10px', whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)', zIndex: 10,
            pointerEvents: 'none',
          }}>
            😓 Exceeded 8h by {formatDuration(overBy)}
          </div>
        )}
      </div>
    </div>
  )
}
