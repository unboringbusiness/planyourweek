import { useState, useEffect } from 'react'
import { formatWeekRange } from '../../lib/dates'

export default function MITsRow({ week, weekStart, setMITs, allMITs = [] }) {
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

  const weekRange = weekStart
    ? formatWeekRange(new Date(weekStart + 'T00:00:00'))
    : ''

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '8px 16px',
      gap: 10,
      borderBottom: '1px solid var(--col-sep)',
      background: 'var(--bg)',
      flexShrink: 0,
    }}>
      <div style={{
        fontSize: 9,
        fontWeight: 700,
        color: 'var(--accent)',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        whiteSpace: 'nowrap',
        lineHeight: 1.3,
        maxWidth: 72,
      }}>
        This Week's<br />3 Milestones
      </div>

      <div style={{ display: 'flex', gap: 8, flex: 1 }}>
        {[0, 1, 2].map(i => {
          const mitTask = allMITs[i]
          const mitText = mitTask?.text || localMITs[i] || ''
          const hasMITTask = Boolean(mitTask)

          return (
            <div
              key={i}
              style={{
                flex: 1,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '7px 11px',
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                minWidth: 0,
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <span style={{
                fontSize: 9,
                fontWeight: 700,
                color: 'var(--accent)',
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
              }}>
                M{i + 1}
              </span>

              {hasMITTask ? (
                <div style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--text-1)',
                  lineHeight: 1.35,
                }}>
                  {mitTask.text}
                </div>
              ) : (
                <input
                  style={{
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    fontSize: 12,
                    fontWeight: 500,
                    color: 'var(--text-1)',
                    width: '100%',
                    padding: 0,
                    fontFamily: 'inherit',
                  }}
                  placeholder="What must happen this week…"
                  value={localMITs[i] ?? ''}
                  onChange={e => handleChange(i, e.target.value)}
                  onBlur={handleBlur}
                  maxLength={120}
                />
              )}
            </div>
          )
        })}
      </div>

      <span style={{
        fontSize: 11,
        color: 'var(--text-2)',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        marginLeft: 4,
      }}>
        {weekRange}
      </span>
    </div>
  )
}
