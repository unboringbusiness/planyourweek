import { useState, useCallback } from 'react'

const KEY = 'pyw_task_meta'
const DEFAULT = { duration: 30, is_mit: false, done: false }

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) ?? {} }
  catch { return {} }
}

function save(meta) {
  try { localStorage.setItem(KEY, JSON.stringify(meta)) }
  catch {}
}

export function useTaskMeta() {
  const [meta, setMeta] = useState(load)

  const mutate = useCallback((fn) => {
    setMeta(prev => {
      const next = fn(prev)
      save(next)
      return next
    })
  }, [])

  const getMeta = useCallback((id) => ({
    ...DEFAULT,
    ...meta[id],
  }), [meta])

  const setTaskMeta = useCallback((id, changes) => {
    mutate(prev => ({
      ...prev,
      [id]: { ...DEFAULT, ...prev[id], ...changes },
    }))
  }, [mutate])

  const copyMeta = useCallback((fromId, toId) => {
    mutate(prev => ({
      ...prev,
      [toId]: { ...DEFAULT, ...prev[fromId] },
    }))
  }, [mutate])

  const removeMeta = useCallback((id) => {
    mutate(prev => {
      const { [id]: _, ...rest } = prev
      return rest
    })
  }, [mutate])

  return { getMeta, setTaskMeta, copyMeta, removeMeta, meta }
}
