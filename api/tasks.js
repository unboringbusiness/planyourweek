import { getSupabase, authenticate, USER_ID } from './_lib/supabase.js'
import { getWeekStart } from './_lib/dates.js'

export default async function handler(req, res) {
  if (!authenticate(req)) return res.status(401).json({ error: 'Unauthorized' })

  const db = getSupabase()
  const method = req.method

  // GET /api/tasks?week_start=2026-05-11&day=monday
  if (method === 'GET') {
    const weekStart = req.query.week_start || getWeekStart()

    // Find the weekly plan
    const { data: plan } = await db
      .from('weekly_plans').select('id')
      .eq('user_id', USER_ID).eq('week_start', weekStart).single()

    if (!plan) return res.json({ tasks: [], week_start: weekStart })

    let query = db.from('tasks').select('*')
      .eq('weekly_plan_id', plan.id)
      .order('position', { ascending: true })

    if (req.query.day) query = query.eq('day', req.query.day)

    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ tasks: data, week_start: weekStart })
  }

  // POST /api/tasks { text, day, slot_type, duration_minutes? }
  if (method === 'POST') {
    const { text, day, slot_type = 'scheduled', duration_minutes = 30, week_start } = req.body
    if (!text || !day) return res.status(400).json({ error: 'text and day are required' })

    const ws = week_start || getWeekStart()

    // Ensure weekly plan exists
    let { data: plan } = await db
      .from('weekly_plans').select('id')
      .eq('user_id', USER_ID).eq('week_start', ws).single()

    if (!plan) {
      const { data: newPlan, error: planErr } = await db
        .from('weekly_plans').insert({ user_id: USER_ID, week_start: ws }).select().single()
      if (planErr) return res.status(500).json({ error: planErr.message })
      plan = newPlan
    }

    // Count existing tasks in this slot for position
    const { count } = await db
      .from('tasks').select('id', { count: 'exact', head: true })
      .eq('weekly_plan_id', plan.id).eq('day', day).eq('slot_type', slot_type)

    const { data, error } = await db.from('tasks').insert({
      user_id: USER_ID,
      weekly_plan_id: plan.id,
      text,
      day,
      slot_type,
      duration_minutes,
      position: count || 0,
      done: false,
    }).select().single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json({ task: data })
  }

  // PATCH /api/tasks?id=xxx { done?, text?, duration_minutes? }
  if (method === 'PATCH') {
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'id is required' })

    const allowed = {}
    if ('done' in req.body) allowed.done = req.body.done
    if ('text' in req.body) allowed.text = req.body.text
    if ('duration_minutes' in req.body) allowed.duration_minutes = req.body.duration_minutes
    if ('slot_type' in req.body) allowed.slot_type = req.body.slot_type

    const { data, error } = await db.from('tasks').update(allowed)
      .eq('id', id).eq('user_id', USER_ID).select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ task: data })
  }

  // DELETE /api/tasks?id=xxx
  if (method === 'DELETE') {
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'id is required' })

    const { error } = await db.from('tasks').delete()
      .eq('id', id).eq('user_id', USER_ID)
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ deleted: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
