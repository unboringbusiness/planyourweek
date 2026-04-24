export default function TopBar({ activeView, onViewChange, onDumpOpen, theme, onThemeToggle }) {
  const navBtn = (id, label) => (
    <button
      key={id}
      onClick={() => onViewChange(id)}
      style={{
        background: activeView === id ? 'var(--text-1)' : 'none',
        border: 'none',
        borderRadius: 7,
        padding: '5px 13px',
        fontSize: 13,
        fontWeight: 500,
        color: activeView === id ? 'var(--bg)' : 'var(--text-2)',
        transition: 'background 0.12s, color 0.12s',
      }}
    >
      {label}
    </button>
  )

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      height: 52,
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg)',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <span style={{
        fontWeight: 600,
        fontSize: 14,
        color: 'var(--text-1)',
        letterSpacing: '-0.02em',
      }}>
        planyourweek.co
      </span>

      {/* Nav */}
      <nav style={{
        display: 'flex',
        gap: 2,
        background: 'var(--surface-2)',
        borderRadius: 9,
        padding: 2,
      }}>
        {navBtn('week', 'Week')}
        <button
          onClick={onDumpOpen}
          style={{
            background: 'none',
            border: 'none',
            borderRadius: 7,
            padding: '5px 13px',
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text-2)',
          }}
        >
          Dump
        </button>
        {navBtn('reset', 'Reset')}
      </nav>

      {/* Right controls */}
      <div style={{ display: 'flex', gap: 6 }}>
        {/* Theme toggle */}
        <button
          onClick={onThemeToggle}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 7,
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 15,
          }}
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </div>
    </header>
  )
}
