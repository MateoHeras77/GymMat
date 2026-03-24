/**
 * Audio manager for iOS-compatible timer with background playback.
 *
 * Strategy:
 * 1. On first user touch: unlock AudioContext + prime HTML5 audio
 * 2. When rest timer starts: play silent MP3 on loop (keeps iOS audio session alive in background)
 * 3. When rest timer ends: swap to notification.wav alarm
 * 4. When timer dismissed: stop audio
 */

let audioCtx: AudioContext | null = null
let mediaAudio: HTMLAudioElement | null = null
let unlocked = false

function getContext(): AudioContext {
  if (!audioCtx) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    audioCtx = new Ctx()
  }
  return audioCtx
}

function getMediaAudio(): HTMLAudioElement {
  if (!mediaAudio) {
    mediaAudio = new Audio()
    mediaAudio.volume = 1.0
  }
  return mediaAudio
}

/**
 * Must be called from a user gesture (tap/click) to unlock iOS audio.
 */
export function unlockAudio(): void {
  if (unlocked) return
  unlocked = true

  const ctx = getContext()
  if (ctx.state === "suspended") ctx.resume()

  // Play silent buffer to warm up iOS audio pipeline
  const buffer = ctx.createBuffer(1, 1, 22050)
  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.connect(ctx.destination)
  source.start(0)

  // Prime the HTML5 audio element
  const audio = getMediaAudio()
  audio.src = "/sounds/silence.mp3"
  audio.play().then(() => {
    audio.pause()
    audio.currentTime = 0
  }).catch(() => {})
}

/**
 * Start playing silent audio on loop. Keeps iOS audio session alive
 * so the timer continues in background and Media Session shows on lock screen.
 */
export function startSilentLoop(): void {
  const audio = getMediaAudio()
  audio.src = "/sounds/silence.mp3"
  audio.loop = true
  audio.volume = 0.01 // near-silent but keeps session alive
  audio.play().catch(() => {})
}

/**
 * Play the alarm sound when rest timer ends.
 * Swaps the looping audio to the notification sound.
 */
export function playAlarm(): void {
  const audio = getMediaAudio()
  audio.loop = false
  audio.volume = 1.0
  audio.src = "/sounds/notification.wav"
  audio.currentTime = 0
  audio.play().catch(() => {})

  // Also play Web Audio beep as backup (for when media audio is blocked)
  try {
    const ctx = getContext()
    if (ctx.state === "suspended") ctx.resume()
    const playTone = (time: number) => {
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
    playTone(ctx.currentTime)
    playTone(ctx.currentTime + 0.25)
  } catch {}
}

/**
 * Stop all audio playback.
 */
export function stopAudio(): void {
  const audio = getMediaAudio()
  audio.pause()
  audio.currentTime = 0
  audio.loop = false
}
