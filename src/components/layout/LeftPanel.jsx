import { useState, useRef, useEffect } from 'react'
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const PRESET_EMOJIS = ['📋','📌','💡','🎯','🔧','📚','💼','🏃','✍️','🎨','🔬','🌱','⚡','🎵','🏠','💰','🤝','🚀','🔑','📊']

// Circle checkbox — same style as DayColumn tasks
function CircleCheck({ checked, onChange, size = 15 }) {
  return (
    <div
      onClick={e => { e.stopPropagation(); onChange() }}
      style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        border: checked ? 'none' : '1.5px solid #D0CEC9',
        background: checked ? 'var(--success)' : 'transparent',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.15s, border 0.15s',
        marginTop: 1,
      }}
    >
      {checked && (
        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
          <path d="M1 3.5l2.5 2.5 4.5-5" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </div>
  )
}

// Single item row — sortable + draggable to day columns
function ListItemRow({ item, onToggle, onRemove, dragType }) {
  const [hovered, setHovered] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { type: dragType, item },
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0 : 1 }}
    >
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex', alignItems: 'flex-start', gap: 7,
          padding: '5px 6px', borderRadius: 6,
          background: hovered ? 'var(--surface)' : 'transparent',
          cursor: 'grab', userSelect: 'none',
        }}
      >
        <CircleCheck checked={item.done} onChange={() => onToggle(item.id)} />
        <span style={{
          flex: 1, fontSize: 13,
          color: item.done ? 'var(--text-2)' : 'var(--text-1)',
          textDecoration: item.done ? 'line-through' : 'none',
          lineHeight: 1.35, wordBreak: 'break-word',
        }}>
          {item.text}
        </span>
        {hovered && (
          <button
            onClick={e => { e.stopPropagation(); onRemove(item.id) }}
            style={{
              background: 'none', border: 'none', padding: '0 2px',
              fontSize: 14, color: '#D0CEC9', cursor: 'pointer', lineHeight: 1, flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#D0CEC9' }}
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}

// Expandable list section
function ListSection({ title, emoji, items, dragType, onToggle, onRemove, onAddItem, canAdd, listId, onRename, onDelete, isPermanent }) {
  const [expanded, setExpanded] = useState(true)
  const [addVal, setAddVal] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [renameVal, setRenameVal] = useState(title)
  const [renameEmoji, setRenameEmoji] = useState(emoji)
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const handleAdd = () => {
    const trimmed = addVal.trim()
    if (!trimmed) return
    onAddItem(listId, trimmed)
    setAddVal('')
  }

  const handleRename = () => {
    const trimmed = renameVal.trim()
    if (trimmed) onRename?.(listId, { emoji: renameEmoji, name: trimmed })
    setRenaming(false)
  }

  const sortedItems = [...items].sort((a, b) => a.done === b.done ? 0 : a.done ? 1 : -1)

  return (
    <div style={{ marginBottom: 2 }}>
      {/* List header */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 6px', borderRadius: 6,
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(v => !v)}
      >
        <span style={{ fontSize: 13, flexShrink: 0 }}>{emoji}</span>
        {renaming ? (
          <input
            autoFocus
            value={renameVal}
            onChange={e => setRenameVal(e.target.value)}
            onClick={e => e.stopPropagation()}
            onKeyDown={e => {
              if (e.key === 'Enter') handleRename()
              if (e.key === 'Escape') setRenaming(false)
            }}
            onBlur={handleRename}
            style={{
              flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text-1)',
              background: 'var(--surface)', border: '1px solid var(--accent)',
              borderRadius: 4, padding: '1px 5px', outline: 'none', fontFamily: 'inherit',
            }}
          />
        ) : (
          <span style={{
            flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text-1)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {title}
          </span>
        )}
        <span style={{ fontSize: 10, color: 'var(--text-2)', flexShrink: 0 }}>
          {items.length || ''}
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-2)', flexShrink: 0, width: 12, textAlign: 'center' }}>
          {expanded ? '▾' : '›'}
        </span>
        {!isPermanent && (
          <div style={{ position: 'relative', flexShrink: 0 }} ref={menuRef}>
            <button
              onClick={e => { e.stopPropagation(); setMenuOpen(v => !v) }}
              style={{
                background: 'none', border: 'none', padding: '0 2px',
                fontSize: 12, color: 'var(--text-2)', cursor: 'pointer', lineHeight: 1,
                letterSpacing: '1px',
              }}
            >
              •••
            </button>
            {menuOpen && (
              <div style={{
                position: 'absolute', right: 0, top: '100%', marginTop: 2,
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                zIndex: 100, minWidth: 130, overflow: 'hidden',
              }}>
                <button
                  onClick={e => { e.stopPropagation(); setMenuOpen(false); setRenaming(true) }}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', fontSize: 12, color: 'var(--text-1)', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Rename
                </button>
                <button
                  onClick={e => { e.stopPropagation(); setMenuOpen(false); onDelete?.(listId) }}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', fontSize: 12, color: 'var(--danger)', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Delete list
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Items */}
      {expanded && (
        <div style={{ paddingLeft: 4 }}>
          <SortableContext items={sortedItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
            {sortedItems.map(item => (
              <ListItemRow
                key={item.id}
                item={item}
                dragType={dragType}
                onToggle={onToggle}
                onRemove={onRemove}
              />
            ))}
          </SortableContext>
          {canAdd && (
            <div style={{ padding: '3px 6px' }}>
              <input
                style={{
                  width: '100%', background: 'none', border: 'none', outline: 'none',
                  fontSize: 12, color: 'var(--text-1)', fontFamily: 'inherit',
                  padding: '3px 0',
                }}
                placeholder="+ Add task…"
                value={addVal}
                onChange={e => setAddVal(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAdd()
                }}
                onFocus={e => { e.currentTarget.placeholder = '' }}
                onBlur={e => { e.currentTarget.placeholder = '+ Add task…' }}
                maxLength={200}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// New list modal
function NewListModal({ onClose, onAdd }) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('📋')

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'var(--overlay)',
        zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)', borderRadius: 14,
          padding: '20px 22px', width: 300, maxWidth: '90vw',
          boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>New List</div>

        {/* Emoji picker */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {PRESET_EMOJIS.map(e => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              style={{
                width: 30, height: 30, borderRadius: 7, fontSize: 16,
                background: emoji === e ? 'var(--accent)' : 'var(--surface-2)',
                border: `1.5px solid ${emoji === e ? 'var(--accent)' : 'var(--border)'}`,
                cursor: 'pointer',
              }}
            >
              {e}
            </button>
          ))}
        </div>

        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && name.trim()) { onAdd({ emoji, name }); onClose() }
            if (e.key === 'Escape') onClose()
          }}
          placeholder="List name…"
          maxLength={60}
          style={{
            padding: '8px 10px', borderRadius: 8,
            border: '1.5px solid var(--accent)', background: 'var(--surface)',
            fontSize: 13, color: 'var(--text-1)', outline: 'none', fontFamily: 'inherit',
          }}
        />

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '8px', borderRadius: 8,
              border: '1px solid var(--border)', background: 'transparent',
              fontSize: 13, color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => { if (name.trim()) { onAdd({ emoji, name }); onClose() } }}
            disabled={!name.trim()}
            style={{
              flex: 2, padding: '8px', borderRadius: 8, border: 'none',
              background: name.trim() ? 'var(--accent)' : 'var(--border)',
              color: '#fff', fontSize: 13, fontWeight: 600,
              cursor: name.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
            }}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  )
}

export default function LeftPanel({ dump, listsHook: lists }) {
  const [collapsed, setCollapsed] = useState(false)
  const [newListOpen, setNewListOpen] = useState(false)
  // Brain Dump done state — local only (items are ephemeral "processed" markers)
  const [dumpDone, setDumpDone] = useState({})
  const toggleDumpDone = (id) => setDumpDone(prev => ({ ...prev, [id]: !prev[id] }))

  return (
    <>
      <aside
        data-tour="leftpanel"
        style={{
          width: collapsed ? 36 : 248,
          flexShrink: 0,
          background: 'var(--surface-2)',
          borderRight: '1px solid var(--col-sep)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'width 0.2s ease',
        }}
      >
        {/* Collapsed state */}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            title="Expand"
            style={{
              margin: '10px auto 0',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 6, width: 24, height: 24,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--accent)', fontSize: 14, cursor: 'pointer', flexShrink: 0,
            }}
          >
            ›
          </button>
        )}

        {!collapsed && (
          <>
            {/* Panel header */}
            <div style={{
              padding: '10px 12px 8px',
              borderBottom: '1px solid var(--border)',
              flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{
                fontSize: 12, fontWeight: 700, color: 'var(--text-1)',
              }}>
                My Lists
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  onClick={() => !lists.isFull && setNewListOpen(true)}
                  title={lists.isFull ? 'Max 4 custom lists' : 'New list'}
                  style={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 5, width: 22, height: 22,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: lists.isFull ? 'var(--text-2)' : 'var(--accent)',
                    fontSize: 14, cursor: lists.isFull ? 'not-allowed' : 'pointer', flexShrink: 0,
                    opacity: lists.isFull ? 0.5 : 1,
                  }}
                >
                  +
                </button>
                <button
                  onClick={() => setCollapsed(true)}
                  title="Collapse"
                  style={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 5, width: 22, height: 22,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-2)', fontSize: 12, cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  ‹
                </button>
              </div>
            </div>

            {/* Lists */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
              {/* Brain Dump — permanent */}
              <ListSection
                title="Brain Dump"
                emoji="🧠"
                listId="brain-dump"
                items={dump.items.map(i => ({ ...i, done: dumpDone[i.id] ?? false }))}
                dragType="dump"
                onToggle={toggleDumpDone}
                onRemove={dump.removeItem}
                onAddItem={(_, text) => dump.addItem(text)}
                canAdd={!dump.isFull}
                isPermanent={true}
              />

              {/* Custom lists */}
              {lists.lists.map(list => (
                <ListSection
                  key={list.id}
                  title={list.name}
                  emoji={list.emoji}
                  listId={list.id}
                  items={lists.getListItems(list.id)}
                  dragType="list_item"
                  onToggle={lists.toggleDone}
                  onRemove={lists.removeItem}
                  onAddItem={lists.addItem}
                  canAdd={true}
                  isPermanent={false}
                  onRename={lists.renameList}
                  onDelete={lists.deleteList}
                />
              ))}
            </div>
          </>
        )}
      </aside>

      {newListOpen && (
        <NewListModal
          onClose={() => setNewListOpen(false)}
          onAdd={(opts) => lists.addList(opts)}
        />
      )}
    </>
  )
}
