import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useDump } from './hooks/useDump'
import { useProjects } from './hooks/useProjects'
import { useWeek } from './hooks/useWeek'
import { isToday } from './lib/dates'

import TopBar from './components/layout/TopBar'
import DumpPanel from './components/layout/DumpPanel'
import MITsRow from './components/layout/MITsRow'
import WeekView from './components/week/WeekView'
import DayView from './components/week/DayView'
import SettingsPanel from './components/settings/SettingsPanel'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

function getTodayKey() {
  const dayIdx = new Date().getDay() // 0=Sun
  const mapped = dayIdx === 0 ? 6 : dayIdx - 1 // Mon=0...Sun=6
  return DAYS[mapped]
}

const S = {
  app: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: '#FAF4ED',
    color: '#133950',
    fontFamily: "'DM Sans', sans-serif",
    overflow: 'hidden',
  },
  body: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minWidth: 0,
  },
  loadingScreen: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    color: '#6B6B6B',
    fontSize: 14,
    background: '#FAF4ED',
  },
}

export default function App() {
  const { user, loading: authLoading, signInWithEmail, signOut } = useAuth()
  const dump = useDump(user)
  const projects = useProjects(user)
  const weekData = useWeek(user)

  const [view, setView] = useState('week') // 'week' | 'day'
  const [activeDay, setActiveDay] = useState(getTodayKey)
  const [dumpOpen, setDumpOpen] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)

  if (authLoading) {
    return <div style={S.loadingScreen}>Loading…</div>
  }

  const handleReset = () => {
    if (window.confirm('Reset this week? All tasks and MITs will be cleared.')) {
      weekData.setMITs(['', '', ''])
      // Slot clearing would need full week reset — stubs until full hook supports it
    }
  }

  const handleDayView = (dayKey) => {
    setActiveDay(dayKey)
    setView('day')
  }

  return (
    <div style={S.app}>
      <TopBar
        activeView={view}
        onViewChange={setView}
        dumpOpen={dumpOpen}
        onDumpToggle={() => setDumpOpen(prev => !prev)}
        onSettingsOpen={() => setSettingsOpen(true)}
        onReset={handleReset}
      />

      <MITsRow
        week={weekData.week}
        setMITs={weekData.setMITs}
        weekStart={weekData.weekStart}
      />

      <div style={S.body}>
        <DumpPanel
          open={dumpOpen}
          items={dump.items}
          addItem={dump.addItem}
          removeItem={dump.removeItem}
          reorderItems={dump.reorderItems}
          isFull={dump.isFull}
          count={dump.count}
        />

        <main style={S.main}>
          {view === 'week' ? (
            <WeekView
              week={weekData.week}
              weekStart={weekData.weekStart}
              onAddSlot={weekData.addSlot}
              onRemoveSlot={weekData.removeSlot}
              onDayView={handleDayView}
            />
          ) : (
            <DayView
              week={weekData.week}
              weekStart={weekData.weekStart}
              activeDay={activeDay}
              onSetDay={setActiveDay}
              onWeekView={() => setView('week')}
              onAddSlot={weekData.addSlot}
              onRemoveSlot={weekData.removeSlot}
            />
          )}
        </main>
      </div>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        user={user}
        signInWithEmail={signInWithEmail}
        signOut={signOut}
      />
    </div>
  )
}
