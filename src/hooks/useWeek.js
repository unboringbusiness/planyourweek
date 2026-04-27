import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getWeekPlan, setWeekPlan } from '../lib/storage'
import { LIMITS } from '../lib/limits'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

function emptyWeek() {
  const week = { mits: ['', '', ''], tasks: {}, slots: {} }
  DAYS.forEach(day => {
    week.tasks[day] = []
    week.slots[day] = { deep_work: [], scheduled: [], admin: [] }
  })
  return week
}

function mitsToColumns(mits) {
  return { mit_1: mits[0] || null, mit_2: mits[1] || null, mit_3: mits[2] || null }
}

function columnsToMits(row) {
  return [row.mit_1 || '', row.mit_2 || '', row.mit_3 || '']
}

const SLOT_LIMITS = {
  deep_work: LIMITS.DAILY_DEEP_WORK,
  scheduled: LIMITS.DAILY_SCHEDULED,
  admin: LIMITS.DAILY_ADMIN,
}

export function useWeek(user, weekStart) {
  const [week, setWeek] = useState(emptyWeek())
  const [planId, setPlanId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!weekStart) return
    setPlanId(null)

    async function load() {
      setLoading(true)
      setError(null)
      if (user) {
        const { data: planData, error: planError } = await supabase
          .from('weekly_plans').select('*')
          .eq('user_id', user.id).eq('week_start', weekStart).single()

        if (planError && planError.code !== 'PGRST116') {
          setError(planError.message); setLoading(false); return
        }

        if (planData) {
          setPlanId(planData.id)
          const { data: tasksData, error: tasksError } = await supabase
            .from('tasks').select('*').eq('weekly_plan_id', planData.id).order('position', { ascending: true })
          if (tasksError) { setError(tasksError.message); setLoading(false); return }

          const weekShape = emptyWeek()
          weekShape.mits = columnsToMits(planData)
          ;(tasksData ?? []).forEach(task => {
            if (task.slot_type) weekShape.slots[task.day][task.slot_type].push(task)
            else weekShape.tasks[task.day].push(task)
          })
          setWeek(weekShape)
        } else {
          setWeek(emptyWeek())
        }
      } else {
        const local = getWeekPlan(weekStart)
        setWeek(local ?? emptyWeek())
      }
      setLoading(false)
    }
    load()
  }, [user, weekStart])

  useEffect(() => {
    if (!user && weekStart && !loading) setWeekPlan(weekStart, week)
  }, [week, user, weekStart, loading])

  async function ensurePlan(currentPlanId) {
    if (currentPlanId) return currentPlanId
    const { data, error: insertError } = await supabase
      .from('weekly_plans').insert({ user_id: user.id, week_start: weekStart }).select().single()
    if (insertError) throw new Error(insertError.message)
    setPlanId(data.id)
    return data.id
  }

  const setMITs = useCallback(async (mits) => {
    const clamped = [mits[0] || '', mits[1] || '', mits[2] || '']
    setWeek(prev => ({ ...prev, mits: clamped }))
    if (user) {
      const cols = mitsToColumns(clamped)
      if (planId) {
        const { error: updateError } = await supabase.from('weekly_plans').update(cols).eq('id', planId)
        if (updateError) return { error: updateError.message }
      } else {
        const { data, error: insertError } = await supabase
          .from('weekly_plans').insert({ user_id: user.id, week_start: weekStart, ...cols }).select().single()
        if (insertError) return { error: insertError.message }
        setPlanId(data.id)
      }
    }
    return {}
  }, [user, planId, weekStart])

  const addSlot = useCallback(async (day, slotType, text) => {
    const trimmed = text?.trim()
    if (!trimmed) return { error: 'Empty task' }
    const currentSlots = week.slots[day]?.[slotType] ?? []
    const limit = SLOT_LIMITS[slotType]
    if (limit && currentSlots.length >= limit) {
      return { error: `${slotType.replace('_', ' ')} limit reached (${limit} max)` }
    }

    const totalTasks = Object.values(week.slots[day] ?? {}).flat().length
    if (totalTasks >= LIMITS.DAILY_TOTAL) {
      return { error: `Daily limit reached (${LIMITS.DAILY_TOTAL} tasks max)` }
    }

    const newTask = {
      text: trimmed,
      slot_type: slotType,
      day,
      position: currentSlots.length,
      created_at: new Date().toISOString(),
    }

    if (user) {
      try {
        const pid = await ensurePlan(planId)
        const { data, error: insertError } = await supabase
          .from('tasks').insert({ ...newTask, user_id: user.id, weekly_plan_id: pid }).select().single()
        if (insertError) return { error: insertError.message }
        setWeek(prev => ({
          ...prev,
          slots: {
            ...prev.slots,
            [day]: { ...prev.slots[day], [slotType]: [...prev.slots[day][slotType], data] },
          },
        }))
        return { data }
      } catch (e) {
        return { error: e.message }
      }
    } else {
      const local = { ...newTask, id: crypto.randomUUID() }
      setWeek(prev => ({
        ...prev,
        slots: {
          ...prev.slots,
          [day]: { ...prev.slots[day], [slotType]: [...prev.slots[day][slotType], local] },
        },
      }))
      return { data: local }
    }
  }, [week, user, planId, weekStart])

  const removeSlot = useCallback(async (day, slotId) => {
    if (user) {
      const { error: deleteError } = await supabase.from('tasks').delete().eq('id', slotId)
      if (deleteError) return { error: deleteError.message }
    }
    setWeek(prev => {
      const daySlots = { ...prev.slots[day] }
      for (const type of Object.keys(daySlots)) {
        daySlots[type] = daySlots[type].filter(t => t.id !== slotId)
      }
      return { ...prev, slots: { ...prev.slots, [day]: daySlots } }
    })
    return {}
  }, [user])

  const addTask = useCallback(async (day, text) => {
    const trimmed = text?.trim()
    if (!trimmed) return { error: 'Empty task' }
    const currentTasks = week.tasks[day] ?? []
    const totalTasks = currentTasks.length + Object.values(week.slots[day] ?? {}).flat().length
    if (totalTasks >= LIMITS.DAILY_TOTAL) {
      return { error: `Daily limit reached (${LIMITS.DAILY_TOTAL} tasks max)` }
    }

    const newTask = { text: trimmed, day, position: currentTasks.length, created_at: new Date().toISOString() }

    if (user) {
      try {
        const pid = await ensurePlan(planId)
        const { data, error: insertError } = await supabase
          .from('tasks').insert({ ...newTask, user_id: user.id, weekly_plan_id: pid }).select().single()
        if (insertError) return { error: insertError.message }
        setWeek(prev => ({
          ...prev,
          tasks: { ...prev.tasks, [day]: [...prev.tasks[day], data] },
        }))
        return { data }
      } catch (e) {
        return { error: e.message }
      }
    } else {
      const local = { ...newTask, id: crypto.randomUUID() }
      setWeek(prev => ({
        ...prev,
        tasks: { ...prev.tasks, [day]: [...prev.tasks[day], local] },
      }))
      return { data: local }
    }
  }, [week, user, planId, weekStart])

  const removeTask = useCallback(async (day, taskId) => {
    if (user) {
      const { error: deleteError } = await supabase.from('tasks').delete().eq('id', taskId)
      if (deleteError) return { error: deleteError.message }
    }
    setWeek(prev => ({
      ...prev,
      tasks: { ...prev.tasks, [day]: prev.tasks[day].filter(t => t.id !== taskId) },
    }))
    return {}
  }, [user])

  const reorderSlots = useCallback((day, slotType, tasks) => {
    setWeek(prev => ({
      ...prev,
      slots: {
        ...prev.slots,
        [day]: { ...prev.slots[day], [slotType]: tasks },
      },
    }))
  }, [])

  const clearWeek = useCallback(() => {
    setWeek(emptyWeek())
    setPlanId(null)
  }, [])

  const getDayStats = useCallback((day) => {
    const slots = week.slots[day] ?? {}
    const tasks = week.tasks[day] ?? []
    return {
      deepWork: slots.deep_work?.length ?? 0,
      scheduled: slots.scheduled?.length ?? 0,
      admin: slots.admin?.length ?? 0,
      total: tasks.length + Object.values(slots).flat().length,
    }
  }, [week])

  return {
    week,
    weekStart,
    loading,
    error,
    days: DAYS,
    setMITs,
    addSlot,
    removeSlot,
    addTask,
    removeTask,
    reorderSlots,
    clearWeek,
    getDayStats,
  }
}
