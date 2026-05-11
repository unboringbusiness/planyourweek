import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'

const MITS_DONE_KEY = 'pyw_mits_done'

function loadMitsDone() {
  try { return JSON.parse(localStorage.getItem(MITS_DONE_KEY)) ?? [false, false, false] }
  catch { return [false, false, false] }
}
function saveMitsDone(done) { localStorage.setItem(MITS_DONE_KEY, JSON.stringify(done)) }

async function syncMitsDone(user, weekStart, done) {
  if (!user || !weekStart) return
  const { error } = await supabase
    .from('weekly_plans')
    .update({ mit_1_done: done[0], mit_2_done: done[1], mit_3_done: done[2] })
    .eq('user_id', user.id)
    .eq('week_start', weekStart)
  if (error) console.error('[mits] sync error:', error.message)
}

export default function MITsRow({ week, weekStart, setMITs, user }) {
  const [localMITs, setLocalMITs] = useState(['', '', ''])
  const [done, setDone] = useState(loadMitsDone)
  const inputRefs = useRef([])

  useEffect(() => {
    if (week?.mits) setLocalMITs([...week.mits])
  }, [week?.mits])

  // Load done state from Supabase when user is logged in
  useEffect(() => {
    if (!user || !weekStart) {
      setDone(loadMitsDone())
      return
    }
    ;(async () => {
      const { data } = await supabase
        .from('weekly_plans')
        .select('mit_1_done, mit_2_done, mit_3_done')
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
        .single()
      if (data) {
        const remote = [data.mit_1_done ?? false, data.mit_2_done ?? false, data.mit_3_done ?? false]
        setDone(remote)
        saveMitsDone(remote)
      } else {
        setDone(loadMitsDone())
      }
    })()
  }, [user, weekStart])

  const handleChange = (i, val) => {
    const next = [...localMITs]
    next[i] = val
    setLocalMITs(next)
  }

  const handleBlur = () => setMITs?.(localMITs)

  const handleKeyDown = (e, i) => {
    if (e.key === 'Enter') {
      e.target.blur()
      // Auto-advance to next empty milestone
      const nextEmpty = [0, 1, 2].find(j => j > i && !localMITs[j])
      if (nextEmpty !== undefined) {
        setTimeout(() => inputRefs.current[nextEmpty]?.focus(), 50)
      }
    }
  }

  const handleClear = (i) => {
    const next = [...localMITs]
    next[i] = ''
    setLocalMITs(next)
    setMITs?.(next)
    const nextDone = [...done]
    nextDone[i] = false
    setDone(nextDone)
    saveMitsDone(nextDone)
    syncMitsDone(user, weekStart, nextDone)
  }

  const toggleDone = (i) => {
    if (!localMITs[i]) return
    const next = [...done]
    next[i] = !next[i]
    setDone(next)
    saveMitsDone(next)
    syncMitsDone(user, weekStart, next)
  }

  // Count for ResetScreen
  const doneCount = done.filter((d, i) => d && localMITs[i]).length
  const filledCount = localMITs.filter(m => m && m.trim()).length

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
          const isDone = done[i] && isFilled
          return (
            <div
              key={i}
              style={{
                flex: 1, minWidth: 0,
                background: isDone ? 'color-mix(in srgb, var(--success) 10%, var(--surface))' : 'var(--surface)',
                border: `1.5px solid ${isDone ? 'var(--success)' : isFilled ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 10,
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                position: 'relative',
              }}
            >
              {/* Checkbox */}
              <div
                onClick={() => toggleDone(i)}
                style={{
                  width: 16, height: 16, borderRadius: '50%', flexShrink: 0, marginTop: 3,
                  border: isDone ? 'none' : '1.5px solid #D1D5DB',
                  background: isDone ? '#10B981' : 'transparent',
                  cursor: isFilled ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {isDone && (
                  <svg width="8" height="6" viewBox="0 0 9 7" fill="none">
                    <path d="M1 3.5l2.5 2.5 4.5-5" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: isDone ? '#10B981' : 'var(--accent)', marginBottom: 3 }}>
                  Milestone {i + 1}
                </div>
                <input
                  ref={el => { inputRefs.current[i] = el }}
                  style={{
                    background: 'none', border: 'none', outline: 'none',
                    fontSize: 13, fontWeight: 400,
                    color: isDone ? '#9CA3AF' : 'var(--text-1)',
                    textDecoration: isDone ? 'line-through' : 'none',
                    width: '100%', padding: 0,
                    fontFamily: 'inherit',
                  }}
                  placeholder="What will move the needle this week?"
                  value={localMITs[i] ?? ''}
                  onChange={e => handleChange(i, e.target.value)}
                  onBlur={handleBlur}
                  onKeyDown={e => handleKeyDown(e, i)}
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
                  x
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Export for ResetScreen to use
export function getMilestonesDone() {
  return loadMitsDone()
}
