/**
 * Media Session API manager for lock screen / Control Center integration.
 *
 * Shows "Now Playing" widget on iOS lock screen, Always-On Display, and Control Center.
 * Maps media transport controls to timer actions:
 *   Play/Pause → pause/resume timer
 *   Next Track (>>) → skip rest
 *   Previous Track (<<) → add 30 seconds
 */

import { formatTimerDisplay } from "@/lib/constants"

const hasMediaSession = typeof navigator !== "undefined" && "mediaSession" in navigator

interface TimerActionHandlers {
  onPause: () => void
  onPlay: () => void
  onSkip: () => void
  onAddTime: () => void
}

/**
 * Register action handlers for lock screen controls.
 */
export function registerTimerActions(handlers: TimerActionHandlers): void {
  if (!hasMediaSession) return

  navigator.mediaSession.setActionHandler("pause", handlers.onPause)
  navigator.mediaSession.setActionHandler("play", handlers.onPlay)
  navigator.mediaSession.setActionHandler("nexttrack", handlers.onSkip)
  navigator.mediaSession.setActionHandler("previoustrack", handlers.onAddTime)
}

/**
 * Update lock screen metadata with current timer state.
 */
export function updateTimerMetadata(
  remainingSeconds: number,
  totalSeconds: number,
  exerciseContext?: { exerciseName?: string; setInfo?: string }
): void {
  if (!hasMediaSession) return

  const timeStr = formatTimerDisplay(remainingSeconds)
  const title = remainingSeconds > 0 ? `Rest — ${timeStr}` : "Rest Complete!"
  const artist = exerciseContext
    ? [exerciseContext.exerciseName, exerciseContext.setInfo].filter(Boolean).join(" · ")
    : "GymMat"

  navigator.mediaSession.metadata = new MediaMetadata({
    title,
    artist,
    album: "GymMat",
    artwork: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  })

  // Update progress bar on lock screen
  try {
    const elapsed = totalSeconds - remainingSeconds
    navigator.mediaSession.setPositionState({
      duration: totalSeconds,
      position: Math.min(elapsed, totalSeconds),
      playbackRate: 1,
    })
  } catch {
    // setPositionState may throw on some browsers
  }
}

/**
 * Set playback state (shows play or pause button on lock screen).
 */
export function setPlaybackState(state: "playing" | "paused" | "none"): void {
  if (!hasMediaSession) return
  navigator.mediaSession.playbackState = state
}

/**
 * Clear all Media Session metadata and action handlers.
 */
export function clearSession(): void {
  if (!hasMediaSession) return

  navigator.mediaSession.metadata = null
  navigator.mediaSession.playbackState = "none"
  navigator.mediaSession.setActionHandler("pause", null)
  navigator.mediaSession.setActionHandler("play", null)
  navigator.mediaSession.setActionHandler("nexttrack", null)
  navigator.mediaSession.setActionHandler("previoustrack", null)

  try {
    navigator.mediaSession.setPositionState()
  } catch {}
}
