import { getSupabase, authenticateRequest } from './_lib/supabase.js'
import { getWeekStart } from './_lib/dates.js'

export default async function handler(req, res) {
  const userId = await authenticateRequest(req)
  if (!userId) return res.status(401).json({ error: 'Invalid or missing API key' })
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const db = getSupabase()
  const weekStart = req.query.week_start || getWeekStart()

  const { data: plan } = await db
    .from('weekly_plans').select('*')
    .eq('user_id', userId).eq('week_start', weekStart).single()

  let tasks = []
  if (plan) {
    const { data } = await db
      .from('tasks').select('*')
      .eq('weekly_plan_id', plan.id)
      .order('position', { ascending: true })
    tasks = data || []
  }

  const days = {}
  const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  for (const day of dayNames) {
    const dayTasks = tasks.filter(t => t.day === day)
    days[day] = {
      deep_work: dayTasks.filter(t => t.slot_type === 'deep_work'),
      scheduled: dayTasks.filter(t => t.slot_type === 'scheduled'),
      admin: dayTasks.filter(t => t.slot_type === 'admin'),
    }
  }

  return res.json({
    week_start: weekStart,
    milestones: plan ? [
      { index: 1, text: plan.mit_1 || '', done: plan.mit_1_done || false },
      { index: 2, text: plan.mit_2 || '', done: plan.mit_2_done || false },
      { index: 3, text: plan.mit_3 || '', done: plan.mit_3_done || false },
    ] : [],
    days,
    summary: {
      total_tasks: tasks.length,
      completed: tasks.filter(t => t.done).length,
      total_minutes: tasks.reduce((sum, t) => sum + (t.duration_minutes || 0), 0),
    },
  })
}
