function pad(n) { return String(Math.floor(n)).padStart(2, '0') }

function formatElapsed(ms) {
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${pad(m)}:${pad(s)}`
}

export default function FloatingTimer({ timer, onPause, onResume, onStop, onComplete }) {
  if (!timer) return null
  const { elapsed = 0, running, taskText } = timer

  return (
    <div style={{
      position: 'fixed',
      bottom: 70,
      right: 20,
      background: 'var(--surface)',
      border: '1.5px solid var(--border)',
      borderRadius: 14,
      padding: '10px 14px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.16)',
      zIndex: 250,
      minWidth: 180,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      {/* Elapsed */}
      <div style={{
        fontSize: 26,
        fontWeight: 700,
        color: running ? 'var(--text-1)' : 'var(--text-2)',
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '0.04em',
        lineHeight: 1,
      }}>
        {formatElapsed(elapsed)}
      </div>

      {/* Task name */}
      <div style={{
        fontSize: 11,
        color: 'var(--text-2)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: 160,
      }}>
        {taskText}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
        {/* Complete */}
        <button
          onClick={onComplete}
          title="Complete task & stop"
          style={{
            flex: 1, padding: '5px', borderRadius: 7, border: 'none',
            background: 'var(--success)', color: '#fff',
            fontSize: 14, cursor: 'pointer',
          }}
        >
          ✓
        </button>

        {/* Pause / Resume */}
        <button
          onClick={running ? onPause : onResume}
          title={running ? 'Pause' : 'Resume'}
          style={{
            flex: 1, padding: '5px', borderRadius: 7,
            border: '1px solid var(--border)', background: 'var(--surface-2)',
            color: 'var(--text-1)', fontSize: 14, cursor: 'pointer',
          }}
        >
          {running ? '⏸' : '▶'}
        </button>

        {/* Stop */}
        <button
          onClick={onStop}
          title="Stop timer"
          style={{
            flex: 1, padding: '5px', borderRadius: 7, border: 'none',
            background: 'var(--danger)', color: '#fff',
            fontSize: 14, cursor: 'pointer',
          }}
        >
          ■
        </button>
      </div>
    </div>
  )
}
