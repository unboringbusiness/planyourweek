import { useState, useEffect, useCallback } from 'react'

function getWeekRange() {
  const d = new Date()
  const sunday = new Date(d)
  sunday.setDate(d.getDate() - d.getDay()) // back to Sunday
  const saturday = new Date(sunday)
  saturday.setDate(sunday.getDate() + 6)
  const fmt = (dt) => dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(sunday)} – ${fmt(saturday)}`
}

export default function MITsRow({ week, weekStart, setMITs, allMITs = [] }) {
  const [localMITs, setLocalMITs] = useState(['', '', ''])
  const [milestoneDone, setMilestoneDone] = useState([false, false, false])

  useEffect(() => {
    if (week?.mits) setLocalMITs([...week.mits])
  }, [week?.mits])

  const toggleDone = useCallback((i) => {
    setMilestoneDone(prev => prev.map((v, idx) => idx === i ? !v : v))
  }, [])

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

          const done = milestoneDone[i]
          return (
            <div
              key={i}
              style={{
                flex: 1,
                minWidth: 0,
                background: done ? '#F0FDF4' : '#FFFFFF',
                border: `1.5px solid ${done ? '#10B981' : isFilled ? '#3B82F6' : '#E5E7EB'}`,
                borderRadius: 10,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
              }}
            >
              {/* Done checkbox */}
              <div
                onClick={() => toggleDone(i)}
                style={{
                  width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                  border: done ? 'none' : '1.5px solid #D1D5DB',
                  background: done ? '#10B981' : 'transparent',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {done && (
                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                    <path d="M1 3.5l2.5 2.5 4.5-5" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: done ? '#10B981' : '#3B82F6', marginBottom: 3 }}>
                  Milestone {i + 1}
                </div>
                {hasMITTask ? (
                  <div style={{
                    fontSize: 14, fontWeight: 400,
                    color: done ? '#9CA3AF' : 'var(--text-1)',
                    lineHeight: 1.4,
                    textDecoration: done ? 'line-through' : 'none',
                  }}>
                    {mitTask.text}
                  </div>
                ) : (
                  <input
                    style={{
                      background: 'none', border: 'none', outline: 'none',
                      fontSize: 14, fontWeight: 400,
                      color: '#1A1A2E', width: '100%', padding: 0,
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
