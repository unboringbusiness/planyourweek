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

function Section({ day, slotType, tasks, getMeta, setTaskMeta, mitCount, onAddSlot, onRemoveSlot, onReorderSlots, onMoveToSomeday, onMoveToTomorrow, onOpenDetail, onStartTimer, nextDayMap }) {
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
      setAddVal('')
      // Stay open for next task — close only on Escape or clicking away
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
            const tomorrow = nextDayMap?.[day] ?? null
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
                  // Non-MIT tasks move to bottom of section when marked done; MIT stays in place
                  if (nowDone && !meta.is_mit && onReorderSlots) {
                    const others = tasks.filter(t => t.id !== task.id)
                    onReorderSlots(day, slotType, [...others, task])
                  }
                }}
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
              onBlur={() => { if (addVal.trim()) { handleAdd() } else { setAdding(false) } }}
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
  onAddSlot, onRemoveSlot, onReorderSlots, onMoveToSomeday, onMoveToTomorrow,
  onOpenDetail, onStartTimer,
  onFocusMode, onStartupRitual, onShutdownRitual,
  focusModeActive, isLast, nextDayMap,
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
        overflow: 'hidden',
      }}
    >
      {/* Column header — never scrolls away */}
      <div style={{ flexShrink: 0, padding: '12px 14px 10px', borderBottom: '1px solid var(--col-sep)', background: today ? 'var(--col-today-bg)' : 'var(--bg)' }}>
        {/* Row 1: day + date + time pill */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{
              fontSize: 18, fontWeight: 800, textTransform: 'uppercase',
              letterSpacing: '0.01em', color: today ? 'var(--accent)' : 'var(--text-2)',
              lineHeight: 1,
            }}>
              {dayName}
            </span>
            <span style={{ fontSize: 11, fontWeight: 400, color: today ? 'var(--accent)' : 'var(--text-2)', marginLeft: 2 }}>
              {monthName}
            </span>
            <span style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, color: today ? 'var(--accent)' : 'var(--text-1)', marginLeft: 1 }}>
              {dayNum}
            </span>
          </div>

          {/* Time chip — always visible in header */}
          <span style={{
            fontSize: 11, fontWeight: 600,
            color: isOverLimit ? '#fff' : totalColor,
            background: isOverLimit ? 'var(--danger)' : isNearLimit ? 'color-mix(in srgb, var(--sched) 12%, var(--surface))' : 'var(--surface-2)',
            border: `1px solid ${isOverLimit ? 'var(--danger)' : isNearLimit ? 'var(--sched)' : 'var(--border)'}`,
            borderRadius: 6, padding: '2px 7px', whiteSpace: 'nowrap',
          }}>
            {formatDuration(totalMinutes)} / 8:00
          </span>
        </div>

        {/* Row 2: Today badge + action buttons */}
        {today && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
            <span style={{
              fontSize: 10, fontWeight: 600, color: 'var(--accent)',
              background: 'color-mix(in srgb, var(--accent) 12%, var(--surface))',
              padding: '1px 6px', borderRadius: 4, flexShrink: 0,
            }}>Today</span>
            <div style={{ flex: 1 }} />
            <button
              data-tour="startup-btn"
              onClick={onStartupRitual}
              style={{
                height: 26, fontSize: 11, fontWeight: 500, padding: '0 10px',
                background: 'var(--surface)', color: 'var(--text-1)',
                border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer',
                fontFamily: 'inherit', lineHeight: 1,
              }}
            >Plan</button>
            <button
              data-tour="shutdown-btn"
              onClick={onShutdownRitual}
              style={{
                height: 26, fontSize: 11, fontWeight: 500, padding: '0 10px',
                background: 'var(--surface)', color: 'var(--text-2)',
                border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer',
                fontFamily: 'inherit', lineHeight: 1,
              }}
            >Close</button>
            <button
              onClick={onFocusMode}
              style={{
                height: 26, fontSize: 11, fontWeight: 500, padding: '0 10px',
                background: focusModeActive ? 'var(--accent)' : 'var(--surface)',
                color: focusModeActive ? '#fff' : 'var(--text-2)',
                border: `1px solid ${focusModeActive ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 6, cursor: 'pointer',
                fontFamily: 'inherit', lineHeight: 1,
              }}
            >Focus</button>
          </div>
        )}
      </div>

      {/* Scrollable task area */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0 14px 16px' }}>
        <Section day={dayKey} slotType="deep_work"  tasks={slots?.deep_work  ?? []} getMeta={getMeta} setTaskMeta={setTaskMeta} mitCount={mitCount} onAddSlot={onAddSlot} onRemoveSlot={onRemoveSlot} onReorderSlots={onReorderSlots} onMoveToSomeday={onMoveToSomeday} onMoveToTomorrow={onMoveToTomorrow} onOpenDetail={onOpenDetail} onStartTimer={onStartTimer} nextDayMap={nextDayMap} />
        <Section day={dayKey} slotType="scheduled"  tasks={slots?.scheduled  ?? []} getMeta={getMeta} setTaskMeta={setTaskMeta} mitCount={mitCount} onAddSlot={onAddSlot} onRemoveSlot={onRemoveSlot} onReorderSlots={onReorderSlots} onMoveToSomeday={onMoveToSomeday} onMoveToTomorrow={onMoveToTomorrow} onOpenDetail={onOpenDetail} onStartTimer={onStartTimer} nextDayMap={nextDayMap} />
        <Section day={dayKey} slotType="admin"      tasks={slots?.admin      ?? []} getMeta={getMeta} setTaskMeta={setTaskMeta} mitCount={mitCount} onAddSlot={onAddSlot} onRemoveSlot={onRemoveSlot} onReorderSlots={onReorderSlots} onMoveToSomeday={onMoveToSomeday} onMoveToTomorrow={onMoveToTomorrow} onOpenDetail={onOpenDetail} onStartTimer={onStartTimer} nextDayMap={nextDayMap} />
      </div>
    </div>
  )
}
