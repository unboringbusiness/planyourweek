import { getWeekDays, isToday } from '../../lib/dates'
import DayColumn from './DayColumn'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

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
    justifyContent: 'space-between',
    padding: '8px 24px 0',
    flexShrink: 0,
  },
  dayNav: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  navBtn: {
    background: 'none',
    border: '1px solid #E5E0D8',
    borderRadius: 8,
    width: 30,
    height: 30,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6B6B6B',
    fontSize: 14,
    cursor: 'pointer',
  },
  dayTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#133950',
    minWidth: 100,
    textAlign: 'center',
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
  content: {
    flex: 1,
    padding: '12px 24px 16px',
    overflowY: 'auto',
    display: 'flex',
  },
  expanded: {
    flex: 1,
    maxWidth: 480,
    margin: '0 auto',
  },
}

export default function DayView({ week, weekStart, activeDay, onSetDay, onWeekView, onAddSlot, onRemoveSlot }) {
  const dayIdx = DAYS.indexOf(activeDay)
  const weekDays = weekStart
    ? getWeekDays(new Date(weekStart + 'T00:00:00'))
    : Array(7).fill(null)

  const goToPrev = () => {
    if (dayIdx > 0) onSetDay(DAYS[dayIdx - 1])
  }

  const goToNext = () => {
    if (dayIdx < 6) onSetDay(DAYS[dayIdx + 1])
  }

  return (
    <div style={S.container}>
      <div style={S.toolbar}>
        <div style={S.dayNav}>
          <button style={S.navBtn} onClick={goToPrev} disabled={dayIdx <= 0} title="Previous day">‹</button>
          <span style={S.dayTitle}>{DAY_LABELS[dayIdx] ?? activeDay}</span>
          <button style={S.navBtn} onClick={goToNext} disabled={dayIdx >= 6} title="Next day">›</button>
        </div>

        <div style={S.viewToggle}>
          <button style={S.toggleBtn(false)} onClick={onWeekView}>Week</button>
          <button style={S.toggleBtn(true)}>Day</button>
        </div>
      </div>

      <div style={S.content}>
        <div style={S.expanded}>
          <DayColumn
            dayKey={activeDay}
            dayDate={weekDays[dayIdx]}
            slots={week?.slots?.[activeDay]}
            isToday={weekDays[dayIdx] ? isToday(weekDays[dayIdx]) : false}
            onAddSlot={onAddSlot}
            onRemoveSlot={onRemoveSlot}
            onDayView={() => {}}
          />
        </div>
      </div>
    </div>
  )
}
