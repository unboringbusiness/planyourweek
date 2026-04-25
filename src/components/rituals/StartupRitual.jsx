import { useState, useMemo } from 'react'
import { formatDuration } from '../week/TaskCard'

const DAYS_ORDER = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']

function ProgressBar({ step, total }) {
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{
          flex: 1, height: 3, borderRadius: 2,
          background: i < step ? 'var(--accent)' : 'var(--border)',
          transition: 'background 0.3s',
        }} />
      ))}
    </div>
  )
}

export default function StartupRitual({ dayKey, week, dump, getMeta, setTaskMeta, onAddSlot, onClose }) {
  const [step, setStep] = useState(1)
  const [yesterdayChoices, setYesterdayChoices] = useState({})

  const yesterdayKey = useMemo(() => {
    const idx = DAYS_ORDER.indexOf(dayKey)
    return idx > 0 ? DAYS_ORDER[idx - 1] : null
  }, [dayKey])

  const yesterdayTasks = useMemo(() => {
    if (!yesterdayKey) return []
    return Object.entries(week?.slots?.[yesterdayKey] ?? {}).flatMap(([slotType, tasks]) =>
      tasks.map(t => ({ ...t, slotType }))
    )
  }, [yesterdayKey, week])

  const todaySlots = week?.slots?.[dayKey] ?? {}
  const todayTasks = Object.values(todaySlots).flat()
  const totalMinutes = todayTasks.reduce((s, t) => s + (getMeta(t.id).duration ?? 30), 0)
  const overCap = totalMinutes > 420

  const [capacityChoices, setCapacityChoices] = useState({})

  const handleYesterdayChoice = (id, choice) => {
    setYesterdayChoices(prev => ({ ...prev, [id]: choice }))
  }

  const applyYesterdayChoices = async () => {
    for (const task of yesterdayTasks) {
      const choice = yesterdayChoices[task.id]
      if (choice === 'today') {
        await onAddSlot(dayKey, task.slotType, task.text)
      }
      // 'someday' and 'drop' are handled by parent if needed
    }
    setStep(2)
  }

  const handleFinish = async () => {
    // Apply capacity choices — mark dropped/someday tasks
    for (const task of todayTasks) {
      const choice = capacityChoices[task.id]
      if (choice === 'tomorrow') {
        const tomorrowKey = DAYS_ORDER[DAYS_ORDER.indexOf(dayKey) + 1]
        if (tomorrowKey) await onAddSlot(tomorrowKey, task.slotType ?? 'admin', task.text)
        // Remove from today handled by parent ideally; skip for now
      }
    }
    localStorage.setItem(`pyw_day_planned_${dayKey}`, '1')
    onClose()
  }

  const modalStyle = {
    position: 'fixed', inset: 0, background: 'var(--overlay)',
    zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center',
  }
  const panelStyle = {
    background: 'var(--surface)', borderRadius: 18,
    padding: '28px 32px', width: 600, maxWidth: '95vw', maxHeight: '88vh',
    overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
    display: 'flex', flexDirection: 'column',
  }
  const btnRow = { display: 'flex', gap: 8, marginTop: 20 }
  const btn = (accent) => ({
    flex: 1, padding: '10px', borderRadius: 9, border: 'none',
    background: accent ? 'var(--accent)' : 'var(--surface-2)',
    color: accent ? '#fff' : 'var(--text-1)', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit',
  })

  return (
    <div style={modalStyle} onClick={onClose}>
      <div style={panelStyle} onClick={e => e.stopPropagation()}>
        <ProgressBar step={step} total={3} />

        {step === 1 && (
          <>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', marginBottom: 6 }}>
              What did you get done yesterday?
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16, lineHeight: 1.5 }}>
              {yesterdayKey ? `Reviewing ${yesterdayKey}` : 'No previous day to review — it\'s Monday!'}
            </p>
            {yesterdayTasks.length === 0 ? (
              <p style={{ color: 'var(--text-2)', fontSize: 13, fontStyle: 'italic' }}>Nothing planned yesterday.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {yesterdayTasks.map(task => {
                  const meta = getMeta(task.id)
                  const isDone = meta.done
                  const choice = yesterdayChoices[task.id]
                  return (
                    <div key={task.id} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                      borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)',
                    }}>
                      {isDone ? (
                        <span style={{ color: 'var(--success)', fontSize: 13 }}>✓</span>
                      ) : (
                        <span style={{ color: 'var(--text-2)', fontSize: 11 }}>○</span>
                      )}
                      <span style={{ flex: 1, fontSize: 13, color: 'var(--text-1)', textDecoration: isDone ? 'line-through' : 'none', opacity: isDone ? 0.6 : 1 }}>
                        {meta.textOverride || task.text}
                      </span>
                      {!isDone && (
                        <div style={{ display: 'flex', gap: 4 }}>
                          {['today','someday','drop'].map(opt => (
                            <button key={opt} onClick={() => handleYesterdayChoice(task.id, opt)} style={{
                              padding: '3px 8px', borderRadius: 5, border: `1px solid ${choice === opt ? 'var(--accent)' : 'var(--border)'}`,
                              background: choice === opt ? 'var(--accent)' : 'transparent',
                              color: choice === opt ? '#fff' : 'var(--text-2)', fontSize: 11,
                              cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize',
                            }}>
                              {opt === 'today' ? 'Move to Today' : opt === 'someday' ? 'Someday' : 'Drop'}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
            <div style={btnRow}>
              <button style={btn(false)} onClick={onClose}>Skip</button>
              <button style={btn(true)} onClick={applyYesterdayChoices}>Next →</button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', marginBottom: 6 }}>
              What do you want to get done today?
            </div>
            <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>
              {/* Dump list */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Brain Dump</div>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 280 }}>
                  {dump.items.length === 0 ? (
                    <p style={{ color: 'var(--text-2)', fontSize: 12 }}>Dump is empty.</p>
                  ) : dump.items.map(item => (
                    <div key={item.id} style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px',
                      borderRadius: 7, background: 'var(--surface-2)', border: '1px solid var(--border)',
                    }}>
                      <span style={{ flex: 1, fontSize: 12, color: 'var(--text-1)' }}>{item.text}</span>
                      <button
                        onClick={async () => {
                          await onAddSlot(dayKey, 'admin', item.text)
                          dump.removeItem(item.id)
                        }}
                        style={{
                          background: 'var(--accent)', border: 'none', borderRadius: 5,
                          width: 20, height: 20, color: '#fff', fontSize: 14, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}
                      >
                        +
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Today's tasks */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Today</div>
                  <span style={{ fontSize: 11, color: overCap ? 'var(--sched)' : 'var(--text-2)', fontWeight: 500 }}>
                    {formatDuration(totalMinutes)} / 7h
                  </span>
                </div>
                {overCap && (
                  <div style={{ fontSize: 11, color: 'var(--sched)', marginBottom: 6, padding: '5px 8px', borderRadius: 6, background: 'var(--sched-bg)' }}>
                    You're over the 7h focus cap. Can anything wait?
                  </div>
                )}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 280 }}>
                  {todayTasks.length === 0 ? (
                    <p style={{ color: 'var(--text-2)', fontSize: 12 }}>No tasks yet — add from dump.</p>
                  ) : todayTasks.map(task => (
                    <div key={task.id} style={{
                      fontSize: 12, color: 'var(--text-1)', padding: '5px 8px',
                      borderRadius: 6, background: 'var(--surface)', border: '1px solid var(--border)',
                    }}>
                      {getMeta(task.id).textOverride || task.text}
                      <span style={{ fontSize: 10, color: 'var(--text-2)', marginLeft: 6 }}>
                        {formatDuration(getMeta(task.id).duration ?? 30)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={btnRow}>
              <button style={btn(false)} onClick={() => setStep(1)}>← Back</button>
              <button style={btn(true)} onClick={() => setStep(3)}>Next →</button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', marginBottom: 6 }}>
              Can anything wait?
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>
              Total planned: <strong style={{ color: overCap ? 'var(--sched)' : 'var(--text-1)' }}>{formatDuration(totalMinutes)}</strong>
            </div>

            {!overCap ? (
              <div style={{ padding: '16px', borderRadius: 10, background: 'color-mix(in srgb, var(--success) 12%, var(--surface))', border: '1px solid var(--success)', fontSize: 14, color: 'var(--text-1)', textAlign: 'center' }}>
                You're good. Today looks achievable. ✓
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {todayTasks.map(task => {
                  const choice = capacityChoices[task.id]
                  return (
                    <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                      <span style={{ flex: 1, fontSize: 13, color: 'var(--text-1)' }}>{getMeta(task.id).textOverride || task.text}</span>
                      {['keep','tomorrow','someday','drop'].map(opt => (
                        <button key={opt} onClick={() => setCapacityChoices(prev => ({ ...prev, [task.id]: opt }))} style={{
                          padding: '2px 7px', borderRadius: 5, fontSize: 10,
                          border: `1px solid ${choice === opt ? 'var(--accent)' : 'var(--border)'}`,
                          background: choice === opt ? 'var(--accent)' : 'transparent',
                          color: choice === opt ? '#fff' : 'var(--text-2)',
                          cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize',
                        }}>
                          {opt === 'keep' ? 'Keep' : opt === 'tomorrow' ? 'Tomorrow' : opt === 'someday' ? 'Someday' : 'Drop'}
                        </button>
                      ))}
                    </div>
                  )
                })}
              </div>
            )}

            <div style={btnRow}>
              <button style={btn(false)} onClick={() => setStep(2)}>← Back</button>
              <button style={btn(true)} onClick={handleFinish}>Start my day ☀️</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
