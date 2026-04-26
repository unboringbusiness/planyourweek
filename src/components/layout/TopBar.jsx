export default function TopBar({ activeView, onViewChange, onDumpOpen, theme, onThemeToggle, onHelpOpen }) {
  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px', height: 52,
      background: '#1A1A2E',
      flexShrink: 0, position: 'sticky', top: 0, zIndex: 100,
    }}>
      <span style={{ fontWeight: 600, fontSize: 15, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
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
              color: activeView === id ? '#FFFFFF' : 'rgba(255,255,255,0.55)',
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
            color: 'rgba(255,255,255,0.55)', cursor: 'pointer',
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
            fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
          }}
        >
          ?
        </button>
        <button
          onClick={onThemeToggle}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          style={{
            background: 'none', border: 'none', borderRadius: 6,
            width: 30, height: 30,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, cursor: 'pointer', color: 'rgba(255,255,255,0.6)',
          }}
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </div>
    </header>
  )
}
