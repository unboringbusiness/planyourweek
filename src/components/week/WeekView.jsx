import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { getWeekDays, isToday } from '../../lib/dates'
import DayColumn from './DayColumn'

const DAY_NAMES = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']

function pad(n) { return String(Math.floor(n)).padStart(2, '0') }
function formatMs(ms) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  return `${pad(m)}:${pad(s % 60)}`
}

const BREAK_DURATION_MS = 5 * 60 * 1000

function FocusPanel({ timer, onPause, onResume, onStop, onComplete, onExit }) {
  const [tab, setTab] = useState('focus')
  const [breakMs, setBreakMs] = useState(BREAK_DURATION_MS)
  const [breakRunning, setBreakRunning] = useState(false)
  const breakRef = useRef(null)

  useEffect(() => {
    if (breakRunning && breakMs > 0) {
      breakRef.current = setInterval(() => {
        setBreakMs(prev => {
          if (prev <= 500) { setBreakRunning(false); return 0 }
          return prev - 500
        })
      }, 500)
    } else {
      clearInterval(breakRef.current)
    }
    return () => clearInterval(breakRef.current)
  }, [breakRunning, breakMs])

  const startBreak = () => { setBreakMs(BREAK_DURATION_MS); setBreakRunning(true) }
  const stopBreak  = () => { setBreakRunning(false); setBreakMs(BREAK_DURATION_MS) }

  const baseBtn = {
    border: 'none', borderRadius: 10, padding: '12px 24px',
    fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  }

  return (
    <div style={{
      width: 360, flexShrink: 0, display: 'flex', flexDirection: 'column',
      borderLeft: '1px solid var(--border)', background: 'var(--bg)',
      overflow: 'hidden',
    }}>
      {/* Header row with exit button */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0,
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Focus Mode
        </span>
        <button
          onClick={onExit}
          style={{
            background: 'none', border: '1px solid var(--border)',
            borderRadius: 6, padding: '3px 10px',
            fontSize: 12, color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Exit ×
        </button>
      </div>

      {/* Tabs */}
      <div style={{ padding: '16px 20px 0', flexShrink: 0 }}>
        <div style={{
          display: 'flex', background: 'var(--surface-2)',
          borderRadius: 10, padding: 4, gap: 4,
        }}>
          {[['focus', '🎯 Focus'], ['break', '☕ Break']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                flex: 1, padding: '8px', borderRadius: 8, border: 'none',
                background: tab === key ? 'var(--surface)' : 'transparent',
                color: tab === key ? 'var(--text-1)' : 'var(--text-2)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: tab === key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 24px 40px' }}>
        {tab === 'focus' ? (
          timer ? (
            <>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                Now focusing on
              </div>
              <div style={{
                fontSize: 16, fontWeight: 700, color: 'var(--text-1)',
                textAlign: 'center', maxWidth: 300, marginBottom: 28,
                lineHeight: 1.4,
              }}>
                {timer.taskText}
              </div>

              {/* Big elapsed timer */}
              <div style={{
                fontSize: 68, fontWeight: 700, lineHeight: 1,
                fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em',
                color: timer.running ? 'var(--success)' : 'var(--text-2)',
                transition: 'color 0.3s',
                marginBottom: 8,
              }}>
                {formatMs(timer.elapsed ?? 0)}
              </div>

              <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 32 }}>
                {timer.running ? 'Running' : 'Paused'}
              </div>

              {/* Controls */}
              <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                <button
                  onClick={timer.running ? onPause : onResume}
                  style={{ ...baseBtn, flex: 1, background: 'var(--surface-2)', color: 'var(--text-1)' }}
                >
                  {timer.running ? '⏸ Pause' : '▶ Resume'}
                </button>
                <button
                  onClick={onComplete}
                  style={{ ...baseBtn, flex: 1, background: 'var(--success)', color: '#fff' }}
                >
                  ✓ Done
                </button>
              </div>
              <button
                onClick={onStop}
                style={{ ...baseBtn, width: '100%', marginTop: 8, background: 'transparent', color: 'var(--text-2)', border: '1px solid var(--border)' }}
              >
                ■ Stop timer
              </button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🎯</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>
                No task running
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', textAlign: 'center', lineHeight: 1.6, maxWidth: 240 }}>
                Click the timer icon (⏱) on any task to the left to start focusing
              </div>
            </>
          )
        ) : (
          /* Break tab */
          <>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 20 }}>
              5-minute break
            </div>
            <div style={{
              fontSize: 68, fontWeight: 700, lineHeight: 1,
              fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em',
              color: breakRunning ? 'var(--accent)' : 'var(--text-2)',
              transition: 'color 0.3s',
              marginBottom: 32,
            }}>
              {formatMs(breakMs)}
            </div>
            <button
              onClick={breakRunning ? stopBreak : startBreak}
              style={{ ...baseBtn, width: '100%', background: breakRunning ? 'var(--danger)' : 'var(--accent)', color: '#fff' }}
            >
              {breakRunning ? '■ Stop break' : '▶ Start break'}
            </button>
            {breakMs === 0 && !breakRunning && (
              <div style={{ marginTop: 16, fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>
                Break over — back to work! 🎯
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function WeekView({
  week, weekStart, getMeta, setTaskMeta, mitCount,
  onAddSlot, onRemoveSlot, onReorderSlots, onMoveToSomeday, onMoveToTomorrow,
  onOpenDetail, onStartTimer,
  onStartupRitual, onShutdownRitual,
  timerHook,
}) {
  const weekDays = weekStart
    ? getWeekDays(new Date(weekStart + 'T00:00:00'))
    : Array(7).fill(null)

  // Derive day keys from actual dates so week can start on any weekday
  const displayDays = weekDays.map(d => d ? DAY_NAMES[d.getDay()] : null).filter(Boolean)

  const [focusDay, setFocusDay] = useState(null)
  const scrollRef = useRef(null)
  const colRefs = useRef({})
  const isFirstRender = useRef(true)

  const scrollToToday = useCallback(() => {
    setTimeout(() => {
      const todayEl = document.querySelector('[data-today="true"]')
      if (todayEl && scrollRef.current) {
        scrollRef.current.scrollLeft = 0
        requestAnimationFrame(() => {
          if (!scrollRef.current) return
          const containerRect = scrollRef.current.getBoundingClientRect()
          const elRect = todayEl.getBoundingClientRect()
          scrollRef.current.scrollLeft = elRect.left - containerRect.left
        })
      }
    }, 150)
  }, [])

  // On first render: scroll to today. On subsequent week changes: reset to start of week.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      scrollToToday()
    } else if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0
    }
  }, [weekStart, scrollToToday])

  // Expose for parent to call via ref
  useEffect(() => {
    window._scrollWeekToToday = scrollToToday
    return () => { delete window._scrollWeekToToday }
  }, [scrollToToday])

  const handleFocusMode = (dayKey) => {
    setFocusDay(prev => prev === dayKey ? null : dayKey)
  }

  // Build a map of day → next day based on actual display order
  const nextDayMap = useMemo(() => {
    const days = weekStart
      ? getWeekDays(new Date(weekStart + 'T00:00:00')).map(d => DAY_NAMES[d.getDay()])
      : DAY_NAMES.slice(1).concat(DAY_NAMES[0]) // fallback Mon-Sun
    const map = {}
    for (let i = 0; i < days.length - 1; i++) {
      map[days[i]] = days[i + 1]
    }
    return map
  }, [weekStart])

  const visibleDays = focusDay ? displayDays.filter(d => d === focusDay) : displayDays

  if (focusDay) {
    const focusIdx = displayDays.indexOf(focusDay)
    return (
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left: single day column, scrollable */}
        <div style={{
          width: 320, flexShrink: 0, overflowY: 'auto',
          background: 'var(--col-today-bg)',
          borderRight: '1px solid var(--border)',
        }}>
          <DayColumn
            dayKey={focusDay}
            dayDate={weekDays[focusIdx]}
            slots={week?.slots?.[focusDay]}
            getMeta={getMeta}
            setTaskMeta={setTaskMeta}
            mitCount={mitCount}
            onAddSlot={onAddSlot}
            onRemoveSlot={onRemoveSlot}
            onReorderSlots={onReorderSlots}
            onMoveToSomeday={onMoveToSomeday}
            onMoveToTomorrow={onMoveToTomorrow}
            onOpenDetail={onOpenDetail}
            onStartTimer={onStartTimer}
            onFocusMode={() => handleFocusMode(focusDay)}
            onStartupRitual={() => onStartupRitual?.(focusDay)}
            onShutdownRitual={() => onShutdownRitual?.(focusDay)}
            focusModeActive={true}
            isLast={true}
            nextDayMap={nextDayMap}
          />
        </div>

        {/* Right: focus timer panel */}
        <FocusPanel
          timer={timerHook?.timer}
          onPause={timerHook?.pause}
          onResume={timerHook?.resume}
          onStop={timerHook?.stop}
          onComplete={() => {
            if (timerHook?.timer?.taskId) {
              const actualMinutes = Math.round((timerHook.timer.elapsed ?? 0) / 60000)
              setTaskMeta(timerHook.timer.taskId, { done: true, actualMinutes })
            }
            timerHook?.stop()
          }}
          onExit={() => setFocusDay(null)}
        />
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Scroll container with right fade gradient */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div
          ref={scrollRef}
          data-scroll-container
          style={{
            position: 'absolute', inset: 0,
            display: 'flex',
            overflowX: 'auto',
            overflowY: 'hidden',
            scrollbarWidth: 'thin',
            scrollbarColor: '#D1D5DB transparent',
          }}
        >
          {visibleDays.map((dayKey, i) => {
            const isLastVisible = i === visibleDays.length - 1
            return (
              <div
                key={dayKey}
                ref={el => { colRefs.current[dayKey] = el }}
                data-today={weekDays[i] && isToday(weekDays[i]) ? 'true' : undefined}
                style={{ width: 260, flexShrink: 0, flexGrow: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
              >
                <DayColumn
                  dayKey={dayKey}
                  dayDate={weekDays[i]}
                  slots={week?.slots?.[dayKey]}
                  getMeta={getMeta}
                  setTaskMeta={setTaskMeta}
                  mitCount={mitCount}
                  onAddSlot={onAddSlot}
                  onRemoveSlot={onRemoveSlot}
                  onReorderSlots={onReorderSlots}
                  onMoveToSomeday={onMoveToSomeday}
                  onMoveToTomorrow={onMoveToTomorrow}
                  onOpenDetail={onOpenDetail}
                  onStartTimer={onStartTimer}
                  onFocusMode={() => handleFocusMode(dayKey)}
                  onStartupRitual={() => onStartupRitual?.(dayKey)}
                  onShutdownRitual={() => onShutdownRitual?.(dayKey)}
                  focusModeActive={focusDay === dayKey}
                  isLast={isLastVisible}
                  nextDayMap={nextDayMap}
                />
              </div>
            )
          })}
        </div>

        {/* Right-edge fade */}
        <div
          style={{
            position: 'absolute', top: 0, right: 0, bottom: 0,
            width: 48,
            background: 'linear-gradient(to right, transparent, var(--bg))',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />
      </div>
    </div>
  )
}
