export default function TopBar({ activeView, onViewChange, onDumpOpen, theme, onThemeToggle, onHelpOpen }) {
  const isDark = theme === 'dark'
  const bg = isDark ? '#1E1E1E' : '#FFFFFF'
  const borderColor = isDark ? '#2A2A2A' : '#E5E7EB'
  const logoColor = isDark ? '#F5F5F5' : '#1A1A2E'
  const inactiveColor = isDark ? 'rgba(245,245,245,0.5)' : '#6B7280'
  const activeColor = isDark ? '#F5F5F5' : '#1A1A2E'
  const iconColor = isDark ? 'rgba(245,245,245,0.5)' : '#6B7280'

  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px', height: 52,
      background: bg,
      borderBottom: `1px solid ${borderColor}`,
      flexShrink: 0, position: 'sticky', top: 0, zIndex: 100,
    }}>
      <span style={{ fontWeight: 600, fontSize: 15, color: logoColor, letterSpacing: '-0.01em' }}>
        planyourweek.co
      </span>

      <nav style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        {[['week','Week'],['reset','Review']].map(([id, label]) => (
          <button
            key={id}
            onClick={() => onViewChange(id)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeView === id ? '2px solid #3B82F6' : '2px solid transparent',
              padding: '4px 14px',
              fontSize: 14, fontWeight: 500,
              color: activeView === id ? activeColor : inactiveColor,
              cursor: 'pointer',
              transition: 'color 0.12s',
              lineHeight: '44px',
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
            color: inactiveColor, cursor: 'pointer',
            lineHeight: '44px',
          }}
        >
          Dump
        </button>
      </nav>

      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <button
          onClick={onHelpOpen}
          title="Guided walkthrough"
          style={{
            background: 'none', border: 'none',
            width: 30, height: 30, borderRadius: '50%',
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
            background: 'none', border: 'none', borderRadius: 6,
            width: 30, height: 30,
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
