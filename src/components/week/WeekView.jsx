import { getWeekDays } from '../../lib/dates'
import DayColumn from './DayColumn'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

export default function WeekView({
  week,
  weekStart,
  getMeta,
  setTaskMeta,
  mitCount,
  onAddSlot,
  onRemoveSlot,
  onMoveToSomeday,
}) {
  const weekDays = weekStart
    ? getWeekDays(new Date(weekStart + 'T00:00:00'))
    : Array(7).fill(null)

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      gap: 8,
      padding: '12px 16px 16px',
      overflowX: 'auto',
      overflowY: 'auto',
      alignItems: 'flex-start',
    }}>
      {DAYS.map((dayKey, i) => (
        <DayColumn
          key={dayKey}
          dayKey={dayKey}
          dayDate={weekDays[i]}
          slots={week?.slots?.[dayKey]}
          getMeta={getMeta}
          setTaskMeta={setTaskMeta}
          mitCount={mitCount}
          onAddSlot={onAddSlot}
          onRemoveSlot={onRemoveSlot}
          onMoveToSomeday={onMoveToSomeday}
        />
      ))}
    </div>
  )
}
