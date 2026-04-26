import { useState, useRef, useEffect, useCallback } from 'react'

const OPEN_LIST_KEY = 'pyw_open_list'
function loadOpenList() {
  try { return JSON.parse(localStorage.getItem(OPEN_LIST_KEY)) ?? [] } catch { return [] }
}

function SidebarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0.75" y="0.75" width="12.5" height="12.5" rx="2.25" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="4.75" y1="0.75" x2="4.75" y2="13.25" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  )
}
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const PRESET_EMOJIS = ['📋','📌','💡','🎯','🔧','📚','💼','🏃','✍️','🎨','🔬','🌱','⚡','🎵','🏠','💰','🤝','🚀','🔑','📊']

function CircleCheck({ checked, onChange }) {
  return (
    <div
      onClick={e => { e.stopPropagation(); onChange() }}
      style={{
        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
        border: checked ? 'none' : '1.5px solid #D1D5DB',
        background: checked ? 'var(--success)' : 'transparent',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.15s, border 0.15s',
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
function ListItemRow({ item, onToggle, onRemove, onUpdate, dragType }) {
  const [hovered, setHovered] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editVal, setEditVal] = useState(item.text)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { type: dragType, item },
  })

  const commitEdit = () => {
    const trimmed = editVal.trim()
    if (trimmed && trimmed !== item.text) onUpdate?.(item.id, trimmed)
    else setEditVal(item.text)
    setEditing(false)
  }

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...(editing ? {} : listeners)}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0 : 1 }}
    >
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          minHeight: 36, padding: '0 8px', borderRadius: 6,
          background: hovered ? '#F9FAFB' : 'transparent',
          cursor: editing ? 'default' : 'grab', userSelect: 'none',
        }}
      >
        <CircleCheck checked={item.done} onChange={() => onToggle(item.id)} />
        {editing ? (
          <input
            autoFocus
            value={editVal}
            onChange={e => setEditVal(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={e => {
              if (e.key === 'Enter') commitEdit()
              if (e.key === 'Escape') { setEditVal(item.text); setEditing(false) }
            }}
            onClick={e => e.stopPropagation()}
            style={{
              flex: 1, fontSize: 14, color: 'var(--text-1)', background: 'none',
              border: 'none', borderBottom: '1px solid var(--accent)',
              outline: 'none', fontFamily: 'inherit', padding: '1px 0', lineHeight: 1.35,
            }}
            maxLength={200}
          />
        ) : (
          <span
            onClick={e => { e.stopPropagation(); setEditing(true) }}
            style={{
              flex: 1, fontSize: 14,
              color: item.done ? '#9CA3AF' : 'var(--text-1)',
              textDecoration: item.done ? 'line-through' : 'none',
              lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              cursor: 'text',
            }}
          >
            {item.text}
          </span>
        )}
        <button
          onClick={e => { e.stopPropagation(); onRemove(item.id) }}
          style={{
            background: 'none', border: 'none', padding: '0 2px',
            fontSize: 14, color: '#D1D5DB', cursor: 'pointer', lineHeight: 1, flexShrink: 0,
            opacity: hovered ? 1 : 0, transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#D1D5DB' }}
        >
          ×
        </button>
      </div>
    </div>
  )
}

// Expandable list section
function ListSection({ title, emoji, items, dragType, onToggle, onRemove, onUpdate, onAddItem, canAdd, listId, onRename, onDelete, isPermanent }) {
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
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 8px', borderRadius: 6,
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(v => !v)}
      >
        <span style={{ fontSize: 14, flexShrink: 0 }}>{emoji}</span>
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
              flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--text-1)',
              background: 'var(--surface)', border: '1px solid var(--accent)',
              borderRadius: 4, padding: '1px 5px', outline: 'none', fontFamily: 'inherit',
            }}
          />
        ) : (
          <span style={{
            flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--text-1)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {title}
          </span>
        )}
        <span style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0 }}>
          {items.length > 0 ? items.length : ''}
        </span>
        <span style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0, width: 12, textAlign: 'center' }}>
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
                onUpdate={onUpdate}
              />
            ))}
          </SortableContext>
          {canAdd && (
            <div style={{ padding: '0 8px', minHeight: 32, display: 'flex', alignItems: 'center' }}>
              <input
                style={{
                  width: '100%', background: 'none', border: 'none', outline: 'none',
                  fontSize: 13, color: '#9CA3AF', fontFamily: 'inherit',
                  padding: '4px 0',
                }}
                placeholder="+ Add task…"
                value={addVal}
                onChange={e => setAddVal(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
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
  const [dumpDone, setDumpDone] = useState({})
  const toggleDumpDone = (id) => setDumpDone(prev => ({ ...prev, [id]: !prev[id] }))

  // Open List — localStorage only, unlimited
  const [openItems, setOpenItemsState] = useState(loadOpenList)
  const [openDone, setOpenDone] = useState({})
  const saveOpen = useCallback((items) => {
    setOpenItemsState(items)
    localStorage.setItem(OPEN_LIST_KEY, JSON.stringify(items))
  }, [])
  const addOpenItem = useCallback((_, text) => {
    const trimmed = text?.trim(); if (!trimmed) return
    saveOpen([...openItems, { id: crypto.randomUUID(), text: trimmed, created_at: new Date().toISOString() }])
  }, [openItems, saveOpen])
  const removeOpenItem = useCallback((id) => saveOpen(openItems.filter(i => i.id !== id)), [openItems, saveOpen])
  const updateOpenItem = useCallback((id, text) => {
    const trimmed = text?.trim(); if (!trimmed) return
    saveOpen(openItems.map(i => i.id === id ? { ...i, text: trimmed } : i))
  }, [openItems, saveOpen])
  const toggleOpenDone = (id) => setOpenDone(prev => ({ ...prev, [id]: !prev[id] }))

  return (
    <>
      <aside
        data-tour="leftpanel"
        style={{
          width: collapsed ? 36 : 260,
          flexShrink: 0,
          background: '#FFFFFF',
          borderRight: '1px solid #F0F0F0',
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
              padding: '0 12px',
              height: 80,
              borderBottom: '1px solid var(--border)',
              flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#6B7280' }}>
                This Week's List
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
                    color: 'var(--text-2)', cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  <SidebarIcon />
                </button>
              </div>
            </div>

            {/* Lists */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
              {/* ── CLOSED LIST (max 15) ── */}
              <div style={{ fontSize: 10, fontWeight: 600, color: '#C0BDB8', letterSpacing: '0.06em', padding: '6px 8px 2px' }}>CLOSED LIST</div>
              <ListSection
                title="Closed List"
                emoji="📋"
                listId="brain-dump"
                items={dump.items.map(i => ({ ...i, done: dumpDone[i.id] ?? false }))}
                dragType="dump"
                onToggle={toggleDumpDone}
                onRemove={dump.removeItem}
                onUpdate={dump.updateItem}
                onAddItem={(_, text) => dump.addItem(text)}
                canAdd={!dump.isFull}
                isPermanent={true}
              />
              {lists.lists.map(list => (
                <ListSection
                  key={`closed-${list.id}`}
                  title={list.name}
                  emoji={list.emoji}
                  listId={list.id}
                  items={lists.getListItems(list.id)}
                  dragType="list_item"
                  onToggle={lists.toggleDone}
                  onRemove={lists.removeItem}
                  onUpdate={lists.updateItem}
                  onAddItem={lists.addItem}
                  canAdd={true}
                  isPermanent={false}
                  onRename={lists.renameList}
                  onDelete={lists.deleteList}
                />
              ))}

              {/* ── OPEN LIST (unlimited) ── */}
              <div style={{ fontSize: 10, fontWeight: 600, color: '#C0BDB8', letterSpacing: '0.06em', padding: '12px 8px 2px', borderTop: '1px solid var(--border)', marginTop: 8 }}>OPEN LIST</div>
              <ListSection
                title="Open List"
                emoji="📂"
                listId="open-list"
                items={openItems.map(i => ({ ...i, done: openDone[i.id] ?? false }))}
                dragType="list_item"
                onToggle={toggleOpenDone}
                onRemove={removeOpenItem}
                onUpdate={updateOpenItem}
                onAddItem={addOpenItem}
                canAdd={true}
                isPermanent={true}
              />
              {lists.lists.map(list => (
                <ListSection
                  key={`open-${list.id}`}
                  title={list.name}
                  emoji={list.emoji}
                  listId={list.id}
                  items={lists.getListItems(list.id)}
                  dragType="list_item"
                  onToggle={lists.toggleDone}
                  onRemove={lists.removeItem}
                  onUpdate={lists.updateItem}
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
