import { create } from "zustand"
import { playTimerBeep } from "@/lib/audioManager"

interface TimerState {
  isRunning: boolean
  totalSeconds: number
  remainingSeconds: number
  intervalId: number | null
  /** Wall-clock timestamp (ms) when the timer should finish */
  endsAt: number | null

  startTimer: (seconds: number) => void
  stopTimer: () => void
  resetTimer: () => void
}

export const useTimerStore = create<TimerState>()((set, get) => ({
  isRunning: false,
  totalSeconds: 0,
  remainingSeconds: 0,
  intervalId: null,
  endsAt: null,

  startTimer: (seconds: number) => {
    const state = get()
    if (state.intervalId) {
      clearInterval(state.intervalId)
    }

    const endsAt = Date.now() + seconds * 1000

    /* iOS PWA workaround: use wall-clock comparison instead of decrementing a counter.
       iOS Safari throttles setInterval to ~60s+ when the tab is backgrounded or the
       screen is locked. By comparing against Date.now() on each tick, the timer
       "catches up" instantly when the user returns to the app. */
    const id = window.setInterval(() => {
      const current = get()
      if (!current.endsAt) return

      const remaining = Math.max(0, Math.ceil((current.endsAt - Date.now()) / 1000))

      if (remaining <= 0) {
        // Timer done
        clearInterval(current.intervalId!)
        set({ isRunning: false, remainingSeconds: 0, intervalId: null, endsAt: null })

        // Alert user: vibrate (Android) + sound (all platforms)
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200, 100, 200])
        }
        playTimerBeep()
      } else {
        set({ remainingSeconds: remaining })
      }
    }, 1000)

    set({
      isRunning: true,
      totalSeconds: seconds,
      remainingSeconds: seconds,
      intervalId: id,
      endsAt,
    })
  },

  stopTimer: () => {
    const state = get()
    if (state.intervalId) {
      clearInterval(state.intervalId)
    }
    set({ isRunning: false, intervalId: null, endsAt: null })
  },

  resetTimer: () => {
    const state = get()
    if (state.intervalId) {
      clearInterval(state.intervalId)
    }
    set({
      isRunning: false,
      totalSeconds: 0,
      remainingSeconds: 0,
      intervalId: null,
      endsAt: null,
    })
  },
}))
