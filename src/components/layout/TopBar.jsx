import { formatWeekRange } from '../../lib/dates'

export default function TopBar({
  activeView, onViewChange, onDumpOpen, onSettingsOpen,
  theme, onThemeToggle, onHelpOpen, onScrollToToday,
  weekOffset, weekStart, onPrevWeek, onNextWeek, onGoToToday,
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
        <span style={{ fontSize: 18, letterSpacing: '-0.01em', lineHeight: 1 }}>
          <span style={{ fontWeight: 400, color: logoColor }}>plan</span>
          <span style={{ fontWeight: 400, color: logoColor }}>your</span>
          <span style={{ fontWeight: 700, color: '#3B82F6' }}>week</span>
          <span style={{ fontWeight: 400, fontSize: 11, color: '#9CA3AF' }}>.co</span>
        </span>
      </div>

      {/* Center: week navigation (only on week view) */}
      {activeView === 'week' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={onPrevWeek}
            title="Previous week"
            style={{
              background: 'none', border: 'none', width: 28, height: 28, borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, cursor: 'pointer', color: iconColor,
            }}
          >
            ‹
          </button>
          <span style={{
            fontSize: 13, fontWeight: 500, color: isCurrentWeek ? activeColor : '#3B82F6',
            minWidth: 120, textAlign: 'center', cursor: isCurrentWeek ? 'default' : 'pointer',
          }}
            onClick={!isCurrentWeek ? onGoToToday : undefined}
            title={!isCurrentWeek ? 'Click to go to current week' : undefined}
          >
            {isCurrentWeek ? weekLabel : `${weekLabel} ↩`}
          </span>
          <button
            onClick={onNextWeek}
            title="Next week"
            style={{
              background: 'none', border: 'none', width: 28, height: 28, borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, cursor: 'pointer', color: iconColor,
            }}
          >
            ›
          </button>
        </div>
      )}

      {/* Right: nav + controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {activeView === 'week' && !isCurrentWeek && (
          <button
            onClick={onGoToToday}
            style={{
              padding: '4px 12px', borderRadius: 6,
              border: `1px solid ${isDark ? '#3B82F6' : '#E5E7EB'}`,
              background: isDark ? 'rgba(59,130,246,0.1)' : '#FFFFFF',
              fontSize: 13, fontWeight: 500,
              color: '#3B82F6', cursor: 'pointer',
            }}
          >
            Today
          </button>
        )}
        {activeView === 'week' && isCurrentWeek && (
          <button
            onClick={onScrollToToday}
            style={{
              padding: '4px 12px', borderRadius: 6,
              border: `1px solid ${isDark ? '#3B82F6' : '#E5E7EB'}`,
              background: isDark ? 'rgba(59,130,246,0.1)' : '#FFFFFF',
              fontSize: 13, fontWeight: 500,
              color: '#3B82F6', cursor: 'pointer',
            }}
          >
            Today
          </button>
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
          Backlog
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
