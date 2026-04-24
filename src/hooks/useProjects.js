import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getProjects, setProjects } from '../lib/storage'
import { LIMITS } from '../lib/limits'

export function useProjects(user) {
  const [projects, setProjectsState] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      if (user) {
        const { data, error: fetchError } = await supabase
          .from('projects').select('*').order('position', { ascending: true })
        if (fetchError) setError(fetchError.message)
        else setProjectsState(data ?? [])
      } else {
        setProjectsState(getProjects())
      }
      setLoading(false)
    }
    load()
  }, [user])

  const addProject = useCallback(async ({ name, color = '#5CC8FF' }) => {
    const trimmed = name.trim()
    if (!trimmed) return { error: 'Project name required' }
    const active = projects.filter(p => !p.archived)
    if (active.length >= LIMITS.PROJECTS_MAX) {
      return { error: `${LIMITS.PROJECTS_MAX} active projects max. Archive one first.` }
    }
    const newProject = { name: trimmed, color, archived: false, position: projects.length, created_at: new Date().toISOString() }
    if (user) {
      const { data, error: insertError } = await supabase
        .from('projects').insert({ ...newProject, user_id: user.id }).select().single()
      if (insertError) return { error: insertError.message }
      setProjectsState(prev => [...prev, data])
      return { data }
    } else {
      const local = { ...newProject, id: crypto.randomUUID() }
      const updated = [...projects, local]
      setProjectsState(updated)
      setProjects(updated)
      return { data: local }
    }
  }, [projects, user])

  const updateProject = useCallback(async (id, changes) => {
    if (user) {
      const { error: updateError } = await supabase.from('projects').update(changes).eq('id', id)
      if (updateError) return { error: updateError.message }
    }
    const updated = projects.map(p => p.id === id ? { ...p, ...changes } : p)
    setProjectsState(updated)
    if (!user) setProjects(updated)
    return {}
  }, [projects, user])

  const archiveProject = useCallback(async (id) => {
    return updateProject(id, { archived: true })
  }, [updateProject])

  const deleteProject = useCallback(async (id) => {
    if (user) {
      const { error: deleteError } = await supabase.from('projects').delete().eq('id', id)
      if (deleteError) return { error: deleteError.message }
    }
    const updated = projects.filter(p => p.id !== id)
    setProjectsState(updated)
    if (!user) setProjects(updated)
    return {}
  }, [projects, user])

  const reorderProjects = useCallback(async (reordered) => {
    setProjectsState(reordered)
    if (!user) { setProjects(reordered); return {} }
    const updates = reordered.map((p, index) => ({ id: p.id, position: index }))
    const { error: upsertError } = await supabase.from('projects').upsert(updates, { onConflict: 'id' })
    if (upsertError) return { error: upsertError.message }
    return {}
  }, [user])

  return {
    projects,
    activeProjects: projects.filter(p => !p.archived),
    archivedProjects: projects.filter(p => p.archived),
    loading, error,
    isFull: projects.filter(p => !p.archived).length >= LIMITS.PROJECTS_MAX,
    addProject, updateProject, archiveProject, deleteProject, reorderProjects,
  }
}
