import { useState, useEffect } from 'react'

function getWeekRange() {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + diff)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const fmt = (dt) => dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(monday)} – ${fmt(sunday)}`
}

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

  const weekRange = getWeekRange()

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '10px 20px',
      gap: 12,
      borderBottom: '1px solid var(--col-sep)',
      background: 'var(--surface)',
      flexShrink: 0,
      overflow: 'visible',
    }}>
      <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 0 }}>
        {[0, 1, 2].map(i => {
          const mitTask = allMITs[i]
          const hasMITTask = Boolean(mitTask)
          const isFilled = Boolean(mitTask?.text || localMITs[i])

          return (
            <div
              key={i}
              style={{
                flex: 1,
                minWidth: 0,
                background: '#FFFFFF',
                border: `1.5px solid ${isFilled ? '#3B82F6' : '#E5E7EB'}`,
                borderRadius: 10,
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
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
                    fontSize: 14,
                    fontWeight: 400,
                    color: '#1A1A2E',
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
