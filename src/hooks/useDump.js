import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getDumpItems, setDumpItems } from '../lib/storage'
import { LIMITS } from '../lib/limits'

export function useDump(user) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      if (user) {
        const { data, error: fetchError } = await supabase
          .from('dump_items')
          .select('*')
          .order('position', { ascending: true })
        if (fetchError) setError(fetchError.message)
        else setItems(data ?? [])
      } else {
        setItems(getDumpItems())
      }
      setLoading(false)
    }
    load()
  }, [user])

  const addItem = useCallback(async (text) => {
    const trimmed = text.trim()
    if (!trimmed) return { error: 'Empty item' }
    if (items.length >= LIMITS.DUMP_MAX) {
      return { error: `Capture is full. Process some items before adding more.` }
    }
    const newItem = { text: trimmed, position: items.length, created_at: new Date().toISOString() }
    if (user) {
      const { data, error: insertError } = await supabase
        .from('dump_items')
        .insert({ ...newItem, user_id: user.id })
        .select()
        .single()
      if (insertError) return { error: insertError.message }
      setItems(prev => [...prev, data])
      return { data }
    } else {
      const localItem = { ...newItem, id: crypto.randomUUID() }
      const updated = [...items, localItem]
      setItems(updated)
      setDumpItems(updated)
      return { data: localItem }
    }
  }, [items, user])

  const removeItem = useCallback(async (id) => {
    if (user) {
      const { error: deleteError } = await supabase.from('dump_items').delete().eq('id', id)
      if (deleteError) return { error: deleteError.message }
    }
    const updated = items.filter(i => i.id !== id)
    setItems(updated)
    if (!user) setDumpItems(updated)
    return {}
  }, [items, user])

  const reorderItems = useCallback(async (reordered) => {
    setItems(reordered)
    if (!user) { setDumpItems(reordered); return {} }
    const updates = reordered.map((item, index) => ({ id: item.id, position: index }))
    const { error: upsertError } = await supabase.from('dump_items').upsert(updates, { onConflict: 'id' })
    if (upsertError) return { error: upsertError.message }
    return {}
  }, [user])

  const updateItem = useCallback(async (id, text) => {
    const trimmed = text.trim()
    if (!trimmed) return { error: 'Empty text' }
    if (user) {
      const { error: updateError } = await supabase.from('dump_items').update({ text: trimmed }).eq('id', id)
      if (updateError) return { error: updateError.message }
    }
    const updated = items.map(i => i.id === id ? { ...i, text: trimmed } : i)
    setItems(updated)
    if (!user) setDumpItems(updated)
    return {}
  }, [items, user])

  return {
    items, loading, error,
    count: items.length,
    isFull: items.length >= LIMITS.DUMP_MAX,
    addItem, removeItem, reorderItems, updateItem,
  }
}
