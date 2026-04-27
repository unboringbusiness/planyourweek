import { useState, useEffect } from 'react'

export default function MITsRow({ week, weekStart, setMITs }) {
  const [localMITs, setLocalMITs] = useState(['', '', ''])

  useEffect(() => {
    if (week?.mits) setLocalMITs([...week.mits])
  }, [week?.mits])

  const handleChange = (i, val) => {
    const next = [...localMITs]
    next[i] = val
    setLocalMITs(next)
  }

  const handleBlur = () => setMITs?.(localMITs)

  const handleClear = (i) => {
    const next = [...localMITs]
    next[i] = ''
    setLocalMITs(next)
    setMITs?.(next)
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '10px 20px',
      gap: 12,
      borderBottom: '1px solid var(--col-sep)',
      background: 'var(--surface)',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 0 }}>
        {[0, 1, 2].map(i => {
          const isFilled = Boolean(localMITs[i])
          return (
            <div
              key={i}
              style={{
                flex: 1, minWidth: 0,
                border: `1.5px solid ${isFilled ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 10,
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                position: 'relative',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--accent)', marginBottom: 3 }}>
                  Milestone {i + 1}
                </div>
                <input
                  style={{
                    background: 'none', border: 'none', outline: 'none',
                    fontSize: 13, fontWeight: 400,
                    color: 'var(--text-1)', width: '100%', padding: 0,
                    fontFamily: 'inherit',
                  }}
                  placeholder="What will move the needle this week?"
                  value={localMITs[i] ?? ''}
                  onChange={e => handleChange(i, e.target.value)}
                  onBlur={handleBlur}
                  onKeyDown={e => { if (e.key === 'Enter') e.target.blur() }}
                  maxLength={120}
                />
              </div>
              {isFilled && (
                <button
                  onClick={() => handleClear(i)}
                  title="Clear milestone"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-2)', fontSize: 14, lineHeight: 1,
                    padding: '0 2px', flexShrink: 0,
                  }}
                >
                  ×
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
