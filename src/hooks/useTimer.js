import { useState, useEffect, useRef, useCallback } from 'react'

const KEY = 'pyw_timer'

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) ?? null }
  catch { return null }
}

function save(state) {
  try {
    if (state) localStorage.setItem(KEY, JSON.stringify(state))
    else localStorage.removeItem(KEY)
  } catch {}
}

export function useTimer() {
  const [timer, setTimer] = useState(() => {
    const saved = load()
    if (!saved) return null
    // If was running, compute elapsed offset
    if (saved.running && saved.startedAt) {
      return { ...saved, elapsed: saved.baseElapsed + (Date.now() - saved.startedAt) }
    }
    return saved
  })
  const intervalRef = useRef(null)

  const tick = useCallback(() => {
    setTimer(prev => {
      if (!prev || !prev.running) return prev
      return { ...prev, elapsed: prev.baseElapsed + (Date.now() - prev.startedAt) }
    })
  }, [])

  useEffect(() => {
    if (timer?.running) {
      intervalRef.current = setInterval(tick, 500)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [timer?.running, tick])

  // Persist on change
  useEffect(() => {
    save(timer)
  }, [timer])

  const start = useCallback((taskId, taskText) => {
    const now = Date.now()
    setTimer({ taskId, taskText, running: true, startedAt: now, baseElapsed: 0, elapsed: 0 })
  }, [])

  const pause = useCallback(() => {
    setTimer(prev => {
      if (!prev) return null
      const elapsed = prev.baseElapsed + (Date.now() - prev.startedAt)
      return { ...prev, running: false, baseElapsed: elapsed, elapsed }
    })
  }, [])

  const resume = useCallback(() => {
    setTimer(prev => {
      if (!prev) return null
      return { ...prev, running: true, startedAt: Date.now() }
    })
  }, [])

  const stop = useCallback(() => {
    setTimer(null)
  }, [])

  return { timer, start, pause, resume, stop }
}
