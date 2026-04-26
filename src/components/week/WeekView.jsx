import { useState, useEffect, useRef } from 'react'
import { getWeekDays, isToday } from '../../lib/dates'
import DayColumn from './DayColumn'

const DAYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']


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
  const scrollRef = useRef(null)
  const colRefs = useRef({})

  // Scroll so today is the first visible column on mount.
  useEffect(() => {
    const timer = setTimeout(() => {
      const todayEl = document.querySelector('[data-today="true"]')
      if (todayEl && scrollRef.current) {
        const containerRect = scrollRef.current.getBoundingClientRect()
        const elRect = todayEl.getBoundingClientRect()
        scrollRef.current.scrollLeft += elRect.left - containerRect.left
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [weekStart])

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
      ) : null}

      {/* Scroll container with right fade gradient */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div
          ref={scrollRef}
          data-scroll-container
          style={{
            position: 'absolute', inset: 0,
            display: 'flex',
            overflowX: focusDay ? 'hidden' : 'auto',
            overflowY: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {visibleDays.map((dayKey, i) => {
            const actualIdx = DAYS.indexOf(dayKey)
            const isLastVisible = i === visibleDays.length - 1
            return (
              <div
                key={dayKey}
                ref={el => { colRefs.current[dayKey] = el }}
                data-today={weekDays[actualIdx] && isToday(weekDays[actualIdx]) ? 'true' : undefined}
                style={{ width: 260, flexShrink: 0, flexGrow: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
              >
                <DayColumn
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
              </div>
            )
          })}
        </div>

        {/* Right-edge fade — indicates horizontal scroll without visible scrollbar */}
        {!focusDay && (
          <div
            style={{
              position: 'absolute', top: 0, right: 0, bottom: 0,
              width: 48,
              background: 'linear-gradient(to right, transparent, var(--bg))',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          />
        )}
      </div>
    </div>
  )
}
