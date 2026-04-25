import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { LIMITS } from '../../lib/limits'
import { isToday } from '../../lib/dates'
import TaskCard, { DayTaskCard } from './TaskCard'
import { formatDuration } from './TaskCard'

// SCHEDULED → FOCUS, ADMIN → OTHERS (labels only — slot keys unchanged)
const SECTION_CONFIG = {
  deep_work: { label: 'Deep Work', max: LIMITS.DAILY_DEEP_WORK, color: 'var(--deep)', bg: 'var(--deep-bg)' },
  scheduled: { label: 'Focus',     max: LIMITS.DAILY_SCHEDULED, color: 'var(--sched)', bg: 'var(--sched-bg)' },
  admin:     { label: 'Others',    max: LIMITS.DAILY_ADMIN,     color: 'var(--admin)', bg: 'var(--admin-bg)' },
}

const DAYS_ORDER = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']

function getTomorrow(dayKey) {
  const idx = DAYS_ORDER.indexOf(dayKey)
  return idx < 6 ? DAYS_ORDER[idx + 1] : null
}

function Section({ day, slotType, tasks, getMeta, setTaskMeta, mitCount, onAddSlot, onRemoveSlot, onMoveToSomeday, onMoveToTomorrow, onOpenDetail, onStartTimer }) {
  const cfg = SECTION_CONFIG[slotType]
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
    const { error } = await onAddSlot(day, slotType, trimmed)
    if (!error) { setAddVal(''); setAdding(false) }
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        borderRadius: 8, padding: '5px',
        background: isOverFull ? '#FEE2E2' : isOver ? 'color-mix(in srgb, var(--accent) 8%, transparent)' : cfg.bg,
        border: `1px solid ${isOverFull ? 'var(--danger)' : isOver ? 'var(--accent)' : 'transparent'}`,
        transition: 'background 0.12s, border-color 0.12s',
        minHeight: 48,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3, padding: '0 2px' }}>
        <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: cfg.color }}>
          {cfg.label}
        </span>
        <span style={{
          fontSize: 9, fontWeight: 600, background: 'var(--surface)',
          color: isFull ? cfg.color : 'var(--text-2)',
          borderRadius: 6, padding: '0 4px',
          border: `1px solid ${isFull ? cfg.color : 'var(--border)'}`,
        }}>
          {tasks.length}/{cfg.max}
        </span>
      </div>

      {isOverFull && (
        <div style={{ fontSize: 9, color: 'var(--danger)', textAlign: 'center', paddingBottom: 3, fontWeight: 500 }}>
          {cfg.label} is full
        </div>
      )}

      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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

      {!isFull && (
        <div style={{ marginTop: tasks.length > 0 ? 3 : 0 }}>
          {adding ? (
            <input
              autoFocus
              style={{
                width: '100%', padding: '4px 6px', borderRadius: 6,
                border: '1.5px solid var(--accent)', background: 'var(--surface)',
                fontSize: 11, color: 'var(--text-1)', outline: 'none', fontFamily: 'inherit',
              }}
              placeholder={`Add ${cfg.label.toLowerCase()}…`}
              value={addVal}
              onChange={e => setAddVal(e.target.value)}
              onBlur={handleAdd}
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
                width: '100%', padding: '4px 6px', borderRadius: 6,
                border: '1.5px dashed var(--border)', background: 'transparent',
                fontSize: 10, color: 'var(--text-2)', textAlign: 'left',
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 4,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent)'
                e.currentTarget.style.color = 'var(--accent)'
                e.currentTarget.style.background = 'color-mix(in srgb, var(--accent) 6%, transparent)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.color = 'var(--text-2)'
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <span style={{ fontSize: 12, lineHeight: 1, fontWeight: 600 }}>+</span> add task
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
  focusModeActive,
}) {
  const DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
  const jsDay = dayDate ? dayDate.getDay() : 0
  const dispIdx = jsDay === 0 ? 6 : jsDay - 1
  const dayName = DAY_NAMES[dispIdx] ?? dayKey?.slice(0, 3)
  const dayNum = dayDate ? dayDate.getDate() : ''
  const today = dayDate ? isToday(dayDate) : false

  const allTasks = [
    ...(slots?.deep_work ?? []),
    ...(slots?.scheduled ?? []),
    ...(slots?.admin ?? []),
  ]

  // Total estimated minutes for this day
  const totalMinutes = allTasks.reduce((sum, t) => sum + (getMeta(t.id).duration ?? 30), 0)
  const focusMinutes = [
    ...(slots?.deep_work ?? []),
    ...(slots?.scheduled ?? []),
  ].reduce((sum, t) => sum + (getMeta(t.id).duration ?? 30), 0)

  const totalColor = totalMinutes > 420 ? 'var(--danger)' : totalMinutes > 300 ? 'var(--sched)' : 'var(--text-2)'

  return (
    <div data-tour={today ? 'day-today' : undefined} style={{
      flex: focusModeActive ? 1 : 1,
      minWidth: focusModeActive ? 'auto' : 130,
      display: 'flex', flexDirection: 'column', gap: 5,
      padding: '8px 7px',
      borderRadius: 14,
      border: `${today ? '2' : '1'}px solid ${today ? 'var(--accent)' : 'var(--border)'}`,
      background: today ? 'color-mix(in srgb, var(--accent) 3%, var(--surface))' : 'var(--surface)',
    }}>
      {/* Day header */}
      <div style={{ paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
        {/* Day name + number + focus bar */}
        <div style={{ textAlign: 'center', marginBottom: 4 }}>
          <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {dayName}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: today ? 'var(--accent)' : 'var(--text-1)', lineHeight: 1.1 }}>
            {dayNum}
          </div>
        </div>

        {/* Focus progress bar + label */}
        <div style={{ padding: '0 2px' }}>
          <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', marginBottom: 2 }}>
            <div style={{
              height: '100%',
              width: `${Math.min((focusMinutes / 420) * 100, 100)}%`,
              background: focusMinutes >= 420 ? 'var(--danger)' : focusMinutes >= 300 ? 'var(--sched)' : 'var(--accent)',
              borderRadius: 2,
              transition: 'width 0.3s ease, background 0.3s ease',
            }} />
          </div>
          <div style={{ textAlign: 'right', fontSize: 9, color: totalColor, fontWeight: 500 }}>
            {formatDuration(focusMinutes)} / 7h
          </div>
        </div>

        {/* Today action buttons */}
        {today && (
          <div style={{ display: 'flex', gap: 3, marginTop: 5 }}>
            <button
              data-tour="startup-btn"
              onClick={onStartupRitual}
              title="Start my day"
              style={{
                flex: 1, padding: '4px 0', fontSize: 9, fontWeight: 700,
                background: 'var(--success)', color: '#fff', border: 'none',
                borderRadius: 5, cursor: 'pointer', letterSpacing: '0.02em',
              }}
            >
              ☀️ Start
            </button>
            <button
              data-tour="shutdown-btn"
              onClick={onShutdownRitual}
              title="Close my day"
              style={{
                flex: 1, padding: '4px 0', fontSize: 9, fontWeight: 700,
                background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)',
                borderRadius: 5, cursor: 'pointer',
              }}
            >
              🌙 Close
            </button>
            <button
              onClick={onFocusMode}
              title="Focus mode"
              style={{
                flex: 1, padding: '4px 0', fontSize: 9, fontWeight: 700,
                background: focusModeActive ? 'var(--accent)' : 'var(--surface-2)',
                color: focusModeActive ? '#fff' : 'var(--text-2)',
                border: `1px solid ${focusModeActive ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 5, cursor: 'pointer',
              }}
            >
              ⊙ Focus
            </button>
          </div>
        )}
      </div>

      <Section day={dayKey} slotType="deep_work" tasks={slots?.deep_work ?? []} getMeta={getMeta} setTaskMeta={setTaskMeta} mitCount={mitCount} onAddSlot={onAddSlot} onRemoveSlot={onRemoveSlot} onMoveToSomeday={onMoveToSomeday} onMoveToTomorrow={onMoveToTomorrow} onOpenDetail={onOpenDetail} onStartTimer={onStartTimer} />
      <Section day={dayKey} slotType="scheduled" tasks={slots?.scheduled ?? []} getMeta={getMeta} setTaskMeta={setTaskMeta} mitCount={mitCount} onAddSlot={onAddSlot} onRemoveSlot={onRemoveSlot} onMoveToSomeday={onMoveToSomeday} onMoveToTomorrow={onMoveToTomorrow} onOpenDetail={onOpenDetail} onStartTimer={onStartTimer} />
      <Section day={dayKey} slotType="admin" tasks={slots?.admin ?? []} getMeta={getMeta} setTaskMeta={setTaskMeta} mitCount={mitCount} onAddSlot={onAddSlot} onRemoveSlot={onRemoveSlot} onMoveToSomeday={onMoveToSomeday} onMoveToTomorrow={onMoveToTomorrow} onOpenDetail={onOpenDetail} onStartTimer={onStartTimer} />
    </div>
  )
}
