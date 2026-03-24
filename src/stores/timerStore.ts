import { create } from "zustand"

interface TimerState {
  isRunning: boolean
  totalSeconds: number
  remainingSeconds: number
  intervalId: number | null

  startTimer: (seconds: number) => void
  stopTimer: () => void
  resetTimer: () => void
}

export const useTimerStore = create<TimerState>()((set, get) => ({
  isRunning: false,
  totalSeconds: 0,
  remainingSeconds: 0,
  intervalId: null,

  startTimer: (seconds: number) => {
    const state = get()
    if (state.intervalId) {
      clearInterval(state.intervalId)
    }

    const id = window.setInterval(() => {
      const current = get()
      if (current.remainingSeconds <= 1) {
        // Timer done
        clearInterval(current.intervalId!)
        set({ isRunning: false, remainingSeconds: 0, intervalId: null })

        // Vibrate if available
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200, 100, 200])
        }
      } else {
        set({ remainingSeconds: current.remainingSeconds - 1 })
      }
    }, 1000)

    set({
      isRunning: true,
      totalSeconds: seconds,
      remainingSeconds: seconds,
      intervalId: id,
    })
  },

  stopTimer: () => {
    const state = get()
    if (state.intervalId) {
      clearInterval(state.intervalId)
    }
    set({ isRunning: false, intervalId: null })
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
    })
  },
}))
