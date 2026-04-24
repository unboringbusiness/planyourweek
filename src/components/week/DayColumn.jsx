import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { LIMITS } from '../../lib/limits'
import { isToday } from '../../lib/dates'
import TaskCard from './TaskCard'
import FocusBar from './FocusBar'

const SECTION_CONFIG = {
  deep_work: {
    label: 'Deep Work',
    max: LIMITS.DAILY_DEEP_WORK,
    color: 'var(--deep)',
    bg: 'var(--deep-bg)',
  },
  scheduled: {
    label: 'Scheduled',
    max: LIMITS.DAILY_SCHEDULED,
    color: 'var(--sched)',
    bg: 'var(--sched-bg)',
  },
  admin: {
    label: 'Admin',
    max: LIMITS.DAILY_ADMIN,
    color: 'var(--admin)',
    bg: 'var(--admin-bg)',
  },
}

function Section({ day, slotType, tasks, getMeta, setTaskMeta, mitCount, onAddSlot, onRemoveSlot, onMoveToSomeday }) {
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
        borderRadius: 8,
        padding: '6px',
        background: isOverFull ? '#FEE2E2' : isOver ? 'color-mix(in srgb, var(--accent) 8%, transparent)' : cfg.bg,
        border: `1px solid ${isOverFull ? 'var(--danger)' : isOver ? 'var(--accent)' : 'transparent'}`,
        transition: 'background 0.15s, border-color 0.15s',
        minHeight: 60,
      }}
    >
      {/* Section header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
        padding: '0 2px',
      }}>
        <span style={{
          fontSize: 9,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: cfg.color,
        }}>
          {cfg.label}
        </span>
        <span style={{
          fontSize: 10,
          fontWeight: 600,
          background: 'var(--surface)',
          color: isFull ? cfg.color : 'var(--text-2)',
          borderRadius: 8,
          padding: '0 5px',
          border: `1px solid ${isFull ? cfg.color : 'var(--border)'}`,
        }}>
          {tasks.length}/{cfg.max}
        </span>
      </div>

      {isOverFull && (
        <div style={{
          fontSize: 10,
          color: 'var(--danger)',
          textAlign: 'center',
          padding: '2px 0 4px',
          fontWeight: 500,
        }}>
          {cfg.label} is full for this day
        </div>
      )}

      {/* Tasks */}
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {tasks.map(task => {
            const meta = getMeta(task.id)
            return (
              <TaskCard
                key={task.id}
                taskId={task.id}
                text={task.text}
                meta={meta}
                mitCount={mitCount}
                containerData={{ type: 'slot', task, day, slotType }}
                onTextChange={text => {
                  // For now: remove and re-add is complex; update in place via local state patch
                  // useWeek doesn't have updateSlot — handle via setTaskMeta text field workaround
                  // Actually we need to handle this differently. Text is immutable in the hook.
                  // We'll store text overrides in taskMeta.
                  setTaskMeta(task.id, { textOverride: text })
                }}
                onDurationChange={dur => setTaskMeta(task.id, { duration: dur })}
                onMITToggle={() => setTaskMeta(task.id, { is_mit: !meta.is_mit })}
                onDoneToggle={() => setTaskMeta(task.id, { done: !meta.done })}
                onRemove={() => onRemoveSlot(day, task.id)}
                onMoveToSomeday={() => onMoveToSomeday?.(task, day)}
              />
            )
          })}
        </div>
      </SortableContext>

      {/* Add button */}
      {!isFull && (
        <div style={{ marginTop: tasks.length > 0 ? 4 : 0 }}>
          {adding ? (
            <input
              autoFocus
              style={{
                width: '100%',
                padding: '5px 7px',
                borderRadius: 7,
                border: '1.5px solid var(--accent)',
                background: 'var(--surface)',
                fontSize: 12,
                color: 'var(--text-1)',
                outline: 'none',
                fontFamily: 'inherit',
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
                width: '100%',
                padding: '4px 6px',
                borderRadius: 7,
                border: '1.5px dashed var(--border)',
                background: 'transparent',
                fontSize: 11,
                color: 'var(--text-2)',
                textAlign: 'left',
                transition: 'border-color 0.12s, color 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)' }}
            >
              + add
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function DayColumn({ dayKey, dayDate, slots, getMeta, setTaskMeta, mitCount, onAddSlot, onRemoveSlot, onMoveToSomeday }) {
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const jsDay = dayDate ? dayDate.getDay() : 0
  const dispIdx = jsDay === 0 ? 6 : jsDay - 1
  const dayName = dayNames[dispIdx] ?? dayKey?.slice(0, 3)
  const dayNum = dayDate ? dayDate.getDate() : ''
  const today = dayDate ? isToday(dayDate) : false

  // Focus minutes: deep_work + scheduled
  const focusMinutes = [
    ...(slots?.deep_work ?? []),
    ...(slots?.scheduled ?? []),
  ].reduce((sum, t) => sum + (getMeta(t.id).duration ?? 30), 0)

  return (
    <div style={{
      flex: 1,
      minWidth: 130,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      padding: '10px 7px',
      borderRadius: 14,
      border: `${today ? '2' : '1'}px solid ${today ? 'var(--accent)' : 'var(--border)'}`,
      background: today ? 'color-mix(in srgb, var(--accent) 3%, var(--surface))' : 'var(--surface)',
    }}>
      {/* Day header */}
      <div style={{ textAlign: 'center', paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
        <div style={{
          fontSize: 10,
          fontWeight: 600,
          color: 'var(--text-2)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}>
          {dayName}
        </div>
        <div style={{
          fontSize: 22,
          fontWeight: 700,
          color: today ? 'var(--accent)' : 'var(--text-1)',
          lineHeight: 1.1,
        }}>
          {dayNum}
        </div>
      </div>

      <Section day={dayKey} slotType="deep_work" tasks={slots?.deep_work ?? []} getMeta={getMeta} setTaskMeta={setTaskMeta} mitCount={mitCount} onAddSlot={onAddSlot} onRemoveSlot={onRemoveSlot} onMoveToSomeday={onMoveToSomeday} />
      <Section day={dayKey} slotType="scheduled" tasks={slots?.scheduled ?? []} getMeta={getMeta} setTaskMeta={setTaskMeta} mitCount={mitCount} onAddSlot={onAddSlot} onRemoveSlot={onRemoveSlot} onMoveToSomeday={onMoveToSomeday} />
      <Section day={dayKey} slotType="admin" tasks={slots?.admin ?? []} getMeta={getMeta} setTaskMeta={setTaskMeta} mitCount={mitCount} onAddSlot={onAddSlot} onRemoveSlot={onRemoveSlot} onMoveToSomeday={onMoveToSomeday} />

      <FocusBar focusMinutes={focusMinutes} />
    </div>
  )
}
