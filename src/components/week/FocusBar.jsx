const CAP_MINUTES = 420 // 7h

function fmt(min) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export default function FocusBar({ focusMinutes }) {
  const pct = Math.min((focusMinutes / CAP_MINUTES) * 100, 100)
  const color = focusMinutes >= CAP_MINUTES
    ? 'var(--danger)'
    : focusMinutes >= 300
      ? 'var(--sched)'
      : 'var(--accent)'

  return (
    <div style={{ padding: '6px 4px 2px' }}>
      <div style={{
        height: 3,
        background: 'var(--border)',
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: 3,
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          borderRadius: 2,
          transition: 'width 0.3s ease, background 0.3s ease',
        }} />
      </div>
      <div style={{
        fontSize: 10,
        color: focusMinutes >= CAP_MINUTES ? 'var(--danger)' : 'var(--text-2)',
        textAlign: 'center',
        fontWeight: 500,
      }}>
        {fmt(focusMinutes)} / 7h focus
      </div>
    </div>
  )
}
