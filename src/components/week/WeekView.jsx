import { useState } from 'react'
import { getWeekDays, isToday } from '../../lib/dates'
import DayColumn from './DayColumn'

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']

export default function WeekView({
  week, weekStart, getMeta, setTaskMeta, mitCount,
  onAddSlot, onRemoveSlot, onMoveToSomeday, onMoveToTomorrow,
  onOpenDetail, onStartTimer,
  onStartupRitual, onShutdownRitual,
}) {
  const weekDays = weekStart
    ? getWeekDays(new Date(weekStart + 'T00:00:00'))
    : Array(7).fill(null)

  const todayIdx = weekDays.findIndex(d => d && isToday(d))
  const [focusDay, setFocusDay] = useState(null) // dayKey or null

  const handleFocusMode = (dayKey) => {
    setFocusDay(prev => prev === dayKey ? null : dayKey)
  }

  const visibleDays = focusDay ? DAYS.filter(d => d === focusDay) : DAYS

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {focusDay && (
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
      )}

      <div style={{
        flex: 1, display: 'flex', gap: 7,
        padding: '10px 14px 14px',
        overflowX: focusDay ? 'hidden' : 'auto',
        overflowY: 'auto', alignItems: 'flex-start',
      }}>
        {visibleDays.map((dayKey, i) => {
          const actualIdx = DAYS.indexOf(dayKey)
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
            />
          )
        })}
      </div>
    </div>
  )
}
