# planyourweek-mcp

MCP server that connects Claude to [Plan Your Week](https://app.planyourweek.co) — manage your weekly tasks and milestones via AI.

## Setup

1. Sign up at [app.planyourweek.co](https://app.planyourweek.co)
2. Go to Settings and generate an API key
3. Add to your Claude Code config (`.mcp.json`):

```json
{
  "mcpServers": {
    "planyourweek": {
      "command": "npx",
      "args": ["planyourweek-mcp"],
      "env": {
        "PYW_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

4. Restart Claude Code

## Available Tools

| Tool | Description |
|------|-------------|
| `pyw_get_week` | Get full week overview — milestones, tasks, stats |
| `pyw_add_task` | Add a task to a specific day and slot |
| `pyw_complete_task` | Mark a task as done |
| `pyw_update_task` | Edit a task's text, duration, or type |
| `pyw_delete_task` | Remove a task |
| `pyw_get_milestones` | Get weekly milestones |
| `pyw_set_milestones` | Set or update milestones |

## Example Usage

Just talk to Claude:
- "Add 'Review PRD' to Tuesday as a focus task"
- "What's on my plate this week?"
- "Mark the Monday deep work task as done"
- "Set milestone 2 to 'Ship landing page'"
