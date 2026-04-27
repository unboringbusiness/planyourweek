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
import { useProjects } from './hooks/useProjects'
import { useLists } from './hooks/useLists'
import { useTaskMeta } from './hooks/useTaskMeta'
import { useTimer } from './hooks/useTimer'
import { LIMITS } from './lib/limits'

import TopBar from './components/layout/TopBar'
import LeftPanel from './components/layout/LeftPanel'
import MITsRow from './components/layout/MITsRow'
import WeekView from './components/week/WeekView'
import { TaskCardBase } from './components/week/TaskCard'
import FloatingTimer from './components/week/FloatingTimer'
import TaskDetailModal from './components/week/TaskDetailModal'
import DumpPanel from './components/dump/DumpPanel'
import ResetScreen from './components/reset/ResetScreen'
import SettingsPanel from './components/settings/SettingsPanel'
import StartupRitual from './components/rituals/StartupRitual'
import ShutdownRitual from './components/rituals/ShutdownRitual'
import Onboarding from './components/onboarding/Onboarding'

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

export default function App() {
  const { user, loading: authLoading, signInWithEmail, signOut } = useAuth()
  const dump = useDump(user)
  const weekData = useWeek(user)
  const backlog = useBacklog()
  const projectsHook = useProjects(user)
  const listsHook = useLists()
  const taskMeta = useTaskMeta()
  const timerHook = useTimer()

  const [theme, setTheme] = useState(getStoredTheme)
  const [view, setView] = useState('week')
  const [dumpOpen, setDumpOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [activeDragItem, setActiveDragItem] = useState(null)

  // Ritual state: stores { dayKey } when open, null when closed
  const [startupRitualDay, setStartupRitualDay] = useState(null)
  const [shutdownRitualDay, setShutdownRitualDay] = useState(null)

  // Task detail modal state
  const [detailModal, setDetailModal] = useState(null) // { task, day, slotType }

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem('pyw_onboarded')
  )

  // Apply theme to document
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('pyw_theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

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

  const moveListItemToSection = async (item, day, slotType) => {
    const sectionTasks = weekData.week?.slots?.[day]?.[slotType] ?? []
    if (sectionTasks.length >= (SLOT_LIMITS[slotType] ?? 99)) return false

    const { data: newTask } = await weekData.addSlot(day, slotType, item.text)
    if (newTask) {
      taskMeta.setTaskMeta(newTask.id, { duration: item.duration ?? 30 })
    }
    listsHook.removeItem(item.id)
    return true
  }

  const moveDumpItemToSection = async (item, day, slotType) => {
    const sectionTasks = weekData.week?.slots?.[day]?.[slotType] ?? []
    if (sectionTasks.length >= (SLOT_LIMITS[slotType] ?? 99)) return false

    const { data: newTask } = await weekData.addSlot(day, slotType, item.text)
    if (newTask) {
      taskMeta.setTaskMeta(newTask.id, { duration: 30 })
    }
    dump.removeItem(item.id)
    return true
  }

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

  // Move a slot task to tomorrow (same slot type)
  const handleMoveToTomorrow = async (task, fromDay, fromSlotType, toDay, toSlotType) => {
    await moveSlotToSection(task, fromDay, fromSlotType, toDay, toSlotType)
  }

  // Open task detail modal
  const handleOpenDetail = (task, day, slotType) => {
    setDetailModal({ task, day, slotType })
  }

  // Save detail changes
  const handleDetailSave = (taskId, changes) => {
    taskMeta.setTaskMeta(taskId, changes)
    setDetailModal(null)
  }

  // Start timer from a task
  const handleStartTimer = (taskId, text, duration) => {
    timerHook.start(taskId, text, duration)
  }

  // Timer completion
  const handleTimerComplete = () => {
    if (timerHook.timer?.taskId) {
      taskMeta.setTaskMeta(timerHook.timer.taskId, { done: true })
    }
    timerHook.stop()
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

    // Custom list item dropped onto a day column section
    if (activeData.type === 'list_item') {
      const item = activeData.item
      if (overData?.type === 'section') {
        await moveListItemToSection(item, overData.day, overData.slotType)
        return
      }
      if (overData?.type === 'slot') {
        await moveListItemToSection(item, overData.day, overData.slotType)
        return
      }
    }

    // Dump item dropped onto a day column section
    if (activeData.type === 'dump') {
      const item = activeData.item

      if (overData?.type === 'section') {
        await moveDumpItemToSection(item, overData.day, overData.slotType)
        return
      }
      if (overData?.type === 'slot') {
        await moveDumpItemToSection(item, overData.day, overData.slotType)
        return
      }
      if (overData?.type === 'dump') {
        const oldIdx = dump.items.findIndex(i => i.id === active.id)
        const newIdx = dump.items.findIndex(i => i.id === over.id)
        if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
          dump.reorderItems(arrayMove(dump.items, oldIdx, newIdx))
        }
        return
      }
    }

    // Backlog item dropped somewhere (kept for reset flow compatibility)
    if (activeData.type === 'backlog') {
      const item = activeData.item

      if (overData?.type === 'section') {
        await moveBacklogItemToSection(item, overData.day, overData.slotType)
        return
      }
      if (overData?.type === 'slot') {
        await moveBacklogItemToSection(item, overData.day, overData.slotType)
        return
      }
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

      if (overData?.type === 'section') {
        await moveSlotToSection(task, fromDay, fromType, overData.day, overData.slotType)
        return
      }

      if (overData?.type === 'slot') {
        const { day: toDay, slotType: toType } = overData

        if (fromDay === toDay && fromType === toType) {
          const section = weekData.week?.slots?.[fromDay]?.[fromType] ?? []
          const oldIdx = section.findIndex(t => t.id === active.id)
          const newIdx = section.findIndex(t => t.id === over.id)
          if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
            weekData.reorderSlots(fromDay, fromType, arrayMove(section, oldIdx, newIdx))
          }
        } else {
          await moveSlotToSection(task, fromDay, fromType, toDay, toType)
        }
        return
      }
    }
  }

  // --- Weekly reset handler ---
  const handleReset = (nextWeekTasks = []) => {
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
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--bg)', color: 'var(--text-2)', fontSize: 14,
      }}>
        Loading…
      </div>
    )
  }

  const activeDragMeta = activeDragItem
    ? ['backlog', 'dump', 'list_item'].includes(activeDragItem.type)
      ? { duration: activeDragItem.item?.duration ?? 30, is_mit: false, done: false }
      : taskMeta.getMeta(activeDragItem.task?.id)
    : null

  const activeDragText = ['backlog', 'dump', 'list_item'].includes(activeDragItem?.type)
    ? activeDragItem.item?.text
    : activeDragItem?.task?.text

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'var(--bg)', color: 'var(--text-1)',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <TopBar
        activeView={view}
        onViewChange={setView}
        onDumpOpen={() => setDumpOpen(true)}
        theme={theme}
        onThemeToggle={toggleTheme}
        onHelpOpen={() => setShowOnboarding(true)}
        onScrollToToday={() => {
          const todayEl = document.querySelector('[data-today="true"]')
          if (todayEl) {
            const scrollEl = todayEl.closest('[data-scroll-container]')
            if (scrollEl) {
              const containerRect = scrollEl.getBoundingClientRect()
              const elRect = todayEl.getBoundingClientRect()
              scrollEl.scrollLeft += elRect.left - containerRect.left
            }
          }
        }}
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              <LeftPanel dump={dump} listsHook={listsHook} />

              {/* Right column: milestone row + week columns */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <MITsRow
                  week={weekData.week}
                  weekStart={weekData.weekStart}
                  setMITs={weekData.setMITs}
                  allMITs={allMITs}
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
                  onMoveToTomorrow={handleMoveToTomorrow}
                  onOpenDetail={handleOpenDetail}
                  onStartTimer={handleStartTimer}
                  onStartupRitual={(dayKey) => setStartupRitualDay(dayKey)}
                  onShutdownRitual={(dayKey) => setShutdownRitualDay(dayKey)}
                  timerHook={timerHook}
                />
              </div>
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
      )}

      {/* Panels */}
      <DumpPanel
        open={dumpOpen}
        onClose={() => setDumpOpen(false)}
        dump={dump}
        onMoveToWeek={async (item) => {
          const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
          const todayKey = days[new Date().getDay()]
          await weekData.addSlot(todayKey, 'admin', item.text)
          dump.removeItem(item.id)
        }}
      />

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(prev => !prev)}
        user={user}
        signInWithEmail={signInWithEmail}
        signOut={signOut}
      />

      {/* Floating timer */}
      {timerHook.timer?.running && (
        <FloatingTimer
          timer={timerHook.timer}
          onComplete={handleTimerComplete}
          onPause={timerHook.pause}
          onResume={timerHook.resume}
          onStop={timerHook.stop}
        />
      )}

      {/* Task detail modal */}
      {detailModal && (
        <TaskDetailModal
          task={detailModal.task}
          meta={getMeta(detailModal.task.id)}
          onUpdate={(changes) => handleDetailSave(detailModal.task.id, changes)}
          onClose={() => setDetailModal(null)}
          onStartTimer={() => {
            const meta = getMeta(detailModal.task.id)
            handleStartTimer(detailModal.task.id, detailModal.task.text, meta.duration ?? 30)
            setDetailModal(null)
          }}
        />
      )}

      {/* Daily startup ritual */}
      {startupRitualDay && (
        <StartupRitual
          dayKey={startupRitualDay}
          week={weekData.week}
          dump={dump}
          getMeta={getMeta}
          setTaskMeta={setTaskMetaFn}
          onAddSlot={weekData.addSlot}
          onClose={() => setStartupRitualDay(null)}
        />
      )}

      {/* Daily shutdown ritual */}
      {shutdownRitualDay && (
        <ShutdownRitual
          dayKey={shutdownRitualDay}
          week={weekData.week}
          getMeta={getMeta}
          setTaskMeta={setTaskMetaFn}
          onAddSlot={weekData.addSlot}
          onRemoveSlot={weekData.removeSlot}
          onMoveToDump={async (task) => { await dump.addItem(task.text) }}
          onClose={() => setShutdownRitualDay(null)}
        />
      )}

      {/* Onboarding walkthrough */}
      {showOnboarding && (
        <Onboarding onClose={() => setShowOnboarding(false)} />
      )}
    </div>
  )
}
