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

  console.log('[migrate] Starting localStorage → Supabase migration…')

  // Check if user already has data in Supabase (returning user, not first login)
  const { data: existingDump } = await supabase
    .from('dump_items').select('id').limit(1)
  const { data: existingPlans } = await supabase
    .from('weekly_plans').select('id').limit(1)

  if ((existingDump?.length > 0) || (existingPlans?.length > 0)) {
    console.log('[migrate] User already has Supabase data, skipping migration')
    localStorage.setItem(MIGRATED_KEY, new Date().toISOString())
    return
  }

  const dumpItems = read('pyw_dump') ?? []
  const projects = read('pyw_projects') ?? []
  const weekPlans = read('pyw_week') ?? []

  const hasData = dumpItems.length > 0 || projects.length > 0 || weekPlans.length > 0
  if (!hasData) {
    console.log('[migrate] No localStorage data to migrate')
    localStorage.setItem(MIGRATED_KEY, new Date().toISOString())
    return
  }

  let errors = []

  // Migrate dump items
  if (dumpItems.length > 0) {
    const rows = dumpItems.map((item, i) => ({
      user_id: userId,
      text: item.text ?? item.content ?? '',
      position: item.position ?? i,
    }))
    const { error } = await supabase.from('dump_items').insert(rows)
    if (error) {
      console.error('[migrate] Dump items failed:', error.message)
      errors.push('dump_items: ' + error.message)
    } else {
      console.log(`[migrate] Migrated ${rows.length} dump items`)
    }
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
    if (error) {
      console.error('[migrate] Projects failed:', error.message)
      errors.push('projects: ' + error.message)
    } else {
      console.log(`[migrate] Migrated ${rows.length} projects`)
    }
  }

  // Migrate weekly plans + tasks
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
      console.error('[migrate] Weekly plan failed:', planError.message)
      errors.push('weekly_plans: ' + planError.message)
      continue
    }

    // Migrate slot tasks
    const slots = plan.slots ?? {}
    const taskRows = []
    for (const [day, slotTypes] of Object.entries(slots)) {
      for (const [slotType, slotTasks] of Object.entries(slotTypes)) {
        ;(slotTasks ?? []).forEach((task, i) => {
          if (!task.text) return
          taskRows.push({
            user_id: userId,
            weekly_plan_id: planData.id,
            text: task.text,
            slot_type: slotType,
            day,
            position: task.position ?? i,
          })
        })
      }
    }

    if (taskRows.length > 0) {
      const { error: tasksError } = await supabase.from('tasks').insert(taskRows)
      if (tasksError) {
        console.error('[migrate] Tasks failed:', tasksError.message)
        errors.push('tasks: ' + tasksError.message)
      } else {
        console.log(`[migrate] Migrated ${taskRows.length} tasks for week ${weekStart}`)
      }
    }
  }

  if (errors.length === 0) {
    console.log('[migrate] Migration complete')
    localStorage.setItem(MIGRATED_KEY, new Date().toISOString())
  } else {
    console.error('[migrate] Migration had errors:', errors)
    // Don't set MIGRATED_KEY so it retries next time
  }
}
