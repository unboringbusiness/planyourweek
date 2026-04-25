import { useState } from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import TaskCard from '../week/TaskCard'
import { BACKLOG_MAX } from '../../hooks/useBacklog'

function OverflowModal({ pendingText, items, onSwap, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--overlay)',
      zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 16,
        padding: '24px 26px', width: 420, maxWidth: '95vw', maxHeight: '85vh',
        overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>
            Your week is full.
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
            To add this task, move something else to your dump first.
          </div>
        </div>

        {/* Pending task */}
        <div style={{
          padding: '9px 12px', borderRadius: 8,
          background: 'color-mix(in srgb, var(--accent) 10%, var(--surface))',
          border: '1.5px solid var(--accent)',
          fontSize: 13, color: 'var(--accent)', fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 10, background: 'var(--accent)', color: '#fff', borderRadius: 4, padding: '1px 6px', fontWeight: 700, whiteSpace: 'nowrap' }}>
            Waiting to add
          </span>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-1)' }}>
            {pendingText}
          </span>
        </div>

        {/* Current items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {items.map(item => (
            <div key={item.id} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
              borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)',
            }}>
              <span style={{
                flex: 1, fontSize: 13, color: 'var(--text-1)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {item.text}
              </span>
              <button
                onClick={() => onSwap(item)}
                style={{
                  padding: '4px 10px', borderRadius: 6, border: 'none',
                  background: 'var(--surface)', color: 'var(--text-2)',
                  fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit', whiteSpace: 'nowrap',
                  border: '1px solid var(--border)',
                }}
              >
                Move to Dump
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={onCancel}
          style={{
            padding: '9px', borderRadius: 8,
            border: '1px solid var(--border)', background: 'transparent',
            color: 'var(--text-2)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default function ThisWeekPanel({
  items, count, isAtCapacity, mitCount,
  onAddItem, onRemoveItem, onUpdateItem,
  onMoveToSomeday,
}) {
  const [inputVal, setInputVal] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const [overflowPending, setOverflowPending] = useState(null)

  const handleAdd = () => {
    const trimmed = inputVal.trim()
    if (!trimmed) return
    if (isAtCapacity) {
      setOverflowPending(trimmed)
      setInputVal('')
      return
    }
    onAddItem(trimmed)
    setInputVal('')
  }

  const handleSwap = (itemToMove) => {
    onMoveToSomeday?.(itemToMove)
    onAddItem(overflowPending)
    setOverflowPending(null)
  }

  return (
    <>
      <aside data-tour="thisweek" style={{
        width: collapsed ? 36 : 260,
        flexShrink: 0,
        background: 'var(--surface-2)',
        borderRight: '1px solid var(--col-sep)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width 0.2s ease',
        position: 'relative',
      }}>
        {/* Collapsed state */}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            title="Expand This Week"
            style={{
              margin: '10px auto 0',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              width: 24, height: 24,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--accent)', fontSize: 14, cursor: 'pointer', flexShrink: 0,
            }}
          >
            ›
          </button>
        )}

        {!collapsed && (
          <>
            {/* Header */}
            <div style={{
              padding: '10px 12px 8px',
              borderBottom: '1px solid var(--border)',
              flexShrink: 0,
            }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: 'var(--text-2)',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span>This Week</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 600,
                    background: isAtCapacity ? '#FEE2E2' : 'var(--surface)',
                    color: isAtCapacity ? 'var(--danger)' : 'var(--text-2)',
                    border: `1px solid ${isAtCapacity ? 'var(--danger)' : 'var(--border)'}`,
                    borderRadius: 7, padding: '1px 5px',
                  }}>
                    {count}/{BACKLOG_MAX}
                  </span>
                  <button
                    onClick={() => setCollapsed(true)}
                    title="Collapse"
                    style={{
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 5, width: 20, height: 20,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--text-2)', fontSize: 12, cursor: 'pointer', flexShrink: 0,
                    }}
                  >
                    ‹
                  </button>
                </div>
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
                  maxLength={200}
                />
                <button
                  onClick={handleAdd}
                  style={{
                    background: 'var(--accent)',
                    border: 'none', borderRadius: 7,
                    width: 26, height: 26,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 16, flexShrink: 0, cursor: 'pointer',
                  }}
                >
                  +
                </button>
              </div>
            </div>

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

      {overflowPending && (
        <OverflowModal
          pendingText={overflowPending}
          items={items}
          onSwap={handleSwap}
          onCancel={() => setOverflowPending(null)}
        />
      )}
    </>
  )
}
