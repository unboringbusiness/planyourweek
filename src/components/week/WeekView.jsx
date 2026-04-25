import { useState } from 'react'
import { getWeekDays, isToday } from '../../lib/dates'
import DayColumn from './DayColumn'

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']

function SlotLegend() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '6px 14px 0',
      flexShrink: 0,
    }}>
      {[
        { color: '#3B82F6', label: 'Deep Work' },
        { color: '#F08F48', label: 'Focus' },
        { color: '#D0CEC9', label: 'Others' },
      ].map(({ color, label }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 400 }}>{label}</span>
        </div>
      ))}
    </div>
  )
}

export default function WeekView({
  week, weekStart, getMeta, setTaskMeta, mitCount,
  onAddSlot, onRemoveSlot, onMoveToSomeday, onMoveToTomorrow,
  onOpenDetail, onStartTimer,
  onStartupRitual, onShutdownRitual,
}) {
  const weekDays = weekStart
    ? getWeekDays(new Date(weekStart + 'T00:00:00'))
    : Array(7).fill(null)

  const [focusDay, setFocusDay] = useState(null)

  const handleFocusMode = (dayKey) => {
    setFocusDay(prev => prev === dayKey ? null : dayKey)
  }

  const visibleDays = focusDay ? DAYS.filter(d => d === focusDay) : DAYS

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {focusDay ? (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          padding: '6px 16px 0', flexShrink: 0,
        }}>
          <button
            onClick={() => setFocusDay(null)}
            style={{
              background: 'var(--accent)', border: 'none', borderRadius: 7,
              padding: '4px 12px', fontSize: 12, fontWeight: 600,
              color: '#fff', cursor: 'pointer',
            }}
          >
            Exit Focus
          </button>
        </div>
      ) : (
        <SlotLegend />
      )}

      <div style={{
        flex: 1,
        display: 'flex',
        overflowX: focusDay ? 'hidden' : 'auto',
        overflowY: 'auto',
      }}>
        {visibleDays.map((dayKey, i) => {
          const actualIdx = DAYS.indexOf(dayKey)
          const isLastVisible = i === visibleDays.length - 1
          return (
            <DayColumn
              key={dayKey}
              dayKey={dayKey}
              dayDate={weekDays[actualIdx]}
              slots={week?.slots?.[dayKey]}
              getMeta={getMeta}
              setTaskMeta={setTaskMeta}
              mitCount={mitCount}
              onAddSlot={onAddSlot}
              onRemoveSlot={onRemoveSlot}
              onMoveToSomeday={onMoveToSomeday}
              onMoveToTomorrow={onMoveToTomorrow}
              onOpenDetail={onOpenDetail}
              onStartTimer={onStartTimer}
              onFocusMode={() => handleFocusMode(dayKey)}
              onStartupRitual={() => onStartupRitual?.(dayKey)}
              onShutdownRitual={() => onShutdownRitual?.(dayKey)}
              focusModeActive={focusDay === dayKey}
              isLast={isLastVisible}
            />
          )
        })}
      </div>
    </div>
  )
}
