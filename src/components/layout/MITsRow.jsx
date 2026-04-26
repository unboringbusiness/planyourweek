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
      padding: '10px 16px',
      gap: 12,
      borderBottom: '1px solid var(--col-sep)',
      background: 'var(--surface)',
      flexShrink: 0,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{
        fontSize: 10,
        fontWeight: 600,
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        whiteSpace: 'nowrap',
        lineHeight: 1.4,
        minWidth: 72,
      }}>
        Weekly<br />Milestones
      </div>

      <div style={{ display: 'flex', gap: 12, flex: 1 }}>
        {[0, 1, 2].map(i => {
          const mitTask = allMITs[i]
          const hasMITTask = Boolean(mitTask)
          const isFilled = Boolean(mitTask?.text || localMITs[i])

          return (
            <div
              key={i}
              style={{
                flex: 1,
                background: '#F9FAFB',
                border: `1.5px solid ${isFilled ? 'rgba(59,130,246,0.4)' : '#E5E7EB'}`,
                borderRadius: 8,
                padding: '10px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                minWidth: 0,
              }}
            >
              <span style={{
                fontSize: 11,
                fontWeight: 500,
                color: '#3B82F6',
              }}>
                Milestone {i + 1}
              </span>

              {hasMITTask ? (
                <div style={{
                  fontSize: 15,
                  fontWeight: 400,
                  color: 'var(--text-1)',
                  lineHeight: 1.4,
                }}>
                  {mitTask.text}
                </div>
              ) : (
                <input
                  style={{
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    fontSize: 15,
                    fontWeight: 400,
                    color: 'var(--text-1)',
                    width: '100%',
                    padding: 0,
                    fontFamily: 'inherit',
                  }}
                  placeholder="What will move the needle this week?"
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
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: 400,
        whiteSpace: 'nowrap',
      }}>
        {weekRange}
      </span>
    </div>
  )
}
