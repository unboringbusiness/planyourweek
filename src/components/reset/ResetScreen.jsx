import { useState, useMemo } from 'react'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABEL = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' }

function statCard(label, value, sub) {
  return (
    <div style={{
      flex: 1,
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '16px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-1)' }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

export default function ResetScreen({ week, getMeta, onClose, onReset, backlogItems, dumpAddItem }) {
  const [reflection, setReflection] = useState('')
  const [choices, setChoices] = useState({}) // taskId → 'next_week' | 'someday' | 'drop'
  const [done, setDone] = useState(false)

  // Gather all slot tasks
  const allTasks = useMemo(() => {
    return DAYS.flatMap(day =>
      Object.entries(week?.slots?.[day] ?? {}).flatMap(([slotType, tasks]) =>
        tasks.map(t => ({ ...t, day, slotType }))
      )
    )
  }, [week])

  const completedTasks = allTasks.filter(t => getMeta(t.id).done)
  const unfinishedTasks = allTasks.filter(t => !getMeta(t.id).done)

  const mitCount = allTasks.filter(t => getMeta(t.id).is_mit).length
  const mitsDone = allTasks.filter(t => getMeta(t.id).is_mit && getMeta(t.id).done).length

  const focusMinutes = allTasks
    .filter(t => t.slotType === 'deep_work' || t.slotType === 'scheduled')
    .reduce((sum, t) => sum + (getMeta(t.id).duration ?? 30), 0)

  const focusHours = (focusMinutes / 60).toFixed(1)

  const setChoice = (id, choice) => setChoices(prev => ({ ...prev, [id]: choice }))

  const handleClose = async () => {
    // Process unfinished tasks based on choices
    for (const task of unfinishedTasks) {
      const choice = choices[task.id] ?? 'drop'
      if (choice === 'next_week') {
        // Would move to backlog — but we don't have access to backlog here
        // This is handled by the parent via onReset callback
      } else if (choice === 'someday') {
        await dumpAddItem(task.text)
      }
      // 'drop' → just removed
    }

    // Save reflection
    if (reflection.trim()) {
      const reflections = JSON.parse(localStorage.getItem('pyw_reflections') ?? '[]')
      reflections.push({
        text: reflection.trim(),
        date: new Date().toISOString(),
        stats: { completed: completedTasks.length, unfinished: unfinishedTasks.length, mitsDone, focusHours }
      })
      localStorage.setItem('pyw_reflections', JSON.stringify(reflections.slice(-52)))
    }

    const nextWeekTasks = unfinishedTasks.filter(t => choices[t.id] === 'next_week')
    onReset?.(nextWeekTasks)
    setDone(true)
  }

  if (done) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        background: 'var(--bg)',
      }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>✓</div>
        <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>
          Week closed.
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 28, textAlign: 'center' }}>
          Good work. The week is archived. Start fresh.
        </p>
        <button
          onClick={onClose}
          style={{
            background: 'var(--accent)',
            border: 'none',
            borderRadius: 10,
            padding: '12px 28px',
            fontSize: 14,
            fontWeight: 600,
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          Plan next week →
        </button>
      </div>
    )
  }

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      background: 'var(--bg)',
      padding: '32px',
    }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* Heading */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>
            Week at a glance
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-2)' }}>
            Before you close out, decide what to do with what's left.
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
          {statCard('Completed', completedTasks.length)}
          {statCard('Unfinished', unfinishedTasks.length)}
          {statCard('Milestones done', `${mitsDone}/3`)}
          {statCard('Focus hours', focusHours + 'h')}
        </div>

        {/* Completed */}
        {completedTasks.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
              Completed this week
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {completedTasks.map(t => (
                <div key={t.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                }}>
                  <span style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600 }}>✓</span>
                  <span style={{ flex: 1, fontSize: 13, color: 'var(--text-1)', textDecoration: 'line-through', opacity: 0.7 }}>{t.text}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-2)' }}>{DAY_LABEL[t.day]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unfinished */}
        {unfinishedTasks.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
              Unfinished — make a call
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {unfinishedTasks.map(t => {
                const choice = choices[t.id]
                return (
                  <div key={t.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 12px',
                    borderRadius: 9,
                    background: 'var(--surface)',
                    border: `1px solid ${choice ? 'var(--accent)' : 'var(--border)'}`,
                  }}>
                    <span style={{ flex: 1, fontSize: 13, color: 'var(--text-1)' }}>{t.text}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-2)', marginRight: 4 }}>{DAY_LABEL[t.day]}</span>
                    {['next_week', 'someday', 'drop'].map(opt => (
                      <button
                        key={opt}
                        onClick={() => setChoice(t.id, opt)}
                        style={{
                          background: choice === opt ? 'var(--accent)' : 'var(--surface-2)',
                          border: `1px solid ${choice === opt ? 'var(--accent)' : 'var(--border)'}`,
                          borderRadius: 6,
                          padding: '4px 9px',
                          fontSize: 11,
                          fontWeight: 500,
                          color: choice === opt ? '#fff' : 'var(--text-2)',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {opt === 'next_week' ? 'Next week' : opt === 'someday' ? 'Save for Later' : 'Delete'}
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Reflection */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
            One reflection
          </div>
          <textarea
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              fontSize: 14,
              color: 'var(--text-1)',
              outline: 'none',
              resize: 'none',
              fontFamily: 'inherit',
              lineHeight: 1.6,
            }}
            rows={3}
            maxLength={280}
            placeholder="What's the one thing you learned or noticed this week? One sentence. No more."
            value={reflection}
            onChange={e => setReflection(e.target.value)}
          />
          <div style={{ fontSize: 11, color: 'var(--text-2)', textAlign: 'right', marginTop: 3 }}>
            {reflection.length}/280
          </div>
        </div>

        {/* Do Nothing Timer */}
        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: 24,
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-1)', marginBottom: 6 }}>
            Before tomorrow, do nothing for 2 minutes.
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 12 }}>
            Let your mind settle. No phone. No task. Just rest.
          </p>
          <button
            onClick={() => window.open('https://donothingtimer.com', '_blank')}
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: 13,
              color: 'var(--text-2)',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Open Do Nothing Timer →
          </button>
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: 12,
            border: 'none',
            background: 'var(--text-1)',
            color: 'var(--bg)',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Close the week →
        </button>
      </div>
    </div>
  )
}
