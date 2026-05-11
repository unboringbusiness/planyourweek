#!/usr/bin/env node

// Plan Your Week MCP Server
// Connects Claude to planyourweek.co via the REST API

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

const API_BASE = 'https://app.planyourweek.co/api'
const API_KEY = process.env.PYW_API_KEY

async function api(path, options = {}) {
  const url = `${API_BASE}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  return res.json()
}

const server = new Server(
  { name: 'planyourweek', version: '1.0.0' },
  { capabilities: { tools: {} } }
)

server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'pyw_get_week',
      description: 'Get the full week overview — milestones, tasks by day, and summary stats. Use this to see what\'s planned for the week.',
      inputSchema: {
        type: 'object',
        properties: {
          week_start: { type: 'string', description: 'Week start date (YYYY-MM-DD, must be a Monday). Defaults to current week.' },
        },
      },
    },
    {
      name: 'pyw_add_task',
      description: 'Add a task to a specific day and slot type. Slot types: "deep_work" (Most Important, max 1/day), "scheduled" (Focus Tasks, max 2/day), "admin" (Other Tasks, max 5/day).',
      inputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'Task description' },
          day: { type: 'string', enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'], description: 'Day of the week' },
          slot_type: { type: 'string', enum: ['deep_work', 'scheduled', 'admin'], description: 'Task priority slot. deep_work = Most Important (1/day), scheduled = Focus Tasks (2/day), admin = Other Tasks (5/day).' },
          duration_minutes: { type: 'number', description: 'Estimated duration in minutes. Default 30.' },
          week_start: { type: 'string', description: 'Week start date (YYYY-MM-DD). Defaults to current week.' },
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
          done: { type: 'boolean', description: 'true to mark complete, false to uncheck' },
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
          text: { type: 'string', description: 'New task text' },
          duration_minutes: { type: 'number', description: 'New duration in minutes' },
          slot_type: { type: 'string', enum: ['deep_work', 'scheduled', 'admin'], description: 'Move to different slot type' },
        },
        required: ['id'],
      },
    },
    {
      name: 'pyw_delete_task',
      description: 'Delete a task.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Task UUID' },
        },
        required: ['id'],
      },
    },
    {
      name: 'pyw_get_milestones',
      description: 'Get the 3 weekly milestones (big goals for the week).',
      inputSchema: {
        type: 'object',
        properties: {
          week_start: { type: 'string', description: 'Week start date (YYYY-MM-DD). Defaults to current week.' },
        },
      },
    },
    {
      name: 'pyw_set_milestones',
      description: 'Set or update weekly milestones. You can set text and/or done status for milestones 1-3.',
      inputSchema: {
        type: 'object',
        properties: {
          milestones: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                index: { type: 'number', enum: [1, 2, 3], description: 'Milestone number (1-3)' },
                text: { type: 'string', description: 'Milestone text' },
                done: { type: 'boolean', description: 'Whether milestone is complete' },
              },
              required: ['index'],
            },
            description: 'Array of milestone updates',
          },
          week_start: { type: 'string', description: 'Week start date (YYYY-MM-DD). Defaults to current week.' },
        },
        required: ['milestones'],
      },
    },
  ],
}))

server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params

  try {
    let result

    switch (name) {
      case 'pyw_get_week': {
        const qs = args.week_start ? `?week_start=${args.week_start}` : ''
        result = await api(`/week${qs}`)
        break
      }

      case 'pyw_add_task': {
        result = await api('/tasks', {
          method: 'POST',
          body: JSON.stringify({
            text: args.text,
            day: args.day,
            slot_type: args.slot_type,
            duration_minutes: args.duration_minutes || 30,
            week_start: args.week_start,
          }),
        })
        break
      }

      case 'pyw_complete_task': {
        result = await api(`/tasks?id=${args.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ done: args.done }),
        })
        break
      }

      case 'pyw_update_task': {
        const body = {}
        if (args.text) body.text = args.text
        if (args.duration_minutes) body.duration_minutes = args.duration_minutes
        if (args.slot_type) body.slot_type = args.slot_type
        result = await api(`/tasks?id=${args.id}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        })
        break
      }

      case 'pyw_delete_task': {
        result = await api(`/tasks?id=${args.id}`, { method: 'DELETE' })
        break
      }

      case 'pyw_get_milestones': {
        const qs = args.week_start ? `?week_start=${args.week_start}` : ''
        result = await api(`/milestones${qs}`)
        break
      }

      case 'pyw_set_milestones': {
        result = await api(`/milestones${args.week_start ? `?week_start=${args.week_start}` : ''}`, {
          method: 'PUT',
          body: JSON.stringify({ milestones: args.milestones }),
        })
        break
      }

      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true }
    }

    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
  } catch (err) {
    return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true }
  }
})

const transport = new StdioServerTransport()
await server.connect(transport)
