import { useState } from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import TaskCard, { PanelTaskCard } from '../week/TaskCard'
import { BACKLOG_MAX } from '../../hooks/useBacklog'

export default function ThisWeekPanel({
  items, count, isAtCapacity, mitCount,
  onAddItem, onRemoveItem, onUpdateItem,
  onMoveToSomeday, onMoveOverflowToDump,
}) {
  const [inputVal, setInputVal] = useState('')
  const [collapsed, setCollapsed] = useState(false)

  const handleAdd = () => {
    const trimmed = inputVal.trim()
    if (!trimmed || isAtCapacity) return
    onAddItem(trimmed)
    setInputVal('')
  }

  const showOverflowPrompt = count >= BACKLOG_MAX

  return (
    <aside data-tour="thisweek" style={{
      width: collapsed ? 36 : 260,
      flexShrink: 0,
      background: 'var(--surface-2)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      transition: 'width 0.2s ease',
      position: 'relative',
    }}>
      {/* Collapse toggle — always visible */}
      <button
        onClick={() => setCollapsed(v => !v)}
        title={collapsed ? 'Expand This Week' : 'Collapse'}
        style={{
          position: 'absolute',
          top: 10,
          right: collapsed ? 6 : 8,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          width: 22,
          height: 22,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-2)',
          fontSize: 10,
          zIndex: 2,
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        {collapsed ? '›' : '‹'}
      </button>

      {!collapsed && (
        <>
          {/* Header */}
          <div style={{
            padding: '10px 12px 8px',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
            paddingRight: 36,
          }}>
            <div style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--text-2)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span>This Week</span>
              <span style={{
                fontSize: 9, fontWeight: 600,
                background: isAtCapacity ? '#FEE2E2' : 'var(--surface)',
                color: isAtCapacity ? 'var(--danger)' : 'var(--text-2)',
                border: `1px solid ${isAtCapacity ? 'var(--danger)' : 'var(--border)'}`,
                borderRadius: 7, padding: '1px 5px',
              }}>
                {count}/{BACKLOG_MAX}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 5 }}>
              <input
                style={{
                  flex: 1, padding: '5px 8px', borderRadius: 7,
                  border: '1px solid var(--border)', background: 'var(--surface)',
                  fontSize: 12, color: 'var(--text-1)', outline: 'none', fontFamily: 'inherit',
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
                  border: 'none', borderRadius: 7,
                  width: 26, height: 26,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 16, flexShrink: 0,
                  cursor: isAtCapacity ? 'not-allowed' : 'pointer',
                }}
              >
                +
              </button>
            </div>
          </div>

          {showOverflowPrompt && (
            <div style={{
              margin: '6px 10px 0',
              padding: '7px 9px',
              borderRadius: 7,
              background: 'color-mix(in srgb, var(--sched) 10%, var(--surface))',
              border: '1px solid var(--sched)',
              fontSize: 11, color: 'var(--text-1)', lineHeight: 1.5,
            }}>
              <div style={{ marginBottom: 5 }}>Getting long. Move overflow to dump?</div>
              <button
                onClick={onMoveOverflowToDump}
                style={{
                  background: 'var(--sched)', border: 'none', borderRadius: 5,
                  padding: '3px 8px', fontSize: 10, fontWeight: 600, color: '#fff', cursor: 'pointer',
                }}
              >
                Yes, move overflow
              </button>
            </div>
          )}

          <div style={{
            flex: 1, overflowY: 'auto', padding: '6px 8px',
            display: 'flex', flexDirection: 'column', gap: 3,
          }}>
            {items.length === 0 ? (
              <div style={{
                padding: '20px 6px', textAlign: 'center',
                color: 'var(--text-2)', fontSize: 12, lineHeight: 1.6,
              }}>
                Your closed list.<br />Drag to a day to schedule.
              </div>
            ) : (
              <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                {items.map(item => (
                  <TaskCard
                    key={item.id}
                    taskId={item.id}
                    text={item.text}
                    meta={{ duration: item.duration ?? 30, is_mit: item.is_mit ?? false, done: item.done ?? false }}
                    compact={false}
                    mitCount={mitCount}
                    containerData={{ type: 'backlog', item }}
                    onMITToggle={() => onUpdateItem(item.id, { is_mit: !item.is_mit })}
                    onDoneToggle={() => onUpdateItem(item.id, { done: !item.done })}
                    onRemove={() => onRemoveItem(item.id)}
                    onMoveToSomeday={() => onMoveToSomeday?.(item)}
                  />
                ))}
              </SortableContext>
            )}
          </div>
        </>
      )}
    </aside>
  )
}
