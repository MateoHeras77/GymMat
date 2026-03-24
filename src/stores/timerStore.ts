import { create } from "zustand"
import { startSilentLoop, playAlarm, stopAudio } from "@/lib/audioManager"
import {
  registerTimerActions,
  updateTimerMetadata,
  setPlaybackState,
  clearSession,
} from "@/lib/mediaSessionManager"

export interface TimerContext {
  exerciseName?: string
  setInfo?: string
}

interface TimerState {
  isRunning: boolean
  totalSeconds: number
  remainingSeconds: number
  intervalId: number | null
  endsAt: number | null
  context: TimerContext | null

  startTimer: (seconds: number, context?: TimerContext) => void
  stopTimer: () => void
  resetTimer: () => void
  skipRest: () => void
  addTime: (seconds: number) => void
}

export const useTimerStore = create<TimerState>()((set, get) => ({
  isRunning: false,
  totalSeconds: 0,
  remainingSeconds: 0,
  intervalId: null,
  endsAt: null,
  context: null,

  startTimer: (seconds: number, context?: TimerContext) => {
    const state = get()
    if (state.intervalId) {
      clearInterval(state.intervalId)
    }

    const endsAt = Date.now() + seconds * 1000

    // Start silent audio loop (keeps iOS audio session alive in background)
    startSilentLoop()

    // Register lock screen controls
    registerTimerActions({
      onPause: () => get().stopTimer(),
      onPlay: () => {
        // Resume: recalculate endsAt from remaining
        const s = get()
        if (!s.isRunning && s.remainingSeconds > 0) {
          s.startTimer(s.remainingSeconds, s.context ?? undefined)
        }
      },
      onSkip: () => get().skipRest(),
      onAddTime: () => get().addTime(30),
    })

    // Set initial lock screen metadata
    updateTimerMetadata(seconds, seconds, context)
    setPlaybackState("playing")

    const id = window.setInterval(() => {
      const current = get()
      if (!current.endsAt) return

      const remaining = Math.max(0, Math.ceil((current.endsAt - Date.now()) / 1000))

      if (remaining <= 0) {
        clearInterval(current.intervalId!)
        set({ isRunning: false, remainingSeconds: 0, intervalId: null, endsAt: null })

        // Alert: vibrate + alarm sound
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200, 100, 200])
        }
        playAlarm()

        // Update lock screen to "Rest Complete!"
        updateTimerMetadata(0, current.totalSeconds, current.context ?? undefined)
        setPlaybackState("paused")
      } else {
        set({ remainingSeconds: remaining })
        // Update lock screen countdown
        updateTimerMetadata(remaining, current.totalSeconds, current.context ?? undefined)
      }
    }, 1000)

    set({
      isRunning: true,
      totalSeconds: seconds,
      remainingSeconds: seconds,
      intervalId: id,
      endsAt,
      context: context ?? null,
    })
  },

  stopTimer: () => {
    const state = get()
    if (state.intervalId) {
      clearInterval(state.intervalId)
    }
    set({ isRunning: false, intervalId: null, endsAt: null })
    setPlaybackState("paused")
  },

  resetTimer: () => {
    const state = get()
    if (state.intervalId) {
      clearInterval(state.intervalId)
    }
    stopAudio()
    clearSession()
    set({
      isRunning: false,
      totalSeconds: 0,
      remainingSeconds: 0,
      intervalId: null,
      endsAt: null,
      context: null,
    })
  },

  skipRest: () => {
    const state = get()
    if (state.intervalId) {
      clearInterval(state.intervalId)
    }
    stopAudio()
    clearSession()
    set({
      isRunning: false,
      totalSeconds: 0,
      remainingSeconds: 0,
      intervalId: null,
      endsAt: null,
      context: null,
    })
  },

  addTime: (seconds: number) => {
    const state = get()
    if (!state.endsAt) return
    const newEndsAt = state.endsAt + seconds * 1000
    const newTotal = state.totalSeconds + seconds
    const newRemaining = Math.max(0, Math.ceil((newEndsAt - Date.now()) / 1000))
    set({
      endsAt: newEndsAt,
      totalSeconds: newTotal,
      remainingSeconds: newRemaining,
    })
    updateTimerMetadata(newRemaining, newTotal, state.context ?? undefined)
  },
}))
