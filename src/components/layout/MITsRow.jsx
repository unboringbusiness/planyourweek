import { useState, useEffect } from 'react'
import { formatWeekRange, getWeekStart, getWeekDays } from '../../lib/dates'

const S = {
  row: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 24px',
    gap: 12,
    borderBottom: '1px solid #E5E0D8',
    background: '#FAF4ED',
    flexShrink: 0,
  },
  label: {
    fontSize: 11,
    fontWeight: 600,
    color: '#6B6B6B',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginRight: 4,
    whiteSpace: 'nowrap',
  },
  cardsWrap: {
    display: 'flex',
    gap: 10,
    flex: 1,
  },
  card: {
    flex: 1,
    background: '#FFF9E6',
    border: '1.5px solid #FFD156',
    borderRadius: 12,
    padding: '8px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    minWidth: 0,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: '#B8860B',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  input: {
    background: 'none',
    border: 'none',
    outline: 'none',
    fontSize: 13,
    fontWeight: 500,
    color: '#133950',
    width: '100%',
    padding: 0,
  },
  weekRange: {
    fontSize: 12,
    color: '#6B6B6B',
    fontWeight: 500,
    whiteSpace: 'nowrap',
    marginLeft: 8,
  },
}

export default function MITsRow({ week, setMITs, weekStart }) {
  const [localMITs, setLocalMITs] = useState(['', '', ''])

  useEffect(() => {
    if (week?.mits) setLocalMITs([...week.mits])
  }, [week?.mits])

  const handleChange = (i, val) => {
    const next = [...localMITs]
    next[i] = val
    setLocalMITs(next)
  }

  const handleBlur = () => {
    setMITs?.(localMITs)
  }

  const weekRange = weekStart
    ? formatWeekRange(new Date(weekStart + 'T00:00:00'))
    : ''

  return (
    <div style={S.row}>
      <span style={S.label}>MITs</span>
      <div style={S.cardsWrap}>
        {[0, 1, 2].map(i => (
          <div key={i} style={S.card}>
            <span style={S.cardLabel}>MIT {i + 1}</span>
            <input
              style={S.input}
              placeholder={`Most important thing ${i + 1}…`}
              value={localMITs[i] ?? ''}
              onChange={e => handleChange(i, e.target.value)}
              onBlur={handleBlur}
              maxLength={120}
            />
          </div>
        ))}
      </div>
      <span style={S.weekRange}>{weekRange}</span>
    </div>
  )
}
