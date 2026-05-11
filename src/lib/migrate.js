// One-time migration: localStorage → Supabase on first sign-in.
import { supabase } from './supabase'

const MIGRATED_KEY = 'pyw_migrated'

function read(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export async function migrateLocalToSupabase(userId) {
  if (localStorage.getItem(MIGRATED_KEY)) return

  const dumpItems = read('pyw_dump') ?? []
  const projects = read('pyw_projects') ?? []
  const weekPlans = read('pyw_week') ?? []
  const tasks = read('pyw_tasks') ?? []

  let migrated = false

  // Migrate dump items
  if (dumpItems.length > 0) {
    const rows = dumpItems.map((item, i) => ({
      user_id: userId,
      text: item.text ?? item.content ?? '',
      position: item.position ?? i,
    }))
    const { error } = await supabase.from('dump_items').insert(rows)
    if (error) console.error('Dump migration failed:', error.message)
    else migrated = true
  }

  // Migrate projects
  if (projects.length > 0) {
    const rows = projects.map((p, i) => ({
      user_id: userId,
      name: p.name ?? '',
      color: p.color ?? '#5CC8FF',
      archived: p.archived ?? false,
      position: p.position ?? p.sort_order ?? i,
    }))
    const { error } = await supabase.from('projects').insert(rows)
    if (error) console.error('Projects migration failed:', error.message)
    else migrated = true
  }

  // Migrate weekly plans + tasks
  if (weekPlans.length > 0) {
    for (const plan of weekPlans) {
      const weekStart = plan.week_start
      if (!weekStart) continue

      const mits = plan.mits ?? ['', '', '']
      const { data: planData, error: planError } = await supabase
        .from('weekly_plans')
        .insert({
          user_id: userId,
          week_start: weekStart,
          mit_1: mits[0] || null,
          mit_2: mits[1] || null,
          mit_3: mits[2] || null,
        })
        .select()
        .single()

      if (planError) {
        console.error('Week plan migration failed:', planError.message)
        continue
      }

      // Migrate slot tasks for this week
      const slots = plan.slots ?? {}
      const taskRows = []
      for (const [day, slotTypes] of Object.entries(slots)) {
        for (const [slotType, slotTasks] of Object.entries(slotTypes)) {
          ;(slotTasks ?? []).forEach((task, i) => {
            taskRows.push({
              user_id: userId,
              weekly_plan_id: planData.id,
              text: task.text ?? '',
              slot_type: slotType,
              day,
              position: task.position ?? i,
            })
          })
        }
      }

      if (taskRows.length > 0) {
        const { error: tasksError } = await supabase.from('tasks').insert(taskRows)
        if (tasksError) console.error('Tasks migration failed:', tasksError.message)
      }

      migrated = true
    }
  }

  // Also check flat tasks array (older localStorage format)
  if (tasks.length > 0 && weekPlans.length === 0) {
    // If tasks exist but no week plans, they're orphaned — skip
    console.warn('Orphaned tasks in localStorage, skipping migration')
  }

  if (migrated || (dumpItems.length === 0 && projects.length === 0 && weekPlans.length === 0)) {
    localStorage.setItem(MIGRATED_KEY, new Date().toISOString())
  }
}
