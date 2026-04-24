import { useState, useEffect, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'

import { useAuth } from './hooks/useAuth'
import { useDump } from './hooks/useDump'
import { useWeek } from './hooks/useWeek'
import { useBacklog } from './hooks/useBacklog'
import { useTaskMeta } from './hooks/useTaskMeta'
import { LIMITS } from './lib/limits'

import TopBar from './components/layout/TopBar'
import ThisWeekPanel from './components/layout/ThisWeekPanel'
import MITsRow from './components/layout/MITsRow'
import WeekView from './components/week/WeekView'
import { TaskCardBase } from './components/week/TaskCard'
import DumpScreen from './components/dump/DumpScreen'
import DumpPanel from './components/dump/DumpPanel'
import ResetScreen from './components/reset/ResetScreen'
import SettingsPanel from './components/settings/SettingsPanel'

const SLOT_LIMITS = {
  deep_work: LIMITS.DAILY_DEEP_WORK,
  scheduled: LIMITS.DAILY_SCHEDULED,
  admin: LIMITS.DAILY_ADMIN,
}

function getSystemTheme() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getStoredTheme() {
  return localStorage.getItem('pyw_theme') || getSystemTheme()
}

function hasVisited() {
  return Boolean(localStorage.getItem('pyw_visited'))
}

export default function App() {
  const { user, loading: authLoading, signInWithEmail, signOut } = useAuth()
  const dump = useDump(user)
  const weekData = useWeek(user)
  const backlog = useBacklog()
  const taskMeta = useTaskMeta()

  const [theme, setTheme] = useState(getStoredTheme)
  const [view, setView] = useState('week')
  const [isFirstVisit, setIsFirstVisit] = useState(!hasVisited())
  const [dumpOpen, setDumpOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [activeDragItem, setActiveDragItem] = useState(null)

  // Apply theme to document
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('pyw_theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  const handleFirstVisitDone = () => {
    localStorage.setItem('pyw_visited', '1')
    setIsFirstVisit(false)
  }

  // Compute MIT items (backlog + day slots, up to 3)
  const { allMITs, mitCount } = useMemo(() => {
    const backlogMITs = backlog.items.filter(i => i.is_mit)
    const allSlotTasks = weekData.days.flatMap(day =>
      Object.values(weekData.week?.slots?.[day] ?? {}).flat()
    )
    const slotMITs = allSlotTasks.filter(t => taskMeta.getMeta(t.id).is_mit)
    const allMITs = [...backlogMITs, ...slotMITs]
    return { allMITs, mitCount: allMITs.length }
  }, [backlog.items, weekData.week, weekData.days, taskMeta.getMeta])

  // --- Helpers ---

  const getMeta = (id) => taskMeta.getMeta(id)
  const setTaskMetaFn = (id, changes) => taskMeta.setTaskMeta(id, changes)

  const moveBacklogItemToSection = async (item, day, slotType) => {
    const sectionTasks = weekData.week?.slots?.[day]?.[slotType] ?? []
    if (sectionTasks.length >= (SLOT_LIMITS[slotType] ?? 99)) return false

    const { data: newTask } = await weekData.addSlot(day, slotType, item.text)
    if (newTask) {
      taskMeta.setTaskMeta(newTask.id, {
        duration: item.duration ?? 30,
        is_mit: item.is_mit ?? false,
        done: item.done ?? false,
      })
    }
    backlog.removeItem(item.id)
    return true
  }

  const moveSlotToSection = async (task, fromDay, fromType, toDay, toType) => {
    if (fromDay === toDay && fromType === toType) return
    const toSection = weekData.week?.slots?.[toDay]?.[toType] ?? []
    if (toSection.length >= (SLOT_LIMITS[toType] ?? 99)) return

    const oldMeta = taskMeta.getMeta(task.id)
    weekData.removeSlot(fromDay, task.id)
    const { data: newTask } = await weekData.addSlot(toDay, toType, task.text)
    if (newTask) taskMeta.copyMeta(task.id, newTask.id)
    taskMeta.removeMeta(task.id)
  }

  const moveSlotToDump = async (task, day) => {
    await dump.addItem(task.text)
    weekData.removeSlot(day, task.id)
    taskMeta.removeMeta(task.id)
  }

  const moveBacklogToDump = async (item) => {
    await dump.addItem(item.text)
    backlog.removeItem(item.id)
  }

  const moveOverflowToDump = async () => {
    const overflow = backlog.items.slice(12)
    for (const item of overflow) {
      await dump.addItem(item.text)
      backlog.removeItem(item.id)
    }
  }

  // --- DnD ---

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const handleDragStart = ({ active }) => {
    setActiveDragItem(active.data.current ?? null)
  }

  const handleDragEnd = async ({ active, over }) => {
    setActiveDragItem(null)
    if (!over || active.id === over.id) return

    const activeData = active.data.current
    const overData = over.data.current

    if (!activeData) return

    // Backlog item dropped somewhere
    if (activeData.type === 'backlog') {
      const item = activeData.item

      // Dropped on a section drop zone
      if (overData?.type === 'section') {
        await moveBacklogItemToSection(item, overData.day, overData.slotType)
        return
      }

      // Dropped on a slot task (drop into that task's section)
      if (overData?.type === 'slot') {
        await moveBacklogItemToSection(item, overData.day, overData.slotType)
        return
      }

      // Dropped on another backlog item (reorder within panel)
      if (overData?.type === 'backlog') {
        const oldIdx = backlog.items.findIndex(i => i.id === active.id)
        const newIdx = backlog.items.findIndex(i => i.id === over.id)
        if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
          backlog.reorderItems(arrayMove(backlog.items, oldIdx, newIdx))
        }
        return
      }
    }

    // Slot task dropped somewhere
    if (activeData.type === 'slot') {
      const { task, day: fromDay, slotType: fromType } = activeData

      // Dropped on a section drop zone
      if (overData?.type === 'section') {
        await moveSlotToSection(task, fromDay, fromType, overData.day, overData.slotType)
        return
      }

      // Dropped on another slot task
      if (overData?.type === 'slot') {
        const { day: toDay, slotType: toType, task: overTask } = overData

        if (fromDay === toDay && fromType === toType) {
          // Same section: reorder
          const section = weekData.week?.slots?.[fromDay]?.[fromType] ?? []
          const oldIdx = section.findIndex(t => t.id === active.id)
          const newIdx = section.findIndex(t => t.id === over.id)
          if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
            weekData.reorderSlots(fromDay, fromType, arrayMove(section, oldIdx, newIdx))
          }
        } else {
          // Different section or day: move
          await moveSlotToSection(task, fromDay, fromType, toDay, toType)
        }
        return
      }
    }
  }

  // --- Weekly reset handler ---
  const handleReset = (nextWeekTasks = []) => {
    // Add "next week" items to backlog
    for (const task of nextWeekTasks) {
      backlog.addItem(task.text, taskMeta.getMeta(task.id).duration ?? 30)
    }
    weekData.clearWeek()
    setView('week')
  }

  // --- Render ---

  if (authLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg)',
        color: 'var(--text-2)',
        fontSize: 14,
      }}>
        Loading…
      </div>
    )
  }

  if (isFirstVisit) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
        <TopBar
          activeView="dump"
          onViewChange={() => {}}
          onDumpOpen={() => {}}
          theme={theme}
          onThemeToggle={toggleTheme}
        />
        <DumpScreen dump={dump} onDone={handleFirstVisitDone} />
      </div>
    )
  }

  const activeDragMeta = activeDragItem
    ? activeDragItem.type === 'backlog'
      ? { duration: activeDragItem.item?.duration ?? 30, is_mit: activeDragItem.item?.is_mit ?? false, done: activeDragItem.item?.done ?? false }
      : taskMeta.getMeta(activeDragItem.task?.id)
    : null

  const activeDragText = activeDragItem?.type === 'backlog'
    ? activeDragItem.item?.text
    : activeDragItem?.task?.text

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--bg)',
      color: 'var(--text-1)',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <TopBar
        activeView={view}
        onViewChange={setView}
        onDumpOpen={() => setDumpOpen(true)}
        theme={theme}
        onThemeToggle={toggleTheme}
      />

      {view === 'reset' ? (
        <ResetScreen
          week={weekData.week}
          getMeta={getMeta}
          backlogItems={backlog.items}
          dumpAddItem={dump.addItem}
          onReset={handleReset}
          onClose={() => setView('week')}
        />
      ) : (
        <>
          <MITsRow
            week={weekData.week}
            weekStart={weekData.weekStart}
            setMITs={weekData.setMITs}
            allMITs={allMITs}
          />

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              <ThisWeekPanel
                open={true}
                items={backlog.items}
                count={backlog.count}
                isAtCapacity={backlog.isAtCapacity}
                mitCount={mitCount}
                getMeta={getMeta}
                onAddItem={backlog.addItem}
                onRemoveItem={backlog.removeItem}
                onUpdateItem={backlog.updateItem}
                onMoveToSomeday={moveBacklogToDump}
                onMoveOverflowToDump={moveOverflowToDump}
              />

              <WeekView
                week={weekData.week}
                weekStart={weekData.weekStart}
                getMeta={getMeta}
                setTaskMeta={setTaskMetaFn}
                mitCount={mitCount}
                onAddSlot={weekData.addSlot}
                onRemoveSlot={weekData.removeSlot}
                onMoveToSomeday={moveSlotToDump}
              />
            </div>

            <DragOverlay dropAnimation={null}>
              {activeDragItem && activeDragText && (
                <TaskCardBase
                  taskId={activeDragItem.item?.id ?? activeDragItem.task?.id}
                  text={activeDragText}
                  meta={activeDragMeta}
                  mitCount={mitCount}
                  isDragOverlay={true}
                />
              )}
            </DragOverlay>
          </DndContext>
        </>
      )}

      <DumpPanel
        open={dumpOpen}
        onClose={() => setDumpOpen(false)}
        dump={dump}
      />

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(prev => !prev)}
        user={user}
        signInWithEmail={signInWithEmail}
        signOut={signOut}
      />
    </div>
  )
}
