import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { LIMITS } from '../../lib/limits'
import { isToday } from '../../lib/dates'
import TaskCard from './TaskCard'
import { formatDuration } from './TaskCard'

// Line gradient: thin left accent cap for Deep Work / Focus, plain for Others
const SLOT_CONFIG = {
  deep_work: { label: 'Deep Work', max: LIMITS.DAILY_DEEP_WORK, lineAccent: '#3B82F6', placeholder: 'Most important task' },
  scheduled: { label: 'Focus',     max: LIMITS.DAILY_SCHEDULED, lineAccent: '#F08F48', placeholder: 'Focus task' },
  admin:     { label: 'Others',    max: LIMITS.DAILY_ADMIN,     lineAccent: null,      placeholder: 'Other task' },
}

const DAYS_ORDER = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']

function getTomorrow(dayKey) {
  const idx = DAYS_ORDER.indexOf(dayKey)
  return idx < 6 ? DAYS_ORDER[idx + 1] : null
}

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
    const { error } = await onAddSlot(day, slotType, trimmed)
    if (!error) { setAddVal(''); setAdding(false) }
  }

  const lineBg = isOverFull
    ? 'var(--danger)'
    : isOver
      ? `linear-gradient(to right, var(--accent) 3px, var(--border) 3px)`
      : cfg.lineAccent
        ? `linear-gradient(to right, ${cfg.lineAccent} 3px, var(--border) 3px)`
        : 'var(--border)'

  return (
    <div ref={setNodeRef} style={{ marginBottom: 8 }}>
      {/* Section label row */}
      <div style={{ marginTop: 16, marginBottom: 8 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 5,
        }}>
          <span style={{
            fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: '#9CA3AF',
          }}>
            {cfg.label}
          </span>
          <span style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 500 }}>
            {tasks.length}/{cfg.max}
          </span>
        </div>
        {/* 1px accent line */}
        <div style={{
          height: 1,
          background: lineBg,
          transition: 'background 0.12s',
        }} />
      </div>

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
  const DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
  const MON_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const jsDay = dayDate ? dayDate.getDay() : 0
  const dispIdx = jsDay === 0 ? 6 : jsDay - 1
  const dayName = DAY_NAMES[dispIdx] ?? dayKey?.slice(0, 3)
  const dayNum = dayDate ? dayDate.getDate() : ''
  const monthName = dayDate ? MON_NAMES[dayDate.getMonth()] : ''
  const today = dayDate ? isToday(dayDate) : false

  const allTasks = [
    ...(slots?.deep_work ?? []),
    ...(slots?.scheduled ?? []),
    ...(slots?.admin ?? []),
  ]
  const totalMinutes = allTasks.reduce((sum, t) => sum + (getMeta(t.id).duration ?? 30), 0)
  const totalColor = totalMinutes >= 360 ? 'var(--danger)' : totalMinutes >= 270 ? 'var(--sched)' : 'var(--text-2)'

  return (
    <div
      data-tour={today ? 'day-today' : undefined}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: today ? 'var(--col-today-bg)' : 'transparent',
        borderRight: isLast ? 'none' : '1px solid var(--col-sep)',
        padding: '12px 14px 16px',
      }}
    >
      {/* Column header */}
      <div style={{ marginBottom: 4, paddingBottom: 10, borderBottom: '1px solid var(--col-sep)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{
              fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: today ? '#3B82F6' : '#9A9A9A',
              marginBottom: 2,
            }}>
              {dayName}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <div style={{
                fontSize: 11, fontWeight: 500, color: today ? '#3B82F6' : '#9A9A9A',
              }}>
                {monthName}
              </div>
              <div style={{
                fontSize: 28, fontWeight: 700, lineHeight: 1,
                color: today ? '#3B82F6' : 'var(--text-1)',
              }}>
                {dayNum}
              </div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: totalColor, fontWeight: 500, textAlign: 'right', paddingTop: 2 }}>
            {formatDuration(totalMinutes)} / 6h
          </div>
        </div>

        {today && (
          <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
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
              ☀️ Start
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
              ⊙ Focus
            </button>
          </div>
        )}
      </div>

      {/* Sections */}
      <Section day={dayKey} slotType="deep_work"  tasks={slots?.deep_work  ?? []} getMeta={getMeta} setTaskMeta={setTaskMeta} mitCount={mitCount} onAddSlot={onAddSlot} onRemoveSlot={onRemoveSlot} onMoveToSomeday={onMoveToSomeday} onMoveToTomorrow={onMoveToTomorrow} onOpenDetail={onOpenDetail} onStartTimer={onStartTimer} />
      <Section day={dayKey} slotType="scheduled"  tasks={slots?.scheduled  ?? []} getMeta={getMeta} setTaskMeta={setTaskMeta} mitCount={mitCount} onAddSlot={onAddSlot} onRemoveSlot={onRemoveSlot} onMoveToSomeday={onMoveToSomeday} onMoveToTomorrow={onMoveToTomorrow} onOpenDetail={onOpenDetail} onStartTimer={onStartTimer} />
      <Section day={dayKey} slotType="admin"      tasks={slots?.admin      ?? []} getMeta={getMeta} setTaskMeta={setTaskMeta} mitCount={mitCount} onAddSlot={onAddSlot} onRemoveSlot={onRemoveSlot} onMoveToSomeday={onMoveToSomeday} onMoveToTomorrow={onMoveToTomorrow} onOpenDetail={onOpenDetail} onStartTimer={onStartTimer} />
    </div>
  )
}
