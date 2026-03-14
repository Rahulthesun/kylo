// src/hooks/useTimer.ts
// Timestamp-based timer — accurate across minimizes, app switches, reloads.
// Persists start time in localStorage so it survives HMR and re-mounts.

import { useState, useEffect, useRef, useCallback } from 'react'

const STORAGE_KEY = 'kylo_timer_state'

interface TimerState {
  startedAt: number      // Date.now() when timer started
  totalSeconds: number   // original duration in seconds
  pausedAt: number | null // Date.now() when paused, null if running
  pausedSecondsLeft: number | null // seconds remaining when paused
  sessionIndex: number
  taskId: string | null
  taskTitle: string | null
}

function loadState(): TimerState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveState(state: TimerState | null) {
  if (state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

function computeSecondsLeft(state: TimerState): number {
  if (state.pausedAt !== null && state.pausedSecondsLeft !== null) {
    return state.pausedSecondsLeft
  }
  const elapsed = Math.floor((Date.now() - state.startedAt) / 1000)
  return Math.max(0, state.totalSeconds - elapsed)
}

export function useTimer() {
  const [timerState, setTimerState] = useState<TimerState | null>(loadState)
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    const s = loadState()
    return s ? computeSecondsLeft(s) : 0
  })
  const rafRef = useRef<number | null>(null)

  const tick = useCallback(() => {
    const s = loadState()
    if (!s || s.pausedAt !== null) return
    const left = computeSecondsLeft(s)
    setSecondsLeft(left)
    if (left > 0) {
      rafRef.current = requestAnimationFrame(tick)
    } else {
      // Timer finished
      saveState(null)
      setTimerState(null)
    }
  }, [])

  // Start/resume tick loop when running
  useEffect(() => {
    if (timerState && timerState.pausedAt === null) {
      rafRef.current = requestAnimationFrame(tick)
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [timerState?.pausedAt, tick])

  // Re-sync on visibility change (tab/app focus restored)
  useEffect(() => {
    const onVisible = () => {
      const s = loadState()
      if (s) {
        setSecondsLeft(computeSecondsLeft(s))
        setTimerState(s)
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [])

  const start = useCallback((taskId: string, taskTitle: string, durationMinutes: number, sessionIndex = 1) => {
    const totalSeconds = durationMinutes * 60
    const state: TimerState = {
      startedAt: Date.now(),
      totalSeconds,
      pausedAt: null,
      pausedSecondsLeft: null,
      sessionIndex,
      taskId,
      taskTitle,
    }
    saveState(state)
    setTimerState(state)
    setSecondsLeft(totalSeconds)
  }, [])

  const pause = useCallback(() => {
    const s = loadState()
    if (!s || s.pausedAt !== null) return
    const left = computeSecondsLeft(s)
    const updated: TimerState = { ...s, pausedAt: Date.now(), pausedSecondsLeft: left }
    saveState(updated)
    setTimerState(updated)
    setSecondsLeft(left)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
  }, [])

  const resume = useCallback(() => {
    const s = loadState()
    if (!s || s.pausedAt === null || s.pausedSecondsLeft === null) return
    const updated: TimerState = {
      ...s,
      startedAt: Date.now() - (s.totalSeconds - s.pausedSecondsLeft) * 1000,
      pausedAt: null,
      pausedSecondsLeft: null,
    }
    saveState(updated)
    setTimerState(updated)
  }, [])

  const reset = useCallback(() => {
    const s = loadState()
    if (!s) return
    const updated: TimerState = {
      ...s,
      startedAt: Date.now(),
      pausedAt: null,
      pausedSecondsLeft: null,
    }
    saveState(updated)
    setTimerState(updated)
    setSecondsLeft(s.totalSeconds)
  }, [])

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    saveState(null)
    setTimerState(null)
    setSecondsLeft(0)
  }, [])

  const isRunning = !!timerState && timerState.pausedAt === null
  const isActive  = !!timerState

  return {
    secondsLeft,
    isRunning,
    isActive,
    timerState,
    start,
    pause,
    resume,
    reset,
    stop,
    togglePlay: isRunning ? pause : resume,
  }
}