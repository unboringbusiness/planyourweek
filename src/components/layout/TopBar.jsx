export default function TopBar({ activeView, onViewChange, onDumpOpen, theme, onThemeToggle, onHelpOpen }) {
  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px', height: 50,
      borderBottom: '1px solid var(--border)', background: 'var(--bg)',
      flexShrink: 0, position: 'sticky', top: 0, zIndex: 100,
    }}>
      <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
        planyourweek.co
      </span>

      <nav style={{
        display: 'flex', gap: 2,
        background: 'var(--surface-2)', borderRadius: 9, padding: 2,
      }}>
        {[['week','Week'],['reset','Reset']].map(([id, label]) => (
          <button
            key={id}
            onClick={() => onViewChange(id)}
            style={{
              background: activeView === id ? 'var(--text-1)' : 'none',
              border: 'none', borderRadius: 7, padding: '4px 12px',
              fontSize: 13, fontWeight: 500,
              color: activeView === id ? 'var(--bg)' : 'var(--text-2)',
              transition: 'background 0.12s, color 0.12s', cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
        <button
          data-tour="dump-btn"
          onClick={onDumpOpen}
          style={{
            background: 'none', border: 'none', borderRadius: 7,
            padding: '4px 12px', fontSize: 13, fontWeight: 500,
            color: 'var(--text-2)', cursor: 'pointer',
          }}
        >
          Dump
        </button>
      </nav>

      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
        <button
          onClick={onHelpOpen}
          title="Guided walkthrough"
          style={{
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            borderRadius: '50%', width: 28, height: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 600, color: 'var(--text-2)', cursor: 'pointer',
          }}
        >
          ?
        </button>
        <button
          onClick={onThemeToggle}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          style={{
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            borderRadius: 7, width: 30, height: 30,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
            cursor: 'pointer',
          }}
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </div>
    </header>
  )
}
