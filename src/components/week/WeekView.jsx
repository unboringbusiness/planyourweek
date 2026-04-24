import { getWeekDays, isToday } from '../../lib/dates'
import DayColumn from './DayColumn'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

const S = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '8px 24px 0',
    flexShrink: 0,
  },
  viewToggle: {
    display: 'flex',
    gap: 2,
    background: '#EDE8E2',
    borderRadius: 8,
    padding: 2,
  },
  toggleBtn: (active) => ({
    padding: '4px 12px',
    borderRadius: 6,
    border: 'none',
    fontSize: 12,
    fontWeight: 500,
    background: active ? '#133950' : 'transparent',
    color: active ? '#FAF4ED' : '#6B6B6B',
    transition: 'background 0.15s, color 0.15s',
    cursor: 'pointer',
  }),
  grid: {
    flex: 1,
    display: 'flex',
    gap: 8,
    padding: '12px 24px 16px',
    overflowY: 'auto',
    alignItems: 'flex-start',
  },
}

export default function WeekView({ week, weekStart, onAddSlot, onRemoveSlot, onDayView }) {
  const weekDays = weekStart
    ? getWeekDays(new Date(weekStart + 'T00:00:00'))
    : Array(7).fill(null)

  return (
    <div style={S.container}>
      <div style={S.toolbar}>
        <div style={S.viewToggle}>
          <button style={S.toggleBtn(true)}>Week</button>
          <button
            style={S.toggleBtn(false)}
            onClick={() => {
              // find today's index and switch to day view
              const todayIdx = weekDays.findIndex(d => d && isToday(d))
              onDayView?.(DAYS[todayIdx >= 0 ? todayIdx : 0])
            }}
          >
            Day
          </button>
        </div>
      </div>

      <div style={S.grid}>
        {DAYS.map((dayKey, i) => (
          <DayColumn
            key={dayKey}
            dayKey={dayKey}
            dayDate={weekDays[i]}
            slots={week?.slots?.[dayKey]}
            isToday={weekDays[i] ? isToday(weekDays[i]) : false}
            onAddSlot={onAddSlot}
            onRemoveSlot={onRemoveSlot}
            onDayView={() => onDayView?.(dayKey)}
          />
        ))}
      </div>
    </div>
  )
}
