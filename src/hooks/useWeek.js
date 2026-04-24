import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getWeekPlan, setWeekPlan } from '../lib/storage'
import { getCurrentWeekStart } from '../lib/dates'
import { LIMITS } from '../lib/limits'

const SLOT_TYPE_LIMITS = {
  deep_work: LIMITS.DAILY_DEEP_WORK,
  scheduled: LIMITS.DAILY_SCHEDULED,
  admin: LIMITS.DAILY_ADMIN,
}

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

function totalFocusHours(slots) {
  const dw = (slots?.deep_work ?? []).reduce((sum, s) => sum + (s.estimated_hours ?? 0), 0)
  const sc = (slots?.scheduled ?? []).reduce((sum, s) => sum + (s.estimated_hours ?? 0), 0)
  return dw + sc
}

export function useWeek(user) {
  const [week, setWeek] = useState(emptyWeek())
  const [weekStart, setWeekStart] = useState(null)
  const [planId, setPlanId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const currentWeekStart = getCurrentWeekStart()
    setWeekStart(currentWeekStart)

    async function load() {
      setLoading(true)
      setError(null)
      if (user) {
        const { data: planData, error: planError } = await supabase
          .from('weekly_plans').select('*')
          .eq('user_id', user.id).eq('week_start', currentWeekStart).single()

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
        const local = getWeekPlan(currentWeekStart)
        setWeek(local ?? emptyWeek())
      }
      setLoading(false)
    }
    load()
  }, [user])

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

  const addTask = useCallb

ls src/hooks/
ls src/hooks/
