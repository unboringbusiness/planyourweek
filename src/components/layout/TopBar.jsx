import { formatWeekRange } from '../../lib/dates'

const DAY_OPTIONS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
]

export default function TopBar({
  activeView, onViewChange, onDumpOpen, onSettingsOpen,
  theme, onThemeToggle, onHelpOpen, onScrollToToday,
  weekOffset, weekStart, onPrevWeek, onNextWeek, onGoToToday,
  onLogoClick, weekStartDay, onWeekStartDayChange,
}) {
  const isDark = theme === 'dark'
  const bg = isDark ? '#1E1E1E' : '#FFFFFF'
  const borderColor = isDark ? '#2A2A2A' : '#E5E7EB'
  const logoColor = isDark ? '#F5F5F5' : '#1A1A2E'
  const inactiveColor = isDark ? 'rgba(245,245,245,0.5)' : '#6B7280'
  const activeColor = isDark ? '#F5F5F5' : '#1A1A2E'
  const iconColor = isDark ? 'rgba(245,245,245,0.5)' : '#6B7280'

  const weekLabel = weekStart ? formatWeekRange(new Date(weekStart + 'T00:00:00')) : ''
  const isCurrentWeek = weekOffset === 0

  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px', height: 52,
      background: bg,
      borderBottom: `1px solid ${borderColor}`,
      flexShrink: 0, position: 'sticky', top: 0, zIndex: 100,
    }}>
      {/* Left: logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18, letterSpacing: '-0.01em', lineHeight: 1, cursor: 'pointer' }} onClick={onLogoClick}>
          <span style={{ fontWeight: 400, color: logoColor }}>plan</span>
          <span style={{ fontWeight: 400, color: logoColor }}>your</span>
          <span style={{ fontWeight: 700, color: '#3B82F6' }}>week</span>
          <span style={{ fontWeight: 400, fontSize: 11, color: '#9CA3AF' }}>.co</span>
        </span>
        <a
          href="https://ultrafocus.co"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 10, color: '#9CA3AF', textDecoration: 'none', marginLeft: 2 }}
        >
          by ultrafocus
        </a>
      </div>

      {/* Right: nav + controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {/* Week navigation — inline with other controls */}
        {activeView === 'week' && (
          <>
            <button
              onClick={onPrevWeek}
              title="Previous 7 days"
              style={{
                background: 'none', border: 'none', width: 26, height: 26, borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, cursor: 'pointer', color: iconColor, lineHeight: 1,
              }}
            >
              ‹
            </button>
            <span
              onClick={!isCurrentWeek ? onGoToToday : undefined}
              title={!isCurrentWeek ? 'Go to current week' : undefined}
              style={{
                fontSize: 12, fontWeight: 500,
                color: isCurrentWeek ? inactiveColor : '#3B82F6',
                minWidth: 110, textAlign: 'center',
                cursor: isCurrentWeek ? 'default' : 'pointer',
              }}
            >
              {weekLabel}
            </span>
            <button
              onClick={onNextWeek}
              title="Next 7 days"
              style={{
                background: 'none', border: 'none', width: 26, height: 26, borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, cursor: 'pointer', color: iconColor, lineHeight: 1,
              }}
            >
              ›
            </button>
            <button
              onClick={isCurrentWeek ? onScrollToToday : onGoToToday}
              style={{
                padding: '4px 10px', borderRadius: 6,
                border: `1px solid ${isDark ? '#3B82F6' : '#E5E7EB'}`,
                background: isDark ? 'rgba(59,130,246,0.1)' : '#FFFFFF',
                fontSize: 12, fontWeight: 500,
                color: '#3B82F6', cursor: 'pointer',
              }}
            >
              Today
            </button>
            <select
              value={weekStartDay}
              onChange={e => onWeekStartDayChange(Number(e.target.value))}
              title="Week starts on"
              style={{
                padding: '3px 4px', borderRadius: 6,
                border: `1px solid ${borderColor}`,
                background: isDark ? '#2A2A2A' : '#fff',
                fontSize: 11, color: iconColor, cursor: 'pointer',
                fontFamily: 'inherit', outline: 'none',
              }}
            >
              {DAY_OPTIONS.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
            <div style={{ width: 1, height: 20, background: borderColor, margin: '0 2px' }} />
          </>
        )}
        {[['week','Week'],['reset','End of Week']].map(([id, label]) => (
          <button
            key={id}
            onClick={() => onViewChange(id)}
            style={{
              background: 'none', border: 'none',
              borderBottom: activeView === id ? '2px solid #3B82F6' : '2px solid transparent',
              padding: '4px 14px', fontSize: 14, fontWeight: 500,
              color: activeView === id ? activeColor : inactiveColor,
              cursor: 'pointer', transition: 'color 0.12s', lineHeight: '44px',
            }}
          >
            {label}
          </button>
        ))}
        <button
          data-tour="dump-btn"
          onClick={onDumpOpen}
          style={{
            background: 'none', border: 'none',
            borderBottom: '2px solid transparent',
            padding: '4px 14px', fontSize: 14, fontWeight: 500,
            color: inactiveColor, cursor: 'pointer', lineHeight: '44px',
          }}
        >
          Capture
        </button>
        <div style={{ width: 1, height: 20, background: borderColor, margin: '0 4px' }} />
        <button
          onClick={onSettingsOpen}
          title="Settings"
          style={{
            background: 'none', border: 'none', width: 30, height: 30, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, cursor: 'pointer', color: iconColor,
          }}
        >
          ⚙
        </button>
        <button
          onClick={onHelpOpen}
          title="Guided walkthrough"
          style={{
            background: 'none', border: 'none', width: 30, height: 30, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, fontWeight: 600, color: iconColor, cursor: 'pointer',
          }}
        >
          ?
        </button>
        <button
          onClick={onThemeToggle}
          title={isDark ? 'Light mode' : 'Dark mode'}
          style={{
            background: 'none', border: 'none', borderRadius: 6, width: 30, height: 30,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, cursor: 'pointer', color: iconColor,
          }}
        >
          {isDark ? '☀' : '☾'}
        </button>
      </div>
    </header>
  )
}
