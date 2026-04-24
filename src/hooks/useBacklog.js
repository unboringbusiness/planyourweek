import { useState, useCallback } from 'react'

const KEY = 'pyw_backlog'
export const BACKLOG_MAX = 15

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) ?? [] }
  catch { return [] }
}

function save(items) {
  try { localStorage.setItem(KEY, JSON.stringify(items)) }
  catch {}
}

export function useBacklog() {
  const [items, setItems] = useState(load)

  const mutate = useCallback((fn) => {
    setItems(prev => {
      const next = fn(prev)
      save(next)
      return next
    })
  }, [])

  const addItem = useCallback((text, duration = 30) => {
    const item = {
      id: crypto.randomUUID(),
      text: text.trim(),
      duration,
      is_mit: false,
      done: false,
      created_at: new Date().toISOString(),
    }
    mutate(prev => [...prev, item])
    return item
  }, [mutate])

  const removeItem = useCallback((id) => {
    mutate(prev => prev.filter(i => i.id !== id))
  }, [mutate])

  const updateItem = useCallback((id, changes) => {
    mutate(prev => prev.map(i => i.id === id ? { ...i, ...changes } : i))
  }, [mutate])

  const reorderItems = useCallback((reordered) => {
    mutate(() => reordered)
  }, [mutate])

  return {
    items,
    count: items.length,
    isAtCapacity: items.length >= BACKLOG_MAX,
    BACKLOG_MAX,
    addItem,
    removeItem,
    updateItem,
    reorderItems,
  }
}
