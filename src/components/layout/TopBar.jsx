const S = {
  bar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    height: 56,
    borderBottom: '1px solid #E5E0D8',
    background: '#FAF4ED',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    flexShrink: 0,
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    fontWeight: 600,
    fontSize: 15,
    color: '#133950',
    letterSpacing: '-0.02em',
  },
  dumpToggle: {
    background: 'none',
    border: '1px solid #E5E0D8',
    borderRadius: 8,
    padding: '4px 8px',
    color: '#6B6B6B',
    fontSize: 14,
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  nav: {
    display: 'flex',
    gap: 4,
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
  },
  settingsBtn: {
    background: 'none',
    border: '1px solid #E5E0D8',
    borderRadius: 8,
    width: 34,
    height: 34,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6B6B6B',
    fontSize: 16,
  },
}

function navBtn(active) {
  return {
    background: active ? '#133950' : 'none',
    border: 'none',
    borderRadius: 8,
    padding: '5px 12px',
    fontSize: 13,
    fontWeight: 500,
    color: active ? '#FAF4ED' : '#6B6B6B',
    transition: 'background 0.15s, color 0.15s',
  }
}

export default function TopBar({ activeView, onViewChange, dumpOpen, onDumpToggle, onSettingsOpen, onReset }) {
  const handleNav = (label) => {
    if (label === 'Reset') { onReset?.(); return }
    if (label === 'Dump') { onDumpToggle?.(); return }
    onViewChange?.(label.toLowerCase())
  }

  return (
    <header style={S.bar}>
      <div style={S.left}>
        <button style={S.dumpToggle} onClick={onDumpToggle} title="Toggle Brain Dump">
          <span style={{ fontSize: 12 }}>{dumpOpen ? '◀' : '▶'}</span>
          <span>Dump</span>
        </button>
        <span style={S.logo}>planyourweek.co</span>
      </div>

      <nav style={S.nav}>
        {['Week', 'Dump', 'Projects', 'Reset'].map(label => (
          <button
            key={label}
            style={navBtn((label === 'Week' && activeView === 'week') || (label === 'Projects' && activeView === 'projects'))}
            onClick={() => handleNav(label)}
          >
            {label}
          </button>
        ))}
      </nav>

      <button style={S.settingsBtn} onClick={onSettingsOpen} title="Settings / Account">
        ⚙
      </button>
    </header>
  )
}
