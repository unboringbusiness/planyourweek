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

  const dumpItems = read('pyw_dump') ?? []
  const projects = read('pyw_projects') ?? []
  const weekPlans = read('pyw_week') ?? []

  const hasData = dumpItems.length > 0 || projects.length > 0 || weekPlans.length > 0
  if (!hasData) {
    console.log('[migrate] No localStorage data to migrate')
    localStorage.setItem(MIGRATED_KEY, new Date().toISOString())
    return
  }

  // Migrate dump items (skip duplicates)
  if (dumpItems.length > 0) {
    const rows = dumpItems.map((item, i) => ({
      user_id: userId,
      text: item.text ?? item.content ?? '',
      position: item.position ?? i,
    }))
    const { error } = await supabase.from('dump_items').upsert(rows, { onConflict: 'id', ignoreDuplicates: true })
    if (error) console.error('[migrate] Dump items:', error.message)
    else console.log(`[migrate] Migrated ${rows.length} dump items`)
  }

  // Migrate projects (skip duplicates)
  if (projects.length > 0) {
    const rows = projects.map((p, i) => ({
      user_id: userId,
      name: p.name ?? '',
      color: p.color ?? '#5CC8FF',
      archived: p.archived ?? false,
      position: p.position ?? p.sort_order ?? i,
    }))
    const { error } = await supabase.from('projects').upsert(rows, { onConflict: 'id', ignoreDuplicates: true })
    if (error) console.error('[migrate] Projects:', error.message)
    else console.log(`[migrate] Migrated ${rows.length} projects`)
  }

  // Migrate weekly plans + tasks (use upsert to handle existing weeks)
  for (const plan of weekPlans) {
    const weekStart = plan.week_start
    if (!weekStart) continue

    const mits = plan.mits ?? ['', '', '']

    // Check if plan already exists for this week
    const { data: existing } = await supabase
      .from('weekly_plans')
      .select('id')
      .eq('user_id', userId)
      .eq('week_start', weekStart)
      .single()

    let planId
    if (existing) {
      planId = existing.id
      console.log(`[migrate] Week ${weekStart} already exists, skipping plan insert`)
    } else {
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
        console.error(`[migrate] Weekly plan ${weekStart}:`, planError.message)
        continue
      }
      planId = planData.id
    }

    // Migrate slot tasks (only if plan didn't already have tasks)
    const { data: existingTasks } = await supabase
      .from('tasks').select('id').eq('weekly_plan_id', planId).limit(1)

    if (existingTasks?.length > 0) {
      console.log(`[migrate] Week ${weekStart} already has tasks, skipping`)
      continue
    }

    const slots = plan.slots ?? {}
    const taskRows = []
    for (const [day, slotTypes] of Object.entries(slots)) {
      for (const [slotType, slotTasks] of Object.entries(slotTypes)) {
        ;(slotTasks ?? []).forEach((task, i) => {
          if (!task.text) return
          taskRows.push({
            user_id: userId,
            weekly_plan_id: planId,
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
      if (tasksError) console.error(`[migrate] Tasks for ${weekStart}:`, tasksError.message)
      else console.log(`[migrate] Migrated ${taskRows.length} tasks for week ${weekStart}`)
    }
  }

  // Always mark as migrated to stop retrying
  console.log('[migrate] Migration complete')
  localStorage.setItem(MIGRATED_KEY, new Date().toISOString())
}
