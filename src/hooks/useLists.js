import { useState, useCallback } from 'react'

const LISTS_KEY = 'pyw_custom_lists'
const ITEMS_KEY = 'pyw_list_items'

const DEFAULT_LISTS = [
  { id: 'default-work',     emoji: '💼', name: 'Work',     created_at: '2026-01-01T00:00:00.000Z' },
  { id: 'default-personal', emoji: '🏠', name: 'Personal', created_at: '2026-01-01T00:00:01.000Z' },
]

function loadLists() {
  try {
    const stored = JSON.parse(localStorage.getItem(LISTS_KEY))
    if (stored !== null) return stored
    // First load — seed defaults
    localStorage.setItem(LISTS_KEY, JSON.stringify(DEFAULT_LISTS))
    return DEFAULT_LISTS
  } catch { return DEFAULT_LISTS }
}
function loadItems() {
  try { return JSON.parse(localStorage.getItem(ITEMS_KEY)) ?? [] } catch { return [] }
}
function saveLists(lists) { localStorage.setItem(LISTS_KEY, JSON.stringify(lists)) }
function saveItems(items) { localStorage.setItem(ITEMS_KEY, JSON.stringify(items)) }

const MAX_CUSTOM_LISTS = 4

export function useLists() {
  const [lists, setListsState] = useState(loadLists)
  const [items, setItemsState] = useState(loadItems)

  const setLists = useCallback((next) => {
    const val = typeof next === 'function' ? next(lists) : next
    setListsState(val)
    saveLists(val)
  }, [lists])

  const setItems = useCallback((next) => {
    const val = typeof next === 'function' ? next(items) : next
    setItemsState(val)
    saveItems(val)
  }, [items])

  const addList = useCallback(({ emoji = '📋', name }) => {
    const trimmed = name?.trim()
    if (!trimmed || lists.length >= MAX_CUSTOM_LISTS) return
    const list = { id: crypto.randomUUID(), emoji, name: trimmed, created_at: new Date().toISOString() }
    setLists(prev => [...prev, list])
    return list
  }, [lists, setLists])

  const renameList = useCallback((id, { emoji, name }) => {
    setLists(prev => prev.map(l => l.id === id ? { ...l, emoji: emoji ?? l.emoji, name: name ?? l.name } : l))
  }, [setLists])

  const deleteList = useCallback((id) => {
    // Orphan items — they stay in localStorage but listId won't match any list
    setLists(prev => prev.filter(l => l.id !== id))
    // Move deleted list's items to a special "orphan" state (listId = null = Brain Dump)
    setItems(prev => prev.map(i => i.listId === id ? { ...i, listId: null } : i))
  }, [setLists, setItems])

  const addItem = useCallback((listId, text, duration = 30) => {
    const trimmed = text?.trim()
    if (!trimmed) return
    const item = { id: crypto.randomUUID(), listId, text: trimmed, done: false, duration, created_at: new Date().toISOString() }
    setItems(prev => [...prev, item])
    return item
  }, [setItems])

  const removeItem = useCallback((id) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }, [setItems])

  const toggleDone = useCallback((id) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, done: !i.done } : i))
  }, [setItems])

  const getListItems = useCallback((listId) => {
    return items.filter(i => i.listId === listId)
  }, [items])

  const updateItem = useCallback((id, text) => {
    const trimmed = text?.trim()
    if (!trimmed) return
    setItems(prev => prev.map(i => i.id === id ? { ...i, text: trimmed } : i))
  }, [setItems])

  const moveItemToList = useCallback((itemId, toListId) => {
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, listId: toListId } : i))
  }, [setItems])

  return {
    lists,
    items,
    isFull: lists.length >= MAX_CUSTOM_LISTS,
    addList, renameList, deleteList,
    addItem, removeItem, toggleDone, updateItem, getListItems, moveItemToList,
  }
}
