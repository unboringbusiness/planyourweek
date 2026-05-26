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
  scheduled: { label: 'Focus Tasks',   max: LIMITS.DAILY_SCHEDULED, lineAccent: '#3B82F6', placeholder: 'Focus task' },
  admin:     { label: 'Other Tasks',   max: LIMITS.DAILY_ADMIN,     lineAccent: null,      placeholder: 'Other task' },
}

// nextDayMap is now passed as a prop from WeekView to handle any week start day

const DEFAULT_DURATION = { deep_work: 90, scheduled: 25, admin: 25 }

function Section({ day, slotType, tasks, getMeta, setTaskMeta, mitCount, onAddSlot, onRemoveSlot, onReorderSlots, onMoveToSomeday, onMoveToTomorrow, onOpenDetail, onStartTimer, nextDayMap, dayDate, todayDayName }) {
  const cfg = SLOT_CONFIG[slotType]
  const [adding, setAdding] = useState(false)
  const [addVal, setAddVal] = useState('')
  const [showCompleted, setShowCompleted] = useState(false)

  // Split into active and completed
  const activeTasks = tasks.filter(t => !getMeta(t.id).done)
  const completedTasks = tasks.filter(t => getMeta(t.id).done)
  const isFull = activeTasks.length >= cfg.max

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
      setAddVal('')
    }
  }

  // Determine move target: if this day is in the past, move to today; otherwise next day
  const isPast = dayDate && !isToday(dayDate) && dayDate < new Date(new Date().setHours(0,0,0,0))
  const moveTarget = isPast ? todayDayName : (nextDayMap?.[day] ?? null)
  const moveLabel = isPast ? '→ Move to Today' : '→ Move to Tomorrow'

  const renderTask = (task) => {
    const meta = getMeta(task.id)
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
        onDoneToggle={() => {
          const nowDone = !meta.done
          setTaskMeta(task.id, { done: nowDone })
          if (nowDone && !meta.is_mit && onReorderSlots) {
            const others = tasks.filter(t => t.id !== task.id)
            onReorderSlots(day, slotType, [...others, task])
          }
        }}
        onRemove={() => onRemoveSlot(day, task.id)}
        onMoveToSomeday={() => onMoveToSomeday?.(task, day)}
        onMoveToTomorrow={moveTarget ? () => onMoveToTomorrow?.(task, day, slotType, moveTarget, slotType) : null}
        moveLabel={moveLabel}
        onOpenDetail={() => onOpenDetail?.(task, day, slotType)}
        onStartTimer={onStartTimer}
      />
    )
  }

  return (
    <div ref={setNodeRef} style={{ marginBottom: 4 }}>
      {/* Section label */}
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
        <span style={{ fontSize: 10, color: activeTasks.length > cfg.max ? 'var(--danger)' : '#C0BDB8', fontWeight: 400 }}>
          {activeTasks.length}/{cfg.max}
        </span>
      </div>

      {/* Drop-zone flash when dragging over */}
      {isOver && (
        <div style={{
          height: 2, background: isOverFull ? 'var(--danger)' : 'var(--accent)',
          borderRadius: 1, marginBottom: 4, transition: 'background 0.12s',
        }} />
      )}

      {/* Active tasks */}
      <SortableContext items={activeTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {activeTasks.map(renderTask)}
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
              onBlur={() => { if (addVal.trim()) { handleAdd() } else { setAdding(false) } }}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAdd()
                if (e.key === 'Escape') { setAdding(false); setAddVal('') }
              }}
            />
          ) : (
            <button
              onClick={() => setAdding(true)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '8px 12px', background: 'none', border: 'none',
                fontSize: 12, color: '#9CA3AF', cursor: 'pointer',
                fontFamily: 'inherit', borderRadius: 6,
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-1)' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#9CA3AF' }}
            >
              + {cfg.placeholder}
            </button>
          )}
        </div>
      )}

      {/* Completed tasks section */}
      {completedTasks.length > 0 && (
        <div style={{ marginTop: 6 }}>
          <button
            onClick={() => setShowCompleted(v => !v)}
            style={{
              background: 'none', border: 'none', padding: '4px 0',
              fontSize: 10, color: '#9CA3AF', cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <span style={{ transform: showCompleted ? 'rotate(90deg)' : 'none', transition: 'transform 0.12s', fontSize: 8 }}>&#9654;</span>
            {completedTasks.length} completed
          </button>
          {showCompleted && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4, opacity: 0.7 }}>
              {completedTasks.map(renderTask)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function DayColumn({
  dayKey, dayDate, slots, getMeta, setTaskMeta, mitCount,
  onAddSlot, onRemoveSlot, onReorderSlots, onMoveToSomeday, onMoveToTomorrow,
  onOpenDetail, onStartTimer,
  onFocusMode, onStartupRitual, onShutdownRitual,
  focusModeActive, isLast, nextDayMap, todayDayName,
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
  const totalMinutes = allTasks.reduce((sum, t) => sum + (getMeta(t.id)?.duration ?? 0), 0)

  // Check if day is in the past
  const isPast = dayDate && !today && dayDate < new Date(new Date().setHours(0,0,0,0))

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto', overflowX: 'hidden',
      background: today ? 'var(--col-today-bg)' : 'var(--bg)',
      opacity: isPast ? 0.6 : 1,
    }}>
      {/* Day header */}
      <div
        style={{
          padding: '10px 14px 6px',
          position: 'sticky', top: 0, background: today ? 'var(--col-today-bg)' : 'var(--bg)',
          zIndex: 5,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
          <span style={{
            fontSize: 13, fontWeight: 700,
            color: today ? 'var(--accent)' : 'var(--text-1)',
            textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>
            {dayName}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{monthName}</span>
          <span style={{
            fontSize: 26, fontWeight: 700,
            color: today ? 'var(--accent)' : 'var(--text-1)',
            lineHeight: 1,
          }}>
            {dayNum}
          </span>
          <span style={{ fontSize: 11, color: '#C0BDB8', marginLeft: 'auto' }}>
            {formatDuration(totalMinutes)} / {formatDuration(LIMITS.DAILY_FOCUS_MINUTES)}
          </span>
        </div>

        {/* Day action buttons */}
        {today && (
          <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
            <button
              style={{
                padding: '3px 10px', borderRadius: 6,
                border: '1px solid var(--accent)', background: 'var(--accent)',
                fontSize: 11, fontWeight: 600, color: '#fff', cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Today
            </button>
            <button
              onClick={() => onFocusMode?.()}
              style={{
                padding: '3px 10px', borderRadius: 6,
                border: '1px solid var(--border)', background: 'var(--surface)',
                fontSize: 11, fontWeight: 500, color: 'var(--text-2)', cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {focusModeActive ? 'Exit Focus' : 'Plan'}
            </button>
            <button
              onClick={() => onShutdownRitual?.()}
              style={{
                padding: '3px 10px', borderRadius: 6,
                border: '1px solid var(--border)', background: 'var(--surface)',
                fontSize: 11, fontWeight: 500, color: 'var(--text-2)', cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Close
            </button>
          </div>
        )}
      </div>

      {/* Task sections */}
      <div style={{ padding: '0 14px 16px' }}>
        <Section day={dayKey} slotType="deep_work"  tasks={slots?.deep_work  ?? []} getMeta={getMeta} setTaskMeta={setTaskMeta} mitCount={mitCount} onAddSlot={onAddSlot} onRemoveSlot={onRemoveSlot} onReorderSlots={onReorderSlots} onMoveToSomeday={onMoveToSomeday} onMoveToTomorrow={onMoveToTomorrow} onOpenDetail={onOpenDetail} onStartTimer={onStartTimer} nextDayMap={nextDayMap} dayDate={dayDate} todayDayName={todayDayName} />
        <Section day={dayKey} slotType="scheduled"  tasks={slots?.scheduled  ?? []} getMeta={getMeta} setTaskMeta={setTaskMeta} mitCount={mitCount} onAddSlot={onAddSlot} onRemoveSlot={onRemoveSlot} onReorderSlots={onReorderSlots} onMoveToSomeday={onMoveToSomeday} onMoveToTomorrow={onMoveToTomorrow} onOpenDetail={onOpenDetail} onStartTimer={onStartTimer} nextDayMap={nextDayMap} dayDate={dayDate} todayDayName={todayDayName} />
        <Section day={dayKey} slotType="admin"      tasks={slots?.admin      ?? []} getMeta={getMeta} setTaskMeta={setTaskMeta} mitCount={mitCount} onAddSlot={onAddSlot} onRemoveSlot={onRemoveSlot} onReorderSlots={onReorderSlots} onMoveToSomeday={onMoveToSomeday} onMoveToTomorrow={onMoveToTomorrow} onOpenDetail={onOpenDetail} onStartTimer={onStartTimer} nextDayMap={nextDayMap} dayDate={dayDate} todayDayName={todayDayName} />
      </div>
    </div>
  )
}
