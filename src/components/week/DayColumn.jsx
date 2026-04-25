import { useState, useRef } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { LIMITS } from '../../lib/limits'
import { isToday } from '../../lib/dates'
import TaskCard from './TaskCard'
import { formatDuration } from './TaskCard'

const SLOT_MAX = {
  deep_work: LIMITS.DAILY_DEEP_WORK,
  scheduled: LIMITS.DAILY_SCHEDULED,
  admin: LIMITS.DAILY_ADMIN,
}

const DAYS_ORDER = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']

function getTomorrow(dayKey) {
  const idx = DAYS_ORDER.indexOf(dayKey)
  return idx < 6 ? DAYS_ORDER[idx + 1] : null
}

// Tooltip shown briefly on rejected drop
function FullTooltip({ label }) {
  return (
    <div style={{
      position: 'absolute', top: -28, left: '50%', transform: 'translateX(-50%)',
      background: 'var(--text-1)', color: '#fff', fontSize: 10, fontWeight: 500,
      borderRadius: 5, padding: '3px 8px', whiteSpace: 'nowrap', zIndex: 200,
      pointerEvents: 'none',
    }}>
      {label} is full
    </div>
  )
}

function Section({ day, slotType, tasks, getMeta, setTaskMeta, mitCount, onAddSlot, onRemoveSlot, onMoveToSomeday, onMoveToTomorrow, onOpenDetail, onStartTimer, isLast }) {
  const max = SLOT_MAX[slotType]
  const isFull = tasks.length >= max
  const [adding, setAdding] = useState(false)
  const [addVal, setAddVal] = useState('')
  const inputRef = useRef(null)

  const { setNodeRef, isOver } = useDroppable({
    id: `drop-${day}-${slotType}`,
    data: { type: 'section', day, slotType },
  })

  const isOverFull = isOver && isFull

  const handleAdd = async () => {
    const trimmed = addVal.trim()
    if (!trimmed) { setAdding(false); return }
    const { error } = await onAddSlot(day, slotType, trimmed)
    if (!error) {
      setAddVal('')
      // Keep open to add more — blur or Escape collapses
      inputRef.current?.focus()
    }
  }

  const slotLabel = slotType === 'deep_work' ? 'Deep Work' : slotType === 'scheduled' ? 'Focus' : 'Others'

  return (
    <div
      ref={setNodeRef}
      style={{
        position: 'relative',
        background: isOverFull
          ? 'color-mix(in srgb, var(--danger) 5%, transparent)'
          : isOver
            ? 'color-mix(in srgb, var(--accent) 5%, transparent)'
            : 'transparent',
        borderRadius: 6,
        padding: '0',
        paddingBottom: isLast ? 0 : 6,
        transition: 'background 0.12s',
      }}
    >
      {isOverFull && <FullTooltip label={slotLabel} />}

      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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
                slotType={slotType}
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

      {/* Add task — disappears when full */}
      {!isFull && (
        <div style={{ marginTop: tasks.length > 0 ? 4 : 0 }}>
          {adding ? (
            <input
              ref={inputRef}
              autoFocus
              style={{
                width: '100%', padding: '8px 10px', borderRadius: 8,
                border: '1.5px solid var(--accent)', background: 'var(--surface)',
                fontSize: 13, color: 'var(--text-1)', outline: 'none',
                fontFamily: 'inherit', boxSizing: 'border-box',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              }}
              placeholder={`Add task…`}
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
                width: '100%', padding: '5px 10px', borderRadius: 6,
                border: 'none', background: 'transparent',
                fontSize: 13, color: '#BBBBBB', textAlign: 'left',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#BBBBBB' }}
            >
              + add task
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
  const totalMinutes = allTasks.reduce((sum, t) => sum + (getMeta(t.id).duration ?? 30), 0)
  const totalColor = totalMinutes > 420 ? 'var(--danger)' : totalMinutes > 300 ? 'var(--sched)' : 'var(--text-2)'

  return (
    <div
      data-tour={today ? 'day-today' : undefined}
      style={{
        flex: 1,
        minWidth: focusModeActive ? 'auto' : 120,
        display: 'flex',
        flexDirection: 'column',
        background: today ? 'var(--col-today-bg)' : 'transparent',
        borderRight: isLast ? 'none' : '1px solid var(--col-sep)',
        padding: '10px 12px 14px',
        overflow: 'visible',
      }}
    >
      {/* Column header */}
      <div style={{ marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid var(--col-sep)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 2 }}>
          <div>
            <div style={{
              fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: today ? 'var(--accent)' : 'var(--text-2)',
              lineHeight: 1,
              marginBottom: 3,
            }}>
              {dayName}
            </div>
            <div style={{
              fontSize: 32, fontWeight: 700, lineHeight: 1,
              color: today ? 'var(--accent)' : 'var(--text-1)',
            }}>
              {dayNum}
            </div>
          </div>
          <div style={{ fontSize: 12, color: totalColor, fontWeight: 500, textAlign: 'right', paddingTop: 2 }}>
            {formatDuration(totalMinutes)} / 7h
          </div>
        </div>

        {/* Today action buttons */}
        {today && (
          <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
            <button
              data-tour="startup-btn"
              onClick={onStartupRitual}
              title="Start my day"
              style={{
                flex: 1, padding: '4px 6px', fontSize: 11, fontWeight: 600,
                background: 'color-mix(in srgb, var(--success) 15%, var(--surface))',
                color: 'var(--success)', border: '1px solid var(--success)',
                borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              ☀️ Start
            </button>
            <button
              data-tour="shutdown-btn"
              onClick={onShutdownRitual}
              title="Close my day"
              style={{
                flex: 1, padding: '4px 6px', fontSize: 11, fontWeight: 600,
                background: 'var(--surface-2)', color: 'var(--text-2)',
                border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer',
              }}
            >
              🌙 Close
            </button>
            <button
              onClick={onFocusMode}
              title="Focus mode"
              style={{
                flex: 1, padding: '4px 6px', fontSize: 11, fontWeight: 600,
                background: focusModeActive
                  ? 'color-mix(in srgb, var(--accent) 15%, var(--surface))'
                  : 'var(--surface-2)',
                color: focusModeActive ? 'var(--accent)' : 'var(--text-2)',
                border: `1px solid ${focusModeActive ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 6, cursor: 'pointer',
              }}
            >
              ⊙ Focus
            </button>
          </div>
        )}
      </div>

      {/* Sections — no headers, just stacked cards */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Section day={dayKey} slotType="deep_work"  tasks={slots?.deep_work  ?? []} getMeta={getMeta} setTaskMeta={setTaskMeta} mitCount={mitCount} onAddSlot={onAddSlot} onRemoveSlot={onRemoveSlot} onMoveToSomeday={onMoveToSomeday} onMoveToTomorrow={onMoveToTomorrow} onOpenDetail={onOpenDetail} onStartTimer={onStartTimer} />
        <Section day={dayKey} slotType="scheduled"  tasks={slots?.scheduled  ?? []} getMeta={getMeta} setTaskMeta={setTaskMeta} mitCount={mitCount} onAddSlot={onAddSlot} onRemoveSlot={onRemoveSlot} onMoveToSomeday={onMoveToSomeday} onMoveToTomorrow={onMoveToTomorrow} onOpenDetail={onOpenDetail} onStartTimer={onStartTimer} />
        <Section day={dayKey} slotType="admin"      tasks={slots?.admin      ?? []} getMeta={getMeta} setTaskMeta={setTaskMeta} mitCount={mitCount} onAddSlot={onAddSlot} onRemoveSlot={onRemoveSlot} onMoveToSomeday={onMoveToSomeday} onMoveToTomorrow={onMoveToTomorrow} onOpenDetail={onOpenDetail} onStartTimer={onStartTimer} isLast />
      </div>
    </div>
  )
}
