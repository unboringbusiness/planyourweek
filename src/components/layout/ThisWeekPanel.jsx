import { useState } from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import TaskCard from '../week/TaskCard'
import { BACKLOG_MAX } from '../../hooks/useBacklog'

export default function ThisWeekPanel({
  open,
  items,
  count,
  isAtCapacity,
  mitCount,
  getMeta,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  onMoveToSomeday,
  onMoveOverflowToDump,
}) {
  const [inputVal, setInputVal] = useState('')
  const [panelOpen, setPanelOpen] = useState(true)

  const handleAdd = () => {
    const trimmed = inputVal.trim()
    if (!trimmed || isAtCapacity) return
    onAddItem(trimmed)
    setInputVal('')
  }

  const showOverflowPrompt = count >= BACKLOG_MAX

  if (!open) return null

  return (
    <aside style={{
      width: panelOpen ? 280 : 40,
      flexShrink: 0,
      background: 'var(--surface-2)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      transition: 'width 0.2s ease',
      position: 'relative',
    }}>
      {/* Collapse toggle */}
      <button
        onClick={() => setPanelOpen(v => !v)}
        title={panelOpen ? 'Collapse' : 'Expand This Week'}
        style={{
          position: 'absolute',
          top: 12,
          right: panelOpen ? 10 : 6,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          width: 24,
          height: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-2)',
          fontSize: 11,
          zIndex: 2,
          flexShrink: 0,
        }}
      >
        {panelOpen ? '‹' : '›'}
      </button>

      {panelOpen && (
        <>
          {/* Header */}
          <div style={{
            padding: '12px 14px 10px',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
            paddingRight: 40,
          }}>
            <div style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--text-2)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span>This Week</span>
              <span style={{
                fontSize: 10,
                fontWeight: 600,
                background: isAtCapacity ? '#FEE2E2' : 'var(--surface)',
                color: isAtCapacity ? 'var(--danger)' : 'var(--text-2)',
                border: `1px solid ${isAtCapacity ? 'var(--danger)' : 'var(--border)'}`,
                borderRadius: 8,
                padding: '1px 6px',
              }}>
                {count}/{BACKLOG_MAX}
              </span>
            </div>

            {/* Add input */}
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                style={{
                  flex: 1,
                  padding: '7px 9px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  fontSize: 13,
                  color: 'var(--text-1)',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
                placeholder="Add a task…"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
                disabled={isAtCapacity}
                maxLength={200}
              />
              <button
                onClick={handleAdd}
                disabled={isAtCapacity}
                style={{
                  background: isAtCapacity ? 'var(--border)' : 'var(--accent)',
                  border: 'none',
                  borderRadius: 8,
                  width: 30,
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 18,
                  flexShrink: 0,
                  cursor: isAtCapacity ? 'not-allowed' : 'pointer',
                }}
              >
                +
              </button>
            </div>
          </div>

          {/* Overflow prompt */}
          {showOverflowPrompt && (
            <div style={{
              margin: '8px 12px 0',
              padding: '8px 10px',
              borderRadius: 8,
              background: 'color-mix(in srgb, var(--sched) 12%, var(--surface))',
              border: '1px solid var(--sched)',
              fontSize: 12,
              color: 'var(--text-1)',
              lineHeight: 1.5,
            }}>
              <div style={{ marginBottom: 6 }}>
                This is getting long. Move the rest to your dump?
              </div>
              <button
                onClick={onMoveOverflowToDump}
                style={{
                  background: 'var(--sched)',
                  border: 'none',
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                Yes, move overflow
              </button>
            </div>
          )}

          {/* Items list */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
          }}>
            {items.length === 0 ? (
              <div style={{
                padding: '24px 8px',
                textAlign: 'center',
                color: 'var(--text-2)',
                fontSize: 13,
                lineHeight: 1.6,
              }}>
                Your closed list for this week.<br />
                Drag tasks to a day column to schedule them.
              </div>
            ) : (
              <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                {items.map(item => {
                  // Backlog items store their own meta inline
                  const meta = {
                    duration: item.duration ?? 30,
                    is_mit: item.is_mit ?? false,
                    done: item.done ?? false,
                  }
                  return (
                    <TaskCard
                      key={item.id}
                      taskId={item.id}
                      text={item.text}
                      meta={meta}
                      mitCount={mitCount}
                      containerData={{ type: 'backlog', item }}
                      onTextChange={text => onUpdateItem(item.id, { text })}
                      onDurationChange={dur => onUpdateItem(item.id, { duration: dur })}
                      onMITToggle={() => onUpdateItem(item.id, { is_mit: !item.is_mit })}
                      onDoneToggle={() => onUpdateItem(item.id, { done: !item.done })}
                      onRemove={() => onRemoveItem(item.id)}
                      onMoveToSomeday={() => onMoveToSomeday?.(item)}
                    />
                  )
                })}
              </SortableContext>
            )}
          </div>
        </>
      )}
    </aside>
  )
}
