import { useState } from 'react'

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

const DAYS_ORDER = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']

export default function ShutdownRitual({ dayKey, week, getMeta, setTaskMeta, onAddSlot, onClose }) {
  const [step, setStep] = useState(1)
  const [choices, setChoices] = useState({})
  const [reflection, setReflection] = useState('')

  const todaySlots = week?.slots?.[dayKey] ?? {}
  const todayTasks = Object.entries(todaySlots).flatMap(([slotType, tasks]) =>
    tasks.map(t => ({ ...t, slotType }))
  )

  const incompleteTasks = todayTasks.filter(t => !getMeta(t.id).done)
  const completedTasks = todayTasks.filter(t => getMeta(t.id).done)

  const handleChoice = (id, choice) => setChoices(prev => ({ ...prev, [id]: choice }))

  const applyChoices = async () => {
    const tomorrowKey = DAYS_ORDER[DAYS_ORDER.indexOf(dayKey) + 1]
    for (const task of incompleteTasks) {
      const choice = choices[task.id]
      if (choice === 'done') {
        setTaskMeta(task.id, { done: true })
      } else if (choice === 'tomorrow' && tomorrowKey) {
        await onAddSlot(tomorrowKey, task.slotType ?? 'admin', task.text)
      }
      // 'someday' and 'drop' — no action needed (task stays or is ignored)
    }
    setStep(2)
  }

  const handleClose = () => {
    if (reflection.trim()) {
      localStorage.setItem(`pyw_reflection_${dayKey}`, reflection.trim())
    }
    localStorage.setItem(`pyw_day_closed_${dayKey}`, '1')
    onClose()
  }

  const modalStyle = {
    position: 'fixed', inset: 0, background: 'var(--overlay)',
    zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center',
  }
  const panelStyle = {
    background: 'var(--surface)', borderRadius: 18,
    padding: '28px 32px', width: 560, maxWidth: '95vw', maxHeight: '88vh',
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
        <ProgressBar step={step} total={2} />

        {step === 1 && (
          <>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', marginBottom: 6 }}>
              Let's close the day.
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16, lineHeight: 1.5 }}>
              {incompleteTasks.length === 0
                ? 'Everything done — great work today.'
                : `${incompleteTasks.length} task${incompleteTasks.length > 1 ? 's' : ''} left. What should happen to them?`}
            </p>

            {completedTasks.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: incompleteTasks.length > 0 ? 12 : 0 }}>
                {completedTasks.map(task => (
                  <div key={task.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                    borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)',
                    opacity: 0.6,
                  }}>
                    <span style={{ color: 'var(--success)', fontSize: 13, flexShrink: 0 }}>✓</span>
                    <span style={{ flex: 1, fontSize: 13, color: 'var(--text-1)', textDecoration: 'line-through' }}>
                      {getMeta(task.id).textOverride || task.text}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {incompleteTasks.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {incompleteTasks.map(task => {
                  const choice = choices[task.id]
                  const tomorrowKey = DAYS_ORDER[DAYS_ORDER.indexOf(dayKey) + 1]
                  return (
                    <div key={task.id} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                      borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)',
                    }}>
                      <span style={{ color: 'var(--text-2)', fontSize: 11, flexShrink: 0 }}>○</span>
                      <span style={{ flex: 1, fontSize: 13, color: 'var(--text-1)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {getMeta(task.id).textOverride || task.text}
                      </span>
                      <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                        {[
                          ['done', 'Mark done'],
                          ...(tomorrowKey ? [['tomorrow', 'Tomorrow']] : []),
                          ['someday', 'Someday'],
                          ['drop', 'Drop'],
                        ].map(([opt, label]) => (
                          <button key={opt} onClick={() => handleChoice(task.id, opt)} style={{
                            padding: '3px 7px', borderRadius: 5,
                            border: `1px solid ${choice === opt ? 'var(--accent)' : 'var(--border)'}`,
                            background: choice === opt ? 'var(--accent)' : 'transparent',
                            color: choice === opt ? '#fff' : 'var(--text-2)', fontSize: 11,
                            cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                          }}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div style={btnRow}>
              <button style={btn(false)} onClick={onClose}>Skip</button>
              <button style={btn(true)} onClick={applyChoices}>Next →</button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', marginBottom: 6 }}>
              One thing before you go.
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16, lineHeight: 1.5 }}>
              What moved the needle today?
            </p>
            <textarea
              autoFocus
              placeholder="One sentence."
              value={reflection}
              onChange={e => setReflection(e.target.value)}
              style={{
                width: '100%', minHeight: 100, padding: '10px 12px',
                borderRadius: 10, border: '1.5px solid var(--border)',
                background: 'var(--surface-2)', color: 'var(--text-1)',
                fontSize: 14, fontFamily: 'inherit', resize: 'vertical',
                outline: 'none', lineHeight: 1.6, boxSizing: 'border-box',
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
            />
            <div style={btnRow}>
              <button style={btn(false)} onClick={() => setStep(1)}>← Back</button>
              <button style={btn(true)} onClick={handleClose}>Close the day 🌙</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
