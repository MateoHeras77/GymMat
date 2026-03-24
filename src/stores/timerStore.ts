import { create } from "zustand"

// ─── Timer sound (Web Audio API) ───

function playTimerSound() {
  try {
    const ctx = new AudioContext()
    const playBeep = (time: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 880
      osc.type = "sine"
      gain.gain.setValueAtTime(0.3, time)
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15)
      osc.start(time)
      osc.stop(time + 0.15)
    }
    // Two short beeps
    playBeep(ctx.currentTime)
    playBeep(ctx.currentTime + 0.25)
  } catch {
    // AudioContext not available — silent fallback
  }
}

// ─── Background notification ───

function notifyIfBackground() {
  if (document.hidden && "Notification" in window && Notification.permission === "granted") {
    new Notification("Rest Complete!", {
      body: "Time for your next set",
      icon: "/icons/icon-192.png",
      tag: "rest-timer",
    })
  }
}

// ─── Timer store ───

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

        // Alert user: vibrate + sound + notification
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200, 100, 200])
        }
        playTimerSound()
        notifyIfBackground()
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
