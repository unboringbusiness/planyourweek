import { getSupabase, authenticateRequest } from './_lib/supabase.js'
import { getWeekStart } from './_lib/dates.js'

export default async function handler(req, res) {
  const userId = await authenticateRequest(req)
  if (!userId) return res.status(401).json({ error: 'Invalid or missing API key' })

  const db = getSupabase()
  const method = req.method
  const weekStart = req.query.week_start || req.body?.week_start || getWeekStart()

  if (method === 'GET') {
    const { data, error } = await db
      .from('weekly_plans')
      .select('id, week_start, mit_1, mit_2, mit_3, mit_1_done, mit_2_done, mit_3_done')
      .eq('user_id', userId).eq('week_start', weekStart).single()

    if (error && error.code === 'PGRST116') {
      return res.json({ milestones: [
        { index: 1, text: '', done: false },
        { index: 2, text: '', done: false },
        { index: 3, text: '', done: false },
      ], week_start: weekStart })
    }
    if (error) return res.status(500).json({ error: error.message })

    return res.json({
      milestones: [
        { index: 1, text: data.mit_1 || '', done: data.mit_1_done || false },
        { index: 2, text: data.mit_2 || '', done: data.mit_2_done || false },
        { index: 3, text: data.mit_3 || '', done: data.mit_3_done || false },
      ],
      week_start: weekStart,
    })
  }

  if (method === 'PUT') {
    const { milestones } = req.body
    if (!milestones) return res.status(400).json({ error: 'milestones array required' })

    const updates = {}
    for (const m of milestones) {
      if (m.index < 1 || m.index > 3) continue
      if ('text' in m) updates[`mit_${m.index}`] = m.text
      if ('done' in m) updates[`mit_${m.index}_done`] = m.done
    }

    let { data: plan } = await db
      .from('weekly_plans').select('id')
      .eq('user_id', userId).eq('week_start', weekStart).single()

    if (!plan) {
      const { data: newPlan, error: planErr } = await db
        .from('weekly_plans')
        .insert({ user_id: userId, week_start: weekStart, ...updates })
        .select().single()
      if (planErr) return res.status(500).json({ error: planErr.message })
    } else {
      const { error: updateErr } = await db
        .from('weekly_plans').update(updates).eq('id', plan.id)
      if (updateErr) return res.status(500).json({ error: updateErr.message })
    }

    return res.json({ updated: true, week_start: weekStart })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
