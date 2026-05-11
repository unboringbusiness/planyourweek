import { getSupabase, authenticateRequest } from './_lib/supabase.js'
import { getWeekStart } from './_lib/dates.js'

// Remote MCP server — Streamable HTTP transport
// This allows claude.ai and Claude for Work to connect

const TOOLS = [
  {
    name: 'pyw_get_week',
    description: 'Get the full week overview — milestones, tasks by day, and summary stats.',
    inputSchema: {
      type: 'object',
      properties: {
        week_start: { type: 'string', description: 'Week start date (YYYY-MM-DD, Monday). Defaults to current week.' },
      },
    },
  },
  {
    name: 'pyw_add_task',
    description: 'Add a task to a specific day. Slot types: "deep_work" (Most Important, 1/day), "scheduled" (Focus Tasks, 2/day), "admin" (Other Tasks, 5/day).',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Task description' },
        day: { type: 'string', enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
        slot_type: { type: 'string', enum: ['deep_work', 'scheduled', 'admin'], description: 'deep_work=Most Important, scheduled=Focus, admin=Other' },
        duration_minutes: { type: 'number', description: 'Estimated minutes. Default 30.' },
        week_start: { type: 'string', description: 'Week start (YYYY-MM-DD). Defaults to current week.' },
      },
      required: ['text', 'day', 'slot_type'],
    },
  },
  {
    name: 'pyw_complete_task',
    description: 'Mark a task as done or not done.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Task UUID' },
        done: { type: 'boolean', description: 'true=complete, false=uncheck' },
      },
      required: ['id', 'done'],
    },
  },
  {
    name: 'pyw_update_task',
    description: 'Update a task\'s text, duration, or slot type.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Task UUID' },
        text: { type: 'string' },
        duration_minutes: { type: 'number' },
        slot_type: { type: 'string', enum: ['deep_work', 'scheduled', 'admin'] },
      },
      required: ['id'],
    },
  },
  {
    name: 'pyw_delete_task',
    description: 'Delete a task.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'Task UUID' } },
      required: ['id'],
    },
  },
  {
    name: 'pyw_get_milestones',
    description: 'Get the 3 weekly milestones.',
    inputSchema: {
      type: 'object',
      properties: { week_start: { type: 'string' } },
    },
  },
  {
    name: 'pyw_set_milestones',
    description: 'Set or update weekly milestones (1-3).',
    inputSchema: {
      type: 'object',
      properties: {
        milestones: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              index: { type: 'number', enum: [1, 2, 3] },
              text: { type: 'string' },
              done: { type: 'boolean' },
            },
            required: ['index'],
          },
        },
        week_start: { type: 'string' },
      },
      required: ['milestones'],
    },
  },
]

async function handleToolCall(name, args, userId) {
  const db = getSupabase()

  switch (name) {
    case 'pyw_get_week': {
      const weekStart = args.week_start || getWeekStart()
      const { data: plan } = await db.from('weekly_plans').select('*')
        .eq('user_id', userId).eq('week_start', weekStart).single()
      let tasks = []
      if (plan) {
        const { data } = await db.from('tasks').select('*').eq('weekly_plan_id', plan.id).order('position')
        tasks = data || []
      }
      const days = {}
      for (const day of ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']) {
        const dt = tasks.filter(t => t.day === day)
        days[day] = { deep_work: dt.filter(t => t.slot_type === 'deep_work'), scheduled: dt.filter(t => t.slot_type === 'scheduled'), admin: dt.filter(t => t.slot_type === 'admin') }
      }
      return { week_start: weekStart, milestones: plan ? [1,2,3].map(i => ({ index: i, text: plan[`mit_${i}`] || '', done: plan[`mit_${i}_done`] || false })) : [], days, summary: { total_tasks: tasks.length, completed: tasks.filter(t => t.done).length, total_minutes: tasks.reduce((s,t) => s + (t.duration_minutes||0), 0) } }
    }
    case 'pyw_add_task': {
      const ws = args.week_start || getWeekStart()
      let { data: plan } = await db.from('weekly_plans').select('id').eq('user_id', userId).eq('week_start', ws).single()
      if (!plan) {
        const { data: np } = await db.from('weekly_plans').insert({ user_id: userId, week_start: ws }).select().single()
        plan = np
      }
      const { count } = await db.from('tasks').select('id', { count: 'exact', head: true }).eq('weekly_plan_id', plan.id).eq('day', args.day).eq('slot_type', args.slot_type)
      const { data, error } = await db.from('tasks').insert({ user_id: userId, weekly_plan_id: plan.id, text: args.text, day: args.day, slot_type: args.slot_type, duration_minutes: args.duration_minutes || 30, position: count || 0, done: false }).select().single()
      if (error) throw new Error(error.message)
      return { task: data }
    }
    case 'pyw_complete_task': {
      const { data, error } = await db.from('tasks').update({ done: args.done }).eq('id', args.id).eq('user_id', userId).select().single()
      if (error) throw new Error(error.message)
      return { task: data }
    }
    case 'pyw_update_task': {
      const body = {}
      if (args.text) body.text = args.text
      if (args.duration_minutes) body.duration_minutes = args.duration_minutes
      if (args.slot_type) body.slot_type = args.slot_type
      const { data, error } = await db.from('tasks').update(body).eq('id', args.id).eq('user_id', userId).select().single()
      if (error) throw new Error(error.message)
      return { task: data }
    }
    case 'pyw_delete_task': {
      const { error } = await db.from('tasks').delete().eq('id', args.id).eq('user_id', userId)
      if (error) throw new Error(error.message)
      return { deleted: true }
    }
    case 'pyw_get_milestones': {
      const ws = args.week_start || getWeekStart()
      const { data } = await db.from('weekly_plans').select('mit_1,mit_2,mit_3,mit_1_done,mit_2_done,mit_3_done').eq('user_id', userId).eq('week_start', ws).single()
      if (!data) return { milestones: [1,2,3].map(i => ({ index: i, text: '', done: false })), week_start: ws }
      return { milestones: [1,2,3].map(i => ({ index: i, text: data[`mit_${i}`] || '', done: data[`mit_${i}_done`] || false })), week_start: ws }
    }
    case 'pyw_set_milestones': {
      const ws = args.week_start || getWeekStart()
      const updates = {}
      for (const m of args.milestones) {
        if (m.index < 1 || m.index > 3) continue
        if ('text' in m) updates[`mit_${m.index}`] = m.text
        if ('done' in m) updates[`mit_${m.index}_done`] = m.done
      }
      let { data: plan } = await db.from('weekly_plans').select('id').eq('user_id', userId).eq('week_start', ws).single()
      if (!plan) {
        await db.from('weekly_plans').insert({ user_id: userId, week_start: ws, ...updates }).select().single()
      } else {
        await db.from('weekly_plans').update(updates).eq('id', plan.id)
      }
      return { updated: true, week_start: ws }
    }
    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}

export default async function handler(req, res) {
  // CORS for claude.ai
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()

  // GET — SSE endpoint for server-sent events (MCP discovery)
  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.write(`data: ${JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' })}\n\n`)
    return
  }

  // POST — JSON-RPC handler
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { jsonrpc, id, method, params } = req.body

  // Initialize
  if (method === 'initialize') {
    return res.json({
      jsonrpc: '2.0', id,
      result: {
        protocolVersion: '2025-03-26',
        capabilities: { tools: {} },
        serverInfo: { name: 'planyourweek', version: '1.0.0' },
      },
    })
  }

  // List tools — no auth needed
  if (method === 'tools/list') {
    return res.json({ jsonrpc: '2.0', id, result: { tools: TOOLS } })
  }

  // Call tool — needs auth
  if (method === 'tools/call') {
    const userId = await authenticateRequest(req)
    if (!userId) {
      return res.json({
        jsonrpc: '2.0', id,
        result: { content: [{ type: 'text', text: 'Error: Invalid or missing API key. Add your Plan Your Week API key as a Bearer token in the Authorization header.' }], isError: true },
      })
    }

    try {
      const result = await handleToolCall(params.name, params.arguments || {}, userId)
      return res.json({
        jsonrpc: '2.0', id,
        result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] },
      })
    } catch (err) {
      return res.json({
        jsonrpc: '2.0', id,
        result: { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true },
      })
    }
  }

  // Ping
  if (method === 'ping') {
    return res.json({ jsonrpc: '2.0', id, result: {} })
  }

  return res.json({ jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } })
}
