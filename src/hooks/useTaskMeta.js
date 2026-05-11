import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

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

export function useTaskMeta(user) {
  const [meta, setMeta] = useState(load)
  const userRef = useRef(user)
  useEffect(() => { userRef.current = user }, [user])

  // On login, load is_complete from Supabase and merge into local meta
  useEffect(() => {
    if (!user) return
    ;(async () => {
      const { data } = await supabase
        .from('tasks')
        .select('id, is_complete')
        .eq('user_id', user.id)
      if (!data) return
      setMeta(prev => {
        const next = { ...prev }
        let changed = false
        data.forEach(task => {
          if (task.is_complete && (!next[task.id] || !next[task.id].done)) {
            next[task.id] = { ...DEFAULT, ...next[task.id], done: true }
            changed = true
          }
        })
        if (changed) save(next)
        return changed ? next : prev
      })
    })()
  }, [user])

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

    // Sync done state to Supabase
    if (userRef.current && 'done' in changes) {
      supabase
        .from('tasks')
        .update({ is_complete: changes.done })
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('[task-meta] sync error:', error.message)
        })
    }
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
